# UI Rebuild Audit

本文件是 Phase 0 audit。目的不是重做功能，而是先定義「現有情報系統」的資料鏈路、API、AI 分析、同步、登入與 UI 綁定點，後續 UI/UX 重構必須維持 1:1 功能等價。

核心原則：Replace the interface, not the intelligence system.

## A. 現有前端架構

- Framework：Vinext + Next App Router + React 19。
- Frontend entry：`app/page.tsx`，目前是單一大型 client component。
- Global style：`app/globals.css`，目前包含 base theme、desktop layout、mobile layout、card zoom、dashboard page-specific overrides。
- App metadata / PWA：`app/layout.tsx`、`app/manifest.ts`、`public/manifest.webmanifest`。
- 目前沒有獨立的 `components/` 或 `services/` 目錄。元件、資料型別、UI 狀態、fetch、頁面切換與部分交易判斷都混在 `app/page.tsx`。
- 後端資料核心集中在：
  - `app/lib/market.ts`
  - `app/lib/server-store.ts`

## B. 現有頁面

目前沒有真正的檔案式 route page。所有頁面都在 `/` 內用 `PageKey` 和 `activePage` 切換。

已定義的 PageKey：

- `overview`
- `quote`
- `kline`
- `morning`
- `review`
- `pulse`
- `indices`
- `breadth`
- `sectors`
- `themes`
- `compare`
- `institutions`
- `global`
- `data`
- `ai`
- `risk`
- `notifications`
- `notes`
- `news`
- `watchlist`
- `settings`

目前實際主選單 `navOrder` 只顯示：

- `overview`
- `quote`
- `watchlist`
- `ai`
- `risk`
- `settings`

後續重構要把這些內部頁面逐步遷移成實際 route，例如 `/overview`、`/market-pulse`、`/indices`，但不可先刪除既有 PageKey 對應功能。

## C. 現有元件

目前主要元件都定義在 `app/page.tsx`：

- `StatusPill`
- `PageTitle`
- `Gauge`
- `Donut`
- `MiniTrend`
- `KLineChart`
- `Panel`

目前主要 panel 也都在 `Home()` 內以 JSX 常數定義：

- `homeQuotePanel`
- `quotePanel`
- `decisionPanel`
- `alertPanel`
- `alertSettingsPanel`
- `sentimentPanel`
- `trendPanel`
- `institutionPanel`
- `breadthPanel`
- `targetBreadthPanel`
- `sectorPanel`
- `rankingPanel`
- `downRankingPanel`
- `newsPanel`
- `globalPanel`
- `economyPanel`
- `geopoliticalPanel`
- `situationFeedPanel`
- `aiPanel`
- `signalPanel`
- `watchPanel`
- `watchMonitorPanel`
- `morningPanel`
- `reviewPanel`
- `notificationPanel`
- `notesPanel`
- `themeRadarPanel`
- `comparePanel`
- `cloudPanel`
- `settingsQuickPanel`
- `sourcePanel`

重構方向：

- 拆出 `components/`：`AppShell`、`Sidebar`、`TopStatusBar`、`MobileBottomNav`、`CommandHero`、`Panel`、`MetricCard`、`Gauge`、`Sparkline`、`MarketChart`、`StockDrawer` 等。
- 拆出 `services/`：所有 frontend fetch 都由 service 包裝，不讓 component 直接硬編 endpoint。

## D. 現有 API

現有 API route：

- `GET /api/quote?symbol=2330`
- `GET /api/context?symbol=2330`
- `GET /api/analyze?symbol=2330`
- `GET /api/market`
- `GET /api/geopolitics`
- `GET /api/quote-cache?symbol=2330&ttlMs=30000`
- `POST /api/quote-cache?ttlMs=30000`
- `POST /api/auth`
- `GET /api/user`
- `POST /api/user`
- `GET /api/sync`
- `POST /api/sync`
- `POST /api/scan`
- `POST /api/notify`
- `GET /api/reports?type=morning|review`
- `POST /api/reports?type=morning|review`

## E. 每個 API endpoint

### `/api/quote`

- Method：`GET`
- Query：`symbol`
- Source：`getFugleQuote(symbol)`
- External source：Fugle intraday quote API。
- Success：`{ ok: true, quote }`
- Error：`{ ok: false, error, code }`
- 重要錯誤碼：`missing_symbol`、`missing_fugle_key`、`fugle_error`、`quote_error`

