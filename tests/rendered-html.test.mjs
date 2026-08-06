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

test("server-renders the paged LA1 dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>LA1台股分析室<\/title>/i);
  assert.match(html, /LA1台股分析室/);
  assert.match(html, /總覽首頁/);
  assert.match(html, /開盤摘要/);
  assert.match(html, /收盤復盤/);
  assert.match(html, /市場脈動/);
  assert.match(html, /主題雷達/);
  assert.match(html, /股票比較/);
  assert.match(html, /法人動向/);
  assert.match(html, /AI 分析中心/);
  assert.match(html, /通知中心/);
  assert.match(html, /投資筆記/);
  assert.match(html, /設定/);
  assert.match(html, /AI 投資決策卡/);
  assert.match(html, /操作結論/);
  assert.match(html, /漲跌警報/);
  assert.match(html, /上漲警報/);
  assert.match(html, /下跌警報/);
  assert.match(html, /市場情緒總覽/);
  assert.match(html, /Live Quote/);
  assert.match(html, /MA5/);
  assert.match(html, /MA20/);
  assert.match(html, /市場總覽指標/);
  assert.doesNotMatch(html, /最新經濟數據/);
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
