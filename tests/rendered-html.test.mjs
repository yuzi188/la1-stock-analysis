import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function fetchFromWorker(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the phone auth gate before the dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>LA1\u53f0\u80a1\u5206\u6790\u5ba4<\/title>/i);
  assert.match(html, /auth-shell/);
  assert.match(html, /LA1 \u53f0\u80a1\u5206\u6790\u5ba4/);
  assert.match(html, /\u624b\u6a5f\u865f\u8a3b\u518a/);
  assert.match(html, /\u767b\u5165/);
  assert.match(html, /\u8a3b\u518a/);
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
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()) + "-auth");
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "register", phone: "0912-345-678", name: "Test User" }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
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

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-sync-post`);
  const { default: worker } = await import(workerUrl.href);
  const saved = await worker.fetch(
    new Request("http://localhost/api/sync?userId=test-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        watchlist: [{ symbol: "2330", name: "台積電", theme: "AI" }],
        alertSettings: { upPercent: 2.5 },
      }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(saved.status, 200);
  const json = await saved.json();
  assert.equal(json.ok, true);
  assert.equal(json.snapshot.watchlist[0].symbol, "2330");
  assert.equal(json.snapshot.alertSettings.upPercent, 2.5);
});

test("notify endpoint records notifications without configured channels", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-notify`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/notify?userId=test-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "測試通知", detail: "通知內容" }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.ok, true);
  assert.equal(json.notification.title, "測試通知");
});

test("starter preview code is removed from product files", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview|codex-preview/);
  assert.match(page, /警報設定/);
  assert.match(page, /自選股批次監控/);
  assert.match(page, /la1-alert-settings/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