### `/api/context`

- Method：`GET`
- Query：`symbol`
- Source：`getMarketContext(symbol)`
- External sources：Fugle quote、Fugle historical candles、TWSE revenue OpenAPI、TWSE news OpenAPI。
- Success：`{ ok: true, context }`
- Error：`{ ok: false, error, code }`

### `/api/analyze`

- Method：`GET`
- Query：`symbol`
- Source：`getMarketContext(symbol)` + OpenAI Responses API。
- External sources：Fugle、TWSE、OpenAI。
- Success：`{ ok: true, quote, context, analysis, model, generatedAt }`
- Error：`{ ok: false, error, code }`
- 重要錯誤碼：`missing_symbol`、`missing_openai_key`、`openai_error`、`analysis_error`

### `/api/market`

- Method：`GET`
- Source：`getOfficialMarketSummary()`
- External sources：TWSE STOCK_DAY_ALL、TPEx daily close quotes、TWSE MI_INDEX、TPEx index、TWSE T86、TPEx 3insti、Yahoo Finance chart endpoint、DGBAS/stat.gov.tw、U.S. Treasury XML feed。
- Success：`{ ok: true, summary }`
- Error：`{ ok: false, error, code }`

### `/api/geopolitics`

- Method：`GET`
- Source：`getGeopoliticalSituation()`
- External sources：GDELT DOC 2.0 + World Monitor integration metadata。
- Success：`{ ok: true, situation }`
- Error：`{ ok: false, error, code }`

### `/api/quote-cache`

- Method：`GET`
- Query：`symbol`、`ttlMs`
- Source：`getCachedQuote()` then `getFugleQuote()` if cache miss。
- Success：`{ ok: true, quote, cache: "hit" | "miss" }`
- Error：`{ ok: false, error, code }`

- Method：`POST`
- Body：`{ symbols: string[] }`
- Limit：最多 20 檔。
- Success：`{ ok: true, quotes: [{ symbol, ok, quote?, cache?, error? }] }`

### `/api/auth`

- Method：`POST`
- Body：`{ mode: "login" | "register", phone, name? }`
- Auth model：簡易手機號註冊/登入，不需要簡訊驗證。
- User id：`phone-${digits}`
- Success：`{ ok: true, user, phone, mode }`
- Error：`{ ok: false, error, code: "invalid_phone" }`

### `/api/user`

- Method：`GET`
- User identity：`x-la1-user-id` header 或 `userId` query，預設 `demo-user`。
- Success：`{ ok: true, user }`

- Method：`POST`
- Body：`{ email?, name? }`
- Success：`{ ok: true, user }`

### `/api/sync`

- Method：`GET`
- User identity：`x-la1-user-id` header 或 `userId` query。
- Success：`{ ok: true, snapshot }`

- Method：`POST`
- Body：`{ watchlist?, notes?, alertSettings?, readNotificationIds? }`
- Success：`{ ok: true, snapshot }`

### `/api/scan`

- Method：`POST`
- User identity：`x-la1-user-id` header 或 `userId` query。
- Body：`{ symbols?, alertSettings? }`
- Source：watchlist snapshot + cached quotes + Fugle fallback。
- Behavior：依漲跌幅、突破、警報設定產生 scan result，並寫入 notification。
- Success：`{ ok: true, run, result }`

### `/api/notify`

- Method：`POST`
- Body：`{ title?, detail?, tone?, channels? }`
- Channels：`telegram`、`line`、`email`、`webhook`
- Behavior：先寫入站內 notification，再依環境變數嘗試外部推播。
- Success：`{ ok: true, notification, deliveries }`

### `/api/reports`

- Method：`GET`
- Query：`type=morning|review`
- Behavior：即時建立報告並儲存。
- Success：`{ ok: true, report, summary }`

- Method：`POST`
- Header：`x-cron-secret`，如果 `CRON_SECRET` 存在則必須符合。
- Success：`{ ok: true, report, summary }`

## F. 每個 API 回傳資料格式

### Quote

```ts
type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  volume: number | null;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  updatedAt: string | null;
  source: string;
};
```

### MarketContext

