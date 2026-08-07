# UI Migration Regression Checklist

本文件是每次 UI migration 前後必填的回歸檢查。目的：確保 Old Feature -> New Feature = 1:1 functional parity。

UI migration 不等於 feature rewrite。重構只能替換介面，不可切斷資料、API、AI 分析、登入、同步、警報與 watchlist。

## Blocking Rules

任何 phase 都禁止：

- 用 mock data 取代 production data。
- 修改或刪除現有 API endpoint。
- 為了新 UI 改 API response contract。
- 刪除現有可用功能。
- 改 authentication model。
- 改 database schema。
- 把 API key 或 secrets 放進前端。
- 讓自選股資料在部署後消失。
- 讓 watchlist 報價跳過 `/api/quote-cache` 直接大量打 Fugle。
- 讓 AI 分析改成前端假文字。

## Migration Record Template

每修改一個功能或頁面前，先複製此模板到下方 Migration Log。

```md
## Feature:

### Before

- Old route / page key:
- Old component / panel:
- API endpoint:
- Method:
- Request payload / query:
- Data source:
- Normal output:
- Empty state:
- Error state:
- Loading behavior:
- Analysis function:
- Realtime / polling mechanism:
- Auth dependency:
- Database dependency:
- Environment variables:
- Existing tests / manual checks:

### After

- New route:
- New component:
- Service / adapter:
- API endpoint unchanged: yes / no
- Request unchanged: yes / no
- Response adapter only: yes / no
- Data parity confirmed: yes / no
- Analysis parity confirmed: yes / no
- Realtime parity confirmed: yes / no
- Auth/session parity confirmed: yes / no
- Watchlist persistence confirmed: yes / no
- Loading state confirmed: yes / no
- Empty state confirmed: yes / no
- Error retry confirmed: yes / no
- Desktop checked: yes / no
- Mobile checked: yes / no
- Console errors: none / list
- Network errors: none / list
- Notes:
```

## Required Regression Matrix

| Feature | Old Location | New Location | API Same | Data Same | AI Same | Realtime Same | Desktop | Mobile | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Phone auth | `/` auth gate | TBD | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep `/api/auth` |
| User profile | settings/cloud panel | TBD | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep `/api/user` |
| Cloud sync | settings/cloud panel | TBD | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep `/api/sync` |
| Watchlist | `watchlist` PageKey | `/watchlist` | Must | Must | N/A | Must | Pending | Pending | Not migrated | Keep 30s quote polling |
| Quote | `quote` PageKey | `/quote` or StockDrawer | Must | Must | N/A | Poll/cache | Pending | Pending | Not migrated | Keep Fugle |
| K line | `kline` PageKey | `/indices` / StockDrawer | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep Fugle candles |
| AI stock analysis | `ai` / decision panel | `/intelligence` / StockDrawer | Must | Must | Must | N/A | Pending | Pending | Not migrated | Keep `/api/analyze` |
| Market overview | `overview` PageKey | `/overview` | Must | Must | Existing | Existing | Pending | Pending | Not migrated | Keep `/api/market` |
| Market pulse | `pulse` PageKey | `/market-pulse` | Must | Must | Existing | Existing | Pending | Pending | Not migrated | Uses `/api/market` |
| Breadth | `breadth` PageKey | `/market-pulse` or `/overview` | Must | Must | N/A | Existing | Pending | Pending | Not migrated | Uses `/api/market` |
| Sector rotation | `sectors/themes` PageKey | `/heatmap` | Must | Must | Existing only | Existing | Pending | Pending | Not migrated | Uses `/api/market` |
| Institution flow | `institutions` PageKey | `/institution` | Must | Must | Existing only | Existing | Pending | Pending | Not migrated | Uses `/api/market` |
| Global markets | `global` PageKey | `/global` | Must | Must | Existing only | Existing | Pending | Pending | Not migrated | Uses `/api/market`, `/api/geopolitics` |
| Geopolitics | `global` PageKey | `/global` | Must | Must | Existing only | Existing | Pending | Pending | Not migrated | Uses GDELT/World Monitor metadata |
| Alerts scan | `risk` / watchlist | `/risk` / `/watchlist` | Must | Must | N/A | On demand | Pending | Pending | Not migrated | Keep `/api/scan` |
| Notifications | `notifications` PageKey | `/alerts` or `/settings` | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep `/api/notify` |
| Notes | `notes` PageKey | `/watchlist` or `/notes` | Must | Must | N/A | N/A | Pending | Pending | Not migrated | Keep `/api/sync` |
| Reports | scripts/API | `/after-hours` | Must | Must | Existing summary | Cron | Pending | Pending | Not migrated | Keep `/api/reports` |

## Per Page Test Checklist

