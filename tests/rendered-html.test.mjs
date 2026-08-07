import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function getWorker(suffix = "") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${suffix}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

function env() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
}

function ctx() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

async function render(path = "/") {
  const worker = await getWorker("render");
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env(), ctx());
}

async function fetchFromWorker(path) {
  const worker = await getWorker(path);
  return worker.fetch(new Request(`http://localhost${path}`), env(), ctx());
}

test("server-renders the phone auth gate before the dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>LA1台股分析室<\/title>/i);
  assert.match(html, /auth-shell/);
  assert.match(html, /LA1 台股分析室/);
  assert.match(html, /手機號註冊/);
  assert.match(html, /登入/);
  assert.match(html, /註冊/);
  assert.match(html, /0912345678/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("quote endpoint is transparent when Fugle key is missing", async () => {
  const response = await fetchFromWorker("/api/quote?symbol=2330");

  assert.equal(response.status, 503);
  const json = await response.json();
  assert.equal(json.ok, false);
  assert.equal(json.code, "missing_fugle_key");
});

test("context endpoint uses the same transparent missing-key behavior", async () => {
  const response = await fetchFromWorker("/api/context?symbol=2330");

  assert.equal(response.status, 503);
  const json = await response.json();
  assert.equal(json.ok, false);
  assert.equal(json.code, "missing_fugle_key");
});

test("analyze endpoint refuses to run without an OpenAI key", async () => {
  const response = await fetchFromWorker("/api/analyze?symbol=2330");

  assert.equal(response.status, 503);
  const json = await response.json();
  assert.equal(json.ok, false);
  assert.equal(json.code, "missing_openai_key");
});

test("phone auth endpoint creates a lightweight user", async () => {
  const worker = await getWorker("auth");
  const response = await worker.fetch(
    new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "register", phone: "0912-345-678", name: "Test User" }),
    }),
    env(),
    ctx(),
  );

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.mode, "register");
  assert.equal(json.phone, "0912***678");
  assert.equal(json.user.id, "phone-0912345678");
  assert.equal(json.user.name, "Test User");
});

test("cloud sync endpoint saves lightweight user data", async () => {
  const response = await fetchFromWorker("/api/sync?userId=test-user");
  assert.equal(response.status, 200);
  const initial = await response.json();
  assert.equal(initial.ok, true);

  const worker = await getWorker("sync-post");
  const saved = await worker.fetch(
    new Request("http://localhost/api/sync?userId=test-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        watchlist: [{ symbol: "2330", name: "台積電", theme: "AI" }],
        alertSettings: { upPercent: 2.5 },
      }),
    }),
    env(),
    ctx(),
  );

  assert.equal(saved.status, 200);
  const json = await saved.json();
  assert.equal(json.ok, true);
  assert.equal(json.snapshot.watchlist[0].symbol, "2330");
  assert.equal(json.snapshot.alertSettings.upPercent, 2.5);
});

test("notify endpoint records notifications without configured channels", async () => {
  const worker = await getWorker("notify");
  const response = await worker.fetch(
    new Request("http://localhost/api/notify?userId=test-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "警報測試", detail: "測試通知" }),
    }),
    env(),
    ctx(),
  );

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.notification.title, "警報測試");
});

test("starter preview code is removed from product files", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview|codex-preview/);
  assert.match(page, /LA1 台股分析室/);
  assert.match(page, /手機號註冊/);
  assert.match(page, /la1-saved-watchlist/);
  assert.match(page, /la1-alert-settings/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