```ts
type MarketContext = {
  quote: Quote;
  technical: {
    ma5: number | null;
    ma20: number | null;
    ma60: number | null;
    latestClose: number | null;
    latestDate: string | null;
    pattern: string;
    candles: Candle[];
    source: string;
  };
  revenue: RevenueContext;
  institutional: {
    available: boolean;
    source: string;
    note: string;
  };
  news: NewsContext[];
  generatedAt: string;
};
```

### OfficialMarketSummary

```ts
type OfficialMarketSummary = {
  indices: {
    twse: MarketIndexContext;
    tpex: MarketIndexContext;
  };
  globalMarkets: MarketIndexContext[];
  macroFactors: MacroFactorContext[];
  breadth: MarketBreadthContext;
  institutional: InstitutionalFlowContext;
  rankings: {
    gainers: RankingItem[];
    losers: RankingItem[];
    volume: RankingItem[];
  };
  industryRotation: IndustryRotationContext[];
  generatedAt: string;
};
```

### GeopoliticalSituation

```ts
type GeopoliticalSituation = {
  riskScore: number;
  stance: string;
  events: GeopoliticalEvent[];
  hotspots: GeopoliticalHotspot[];
  worldMonitor: {
    configured: boolean;
    status: "ready" | "needs_key";
    dashboardUrl: string;
    repositoryUrl: string;
    apiBaseUrl: string;
    mcpUrl: string;
    note: string;
  };
  generatedAt: string;
  source: string;
};
```

### Analysis

```ts
type Analysis = {
  conclusion: string;
  stance: string;
  facts: string[];
  scenarios: {
    bullish: string;
    neutral: string;
    bearish: string;
  };
  risks: string[];
  nextChecks: string[];
  disclaimer: string;
};
```

### CloudSnapshot

```ts
type CloudSnapshot = {
  user: CloudUser;
  watchlist: CloudWatchItem[];
  notes: CloudInvestmentNote[];
  alertSettings: AlertSettings;
  readNotificationIds: string[];
  notifications: CloudNotification[];
};
```

## G. 現有 AI 分析流程

目前 AI 分析是個股層級：

1. Frontend 呼叫 `GET /api/analyze?symbol=<symbol>`。
2. Route 清理代號 `cleanSymbol()`。
3. 檢查 `OPENAI_API_KEY`。
4. 呼叫 `getMarketContext(symbol)` 建立完整市場上下文：
   - Fugle 即時報價
   - Fugle K 線與 MA5/MA20/MA60
   - TWSE 月營收
   - TWSE 新聞
   - 個股法人資料目前標示 pending licensed source，不讓 AI 編造
5. `buildPrompt(context)` 把資料塞入 prompt。
6. 呼叫 `https://api.openai.com/v1/responses`。
7. 嘗試 parse JSON 成 `AnalysisResult`。
8. parse 失敗時使用 `fallbackAnalysis(context.quote, outputText)`。
9. 回傳 `quote`、`context`、`analysis`、`model`、`generatedAt`。

重構限制：

- 不可把 `/api/analyze` 換成 mock。
- 不可讓前端自行編造 AI 結論。
- 新 UI 可新增 `analysisService` adapter，但必須仍呼叫現有 endpoint。

## H. 現有 WebSocket / SSE / polling

目前未發現 WebSocket 或 SSE。

現有 realtime 行為是 polling / delayed fetch：

- App 啟動後 `setTimeout(0)` 載入：
  - `/api/market`
  - `/api/geopolitics`
- 登入後 watchlist 每 30 秒輪詢：
  - `POST /api/quote-cache?ttlMs=30000`
- 首次登入或無 quote 時呼叫：
  - `GET /api/context?symbol=<symbol>`
- 手動同步按鈕會同時呼叫：
  - `/api/context`
  - `/api/market`
  - `/api/geopolitics`

重構限制：

- 自選股即時報價的 30 秒輪詢必須保留。
- `/api/quote-cache` TTL 與批次查詢不可被繞過，避免 Fugle 額度浪費。

## I. 現有 authentication

Auth route：`POST /api/auth`

模式：

- `login`
- `register`

前端儲存：

- `localStorage["la1-user-id"]`
- `localStorage["la1-auth-user"]`
- `localStorage["la1-auth-phone"]`

後端 user id：

- `phone-${phoneDigits}`

API user identity：

- Header：`x-la1-user-id`
- Query：`userId`
- Fallback：`demo-user`

重構限制：

- 不改 authentication model。
- 不導入 OTP 或第三方登入，除非另起後續 phase。
- 不破壞既有手機號登入與 localStorage session。