每完成一頁，必須檢查：

- UI render：頁面可載入，不空白。
- Navigation：desktop sidebar / mobile bottom nav 可切換。
- API request：endpoint 正確，沒有重複打同一 API。
- API response：資料格式被 adapter 正確轉換。
- Loading：card skeleton 或局部 loading，不使用整頁 spinner。
- Empty：缺資料時有明確提示。
- Error：API fail 時顯示錯誤與 retry。
- Realtime：原本 polling 保留。
- Analysis：AI 分析按鈕或 briefing 能使用現有 API。
- Auth：登入狀態不掉。
- Persistence：watchlist、notes、alerts 仍可同步。
- Desktop：>= 1024px 可用。
- Mobile：<= 430px 可用，不靠直接縮小 desktop card。
- Console：無 runtime error。
- Network：無 404 / 500 / CORS / duplicated storm。

## Visual QA Requirement

每完成一頁必須截圖，不等整套專案完成才檢查。

Desktop：

- 1440px
- 1920px

Mobile：

- 390px

截圖保存：

- `docs/ui/screenshots/desktop/`
- `docs/ui/screenshots/mobile/`

每次 QA 檢查：

- 是否符合總設計圖的同一套 design system。
- 該頁是否有自己的 Primary Visualization。
- 是否有正確 L1 / L2 / L3 資訊層級。
- Sidebar / Topbar 是否一致。
- 卡片位置、間距、文字大小是否穩定。
- Mobile 是否是重新排列，不是 desktop 縮小。
- 是否有 overflow、text clipping、重疊。
- 真實 API 資料是否正常渲染。

## Service Layer Requirement

新 UI component 禁止直接 `fetch("/api/...")`。需先建立 service：

- `services/market.service.ts`
- `services/stock.service.ts`
- `services/watchlist.service.ts`
- `services/analysis.service.ts`
- `services/institution.service.ts`
- `services/global.service.ts`
- `services/news.service.ts`
- `services/auth.service.ts`
- `services/notification.service.ts`

允許依實際框架調整命名，但原則不變：component -> service -> API -> adapter -> normalized model。

## Adapter Requirement

如果 API response 不符合新 UI，使用 adapter：

```txt
existing API response
-> adapter
-> normalized frontend model
-> component
```

禁止反向為了 UI 修改舊 API response。

## Analysis Regression

每個 AI 功能遷移時確認：

- 仍呼叫 `/api/analyze` 或明確新增且相容的 analysis endpoint。
- AI prompt 使用真實 context。
- 缺少 `OPENAI_API_KEY` 時仍顯示可理解錯誤。
- 不在前端硬寫假結論。
- 回傳的 `analysis.conclusion`、`facts`、`scenarios`、`risks`、`nextChecks`、`disclaimer` 都有 UI 位置。

## Realtime Regression

目前 realtime 是 polling：

- Watchlist quote：30 秒。
- Quote cache TTL：前端多使用 30000ms，server clamp 15000-300000ms。
- Market/geopolitics：手動同步與初始載入。

遷移時確認：

- `setInterval` 有 cleanup。
- active page 切換不會建立重複 interval。
- quote batch 不超過 20 檔。
- 不直接繞過 `/api/quote-cache`。

## Auth / Sync Regression

檢查：

- 未登入時仍顯示手機登入/註冊頁。
- 登入成功會寫入：
  - `la1-user-id`
  - `la1-auth-user`
  - `la1-auth-phone`
- API request 帶 `x-la1-user-id`。
- `/api/sync` pull 不會覆蓋本地有用資料為空。
- 部署後 watchlist 不消失。

## Market Color Convention

本系統以台股為主：

- 上漲：紅色。
- 下跌：綠色。

必須建立共用 helper，例如：

```ts
marketColorConvention("TW", change)
```

禁止各 component 自己判斷顏色。

## Migration Log

### 2026-08-07 Phase 0 Audit

#### Before

- Old route / page key：`/` with internal `PageKey`
- Old component / panel：`app/page.tsx`
- API endpoint：all current `app/api/*`
- Data source：Fugle、TWSE、TPEx、Yahoo Finance、DGBAS/stat.gov.tw、U.S. Treasury、GDELT、OpenAI、Postgres/JSON store
- Normal output：現有 dashboard panels、watchlist、AI analysis、auth gate
- Analysis function：`GET /api/analyze?symbol=<symbol>`
- Realtime mechanism：watchlist 30 秒 polling via `/api/quote-cache`

#### After

- New component：none
- API endpoint unchanged：yes
- Data parity confirmed：not changed
- Analysis parity confirmed：not changed
- Realtime parity confirmed：not changed
- Notes：本次只新增 audit/checklist 文件，未修改 runtime code。