## J. 現有 database interaction

持久化主要在 `app/lib/server-store.ts`。

如果有 DB URL：

- 使用 `pg` Pool。
- DB env：`DATABASE_URL` 或 `POSTGRES_URL`。
- 啟動時 lazy create schema。

Postgres tables：

- `la1_users`
- `la1_snapshots`
- `la1_notifications`
- `la1_quote_cache`
- `la1_scan_runs`
- `la1_scheduled_reports`

如果沒有 DB URL：

- 使用 JSON file fallback。
- File env：`LA1_DATA_FILE`
- Default：`.data/la1-store.json`

另外存在 `db/index.ts` 與 `db/schema.ts`，目前是 Cloudflare D1/Drizzle scaffold，`db/schema.ts` 實際是空 schema，主 app 持久化沒有使用它。

重構限制：

- 不改 DB schema。
- 不把 watchlist、notes、alerts 改回純前端永久保存。
- UI migration 要繼續使用 `/api/sync` 與 server-store。

## K. 現有 environment variables

從 README、routes、lib、scripts 掃描到：

- `FUGLE_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `DATABASE_URL`
- `POSTGRES_URL`
- `LA1_DATA_FILE`
- `APP_BASE_URL`
- `CRON_SECRET`
- `LA1_SERVICE_ROLE`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `LINE_WEBHOOK_URL`
- `EMAIL_WEBHOOK_URL`
- `NOTIFY_WEBHOOK_URL`
- `WORLDMONITOR_API_KEY`
- `WM_API_KEY`
- `CODEX_SANDBOX`（local Vite watch 設定用）
- `WRANGLER_WRITE_LOGS`
- `WRANGLER_LOG_PATH`
- `MINIFLARE_REGISTRY_PATH`

重構限制：

- 不把 key 寫進前端。
- 不更名 env。
- 不在 UI 顯示 secrets。

## L. 哪些功能目前正常

以現有測試與靜態掃描判斷，以下功能已有可執行鏈路：

- 手機號註冊/登入 gate。
- `/api/auth` 建立輕量 user。
- `/api/sync` 保存 watchlist、notes、alertSettings。
- `/api/notify` 即使未設定外部 channel，也會建立站內 notification。
- 缺少 `FUGLE_API_KEY` 時，`/api/quote`、`/api/context` 會透明回傳 `missing_fugle_key`。
- 缺少 `OPENAI_API_KEY` 時，`/api/analyze` 會透明回傳 `missing_openai_key`。
- `/api/market` 具備官方市場總覽、排行、市場廣度、產業輪動、法人合計、國際市場與總經因子資料鏈路。
- `/api/geopolitics` 具備 GDELT 與 World Monitor metadata 鏈路。
- `/api/quote-cache` 具備後端快取，避免 watchlist 每次直接打 Fugle。
- `/api/reports` 支援 morning/review 排程報告。

仍需 live environment 回歸確認：

- Production env 是否完整設定 Fugle/OpenAI/Postgres/通知/Webhook。
- Railway cron service 是否分別設定 `LA1_SERVICE_ROLE=cron-morning`、`cron-review`。
- World Monitor key 是否已設定。

## M. 哪些頁面直接綁定後端

目前所有頁面都在 `app/page.tsx` 直接 fetch 後端：

- `overview`：`/api/market`、`/api/geopolitics`、`/api/context`、`/api/quote-cache`
- `quote`：`/api/context`、`/api/analyze`
- `kline`：使用 `/api/context` 的 `technical.candles`
- `watchlist`：`/api/quote-cache`、`/api/sync`、`/api/scan`
- `ai`：`/api/analyze`、`/api/context`
- `risk`：local risk rules + `/api/scan` + `/api/quote-cache`
- `settings`：`/api/user`、`/api/sync`、`/api/notify`
- `global`：`/api/market`、`/api/geopolitics`
- `news`：`/api/context` news + TWSE market news fallback
- `institutions`：`/api/market` institutional flow
- `morning/review`：目前 UI panel 使用前端 summary；正式排程 route 是 `/api/reports`

## N. 哪些 UI 邏輯與 API 邏輯混在一起

目前混在 `app/page.tsx` 的項目：

- API fetch：`fetchMarketSummary`、`fetchGeopolitics`、`fetchWatchQuotes`、`fetchQuote`、`fetchAnalysis`、`saveCloudProfile`、`pushCloudSnapshot`、`pullCloudSnapshot`、`runCloudScan`、`sendTestNotification`。
- Domain scoring：`sentimentScore`、`riskScore`、`buildMarketRegime`、`buildInstitutionalTradePlan`。
- Local persistence：watchlist、alert settings、read notifications、investment notes。
- Navigation：`PageKey`、`navOrder`、`renderPage()`。
- Data normalization：watchlist normalization、formatting helpers。
- Zoom modal behavior：card click delegation and modal rendering。

重構方向：

- `services/*` 包 API。
- `adapters/*` 做 response normalization。
- `components/*` 只接 normalized model。
- `hooks/*` 管 polling、local/session state。
- `lib/marketColorConvention.ts` 統一台股顏色：上漲紅、下跌綠。

## UI -> API Mapping

### 總覽首頁 `/overview`

- 市場總覽：`GET /api/market`
- 大盤趨勢：`GET /api/market`
- 市場強度：`GET /api/market`
- 資金流向：`GET /api/market`
- 產業輪動：`GET /api/market`
- 強勢股 / 弱勢股 / 成交量排行：`GET /api/market`
- 全球市場：`GET /api/market`
- 市場快訊：`GET /api/context?symbol=<selected>` 或後續新聞 service adapter
- 自選股：`POST /api/quote-cache?ttlMs=30000` + `GET/POST /api/sync`
- AI 決策摘要：`GET /api/analyze?symbol=<selected>`

### 市場脈動 `/market-pulse`

- 加權 / 櫃買 / 成交金額 / 市場情緒：`GET /api/market`
- 市場廣度：`GET /api/market`
- 法人資金：`GET /api/market`
- 國際風險：`GET /api/geopolitics`
- AI Market Pulse：目前可先接 `GET /api/analyze?symbol=<selected>`；後續若新增市場級 endpoint，必須做 adapter 而不是改舊 endpoint。

### 指數走勢 `/indices`

- TAIEX / OTC：`GET /api/market`
- K 線 / MA：目前個股 K 線來自 `GET /api/context?symbol=<selected>`；指數 K 線尚未有獨立 endpoint。
- Intelligence Panel：`GET /api/market` + `GET /api/analyze?symbol=<selected>`

### 產業熱力圖 `/heatmap`

- 產業輪動：`GET /api/market` 的 `industryRotation`
- 領漲 / 領跌 / 成交量：`GET /api/market` 的 `rankings`
- AI 產業分析：目前未有獨立 sector analysis endpoint；第一版只能用現有 market/stock analysis adapter，不可 mock。

### 法人動向 `/institution`

- 法人合計、外資、投信、自營商：`GET /api/market` 的 `institutional`
- 法人趨勢 / Top 20 / 連買連賣：目前沒有完整歷史 endpoint。
- 個股法人：`GET /api/context` 目前標示 pending licensed source，不可讓 AI 編造。
- AI 法人分析：目前未有獨立 endpoint；先用 `/api/analyze` 或規劃新 endpoint，不能破壞舊分析。

### 國際市場 `/global`

- 美股、日股、SOX、VIX、匯率：`GET /api/market` 的 `globalMarkets`
- 台灣失業率 / CPI / 美債 10Y：`GET /api/market` 的 `macroFactors`
- 地緣風險 / World Monitor：`GET /api/geopolitics`
- 對台股影響：目前用 `GET /api/geopolitics` + `GET /api/analyze?symbol=<selected>` 組合。

### 盤後數據 `/after-hours`

- 收盤指數、成交量、市場廣度、法人：`GET /api/market`
- 今日 Top Movers：`GET /api/market`
- AI Closing Brief：`GET /api/reports?type=review` 或 `POST /api/reports?type=review` for cron。

### 策略訊號 `/signals`

- 現有 signal：前端 local `buildInstitutionalTradePlan()`、`buildMarketRegime()`、quote/context derived。
- Watchlist scan：`POST /api/scan`
- 通知：`POST /api/notify`
- 重構時要先抽成 adapter/hook，不能刪除現有訊號。

### 自選股中心 `/watchlist`

- Cloud watchlist：`GET /api/sync`、`POST /api/sync`
- Batch quote：`POST /api/quote-cache?ttlMs=30000`
- Add symbol quote lookup：`GET /api/quote-cache?symbol=<symbol>&ttlMs=30000`
- Scan alerts：`POST /api/scan`

### Stock Intelligence Panel

- Quote：`GET /api/quote` 或 `GET /api/context`
- Price / K line：`GET /api/context`
- Revenue：`GET /api/context`
- News：`GET /api/context`
- AI：`GET /api/analyze`
- Watchlist persistence：`GET/POST /api/sync`

### 風險監控 `/risk`

- Market risk：local `riskScore(quote, context)` + `/api/market`
- Global risk：`GET /api/geopolitics`
- Alerts：`POST /api/scan` + `/api/notify`
- Settings：localStorage + `/api/sync`

### 新聞快訊 `/news`

- 個股新聞：`GET /api/context`
- 市場/公司新聞：TWSE news source via `getNewsContext`
- 國際事件：`GET /api/geopolitics`
- AI News Intelligence：目前沒有獨立 endpoint，必須先走 adapter 或後續補 endpoint。

### 設定 `/settings`

- Account：`POST /api/auth`、`GET/POST /api/user`
- Sync：`GET/POST /api/sync`
- Data source health：frontend state from `/api/context`、`/api/market`、`/api/geopolitics`
- Alerts：local settings + `/api/sync`
- Notifications：`POST /api/notify`

### AI 戰情中心 `/intelligence`

- 現有 AI：`GET /api/analyze?symbol=<selected>`
- Market data：`GET /api/market`
- Global risk：`GET /api/geopolitics`
- 目前沒有獨立 market briefing endpoint。第一版應由 frontend analysis adapter 組合現有資料，或後續新增 API，但不得修改既有 `/api/analyze` contract。

## Phase 1 前置結論

1. 目前最大技術債是 `app/page.tsx` 過大，且 UI、fetch、狀態、交易判斷、localStorage 混在一起。
2. 後端 API 和資料鏈路已具備基礎，可支撐新版 UI，但需要 frontend data layer 包裝。
3. 重構應從 shell 和 service adapter 開始，不應先砍掉 `renderPage()`。
4. 每遷移一頁，都必須保留原 API contract，使用 adapter 對齊新 UI model。
5. 手機與桌機需要不同 layout 策略，不應再只靠縮小 desktop card。
6. 首頁 Hero 可以使用戰略中心/火箭控制中心視覺；數據頁應走專業 terminal，避免每頁塞重視覺背景降低資訊效率。

## Visual Blueprint Lock

設計來源：使用者提供的「TW Pulse 全部設計圖草稿」。後續 UI 實作必須依該圖做 1:1 視覺還原方向，但仍以現有 API、資料來源、AI 分析與同步流程為真實功能來源。

整套 UI 不是 13 張同樣 dashboard，而是 6 種畫面類型：

| 畫面類型 | 頁面 | 主視覺 |
|---|---|---|
| Command Center | 總覽首頁 | 電影感戰略中心 |
| Live Analysis | 市場脈動、指數走勢 | 大型時間序列圖 |
| Spatial Intelligence | 產業熱力圖、全球市場 | Treemap / World Map |
| Capital Intelligence | 法人動向、盤後數據 | 資金流 + 排名 |
| Detection System | 策略訊號、風險監控、新聞快訊 | Feed + 右側情報分析 |
| AI Briefing | AI 戰情中心 | 結構化 AI 情報簡報 |

視覺層級固定：

- L1 Command View：3 秒內知道市場、風險、資金方向。
- L2 Analysis View：圖表、法人、產業、訊號等專業資料。
- L3 Deep Intelligence：股票、產業、新聞點開後才顯示完整分析與 AI。

已建立頁面級規格：

- `docs/ui/01-overview.md`
- `docs/ui/02-market-pulse.md`
- `docs/ui/03-indices.md`
- `docs/ui/04-heatmap.md`
- `docs/ui/05-institution.md`
- `docs/ui/06-global.md`
- `docs/ui/07-after-hours.md`
- `docs/ui/08-signals.md`
- `docs/ui/09-watchlist.md`
- `docs/ui/10-risk.md`
- `docs/ui/11-news.md`
- `docs/ui/12-intelligence.md`
- `docs/ui/13-settings.md`

Screenshot QA folders：

- `docs/ui/screenshots/desktop/`
- `docs/ui/screenshots/mobile/`
