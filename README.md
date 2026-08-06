# LA1台股分析室

台股投資智能體原型。介面採用深色市場情報 dashboard，整合即時報價、K 線、均線、月營收、新聞、法人、排行、市場廣度與 AI 分析。

## 已接資料

- Fugle：個股即時報價、歷史 K 線、MA5 / MA20 / MA60
- TWSE OpenAPI：上市月營收、新聞、每日行情、加權指數
- TWSE T86：上市三大法人買賣超
- TPEx OpenAPI：上櫃日收盤、櫃買指數、上櫃三大法人
- Yahoo Finance chart endpoint：美股指數、VIX、美元台幣、日經、費半延遲行情
- 中華民國統計資訊網：台灣失業率、CPI 年增率
- U.S. Treasury XML Feed：美債 10 年殖利率
- OpenAI：個股研究摘要、情境推演、風險提醒

## API

- `/api/quote?symbol=2330`
- `/api/context?symbol=2330`
- `/api/analyze?symbol=2330`
- `/api/market`
- `/api/user`
- `/api/sync`
- `/api/quote-cache`
- `/api/scan`
- `/api/reports?type=morning`
- `/api/notify`

## 環境變數

複製 `.env.example` 到 `.env.local` 後填入：

```bash
FUGLE_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
LA1_DATA_FILE=.data/la1-store.json
APP_BASE_URL=
CRON_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
LINE_WEBHOOK_URL=
EMAIL_WEBHOOK_URL=
NOTIFY_WEBHOOK_URL=
```

## 產品化功能

- 輕量會員模式：用 `x-la1-user-id` 同步用戶資料。
- 雲端同步：自選股、投資筆記、警報設定、通知已讀狀態。
- 後端快取：`/api/quote-cache` 會先讀伺服器快取，降低 Fugle 額度消耗。
- 批次掃描：`/api/scan` 最多一次掃 20 檔自選股並寫入通知。
- 通知通道：Telegram、LINE/Webhook、Email Webhook、通用 Webhook。
- 排程摘要：`/api/reports` 產生開盤摘要或收盤復盤。

## Railway 部署

1. 將專案推到 GitHub。
2. Railway 建立新專案，選擇 GitHub repo 或使用 CLI `railway up`。
3. 在 Railway Variables 補上 `.env.example` 需要的環境變數。
4. `railway.toml` 已指定 `pnpm run build` 與 `pnpm run start`。
5. Railway Cron 可另外建立服務執行：
   - 開盤摘要：`pnpm run cron:morning`
   - 收盤復盤：`pnpm run cron:review`

Railway 官方文件目前支援從 GitHub 或 CLI 部署，Cron Schedule 可在服務 Settings 中設定 crontab。

## 開發

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm exec node --test tests/rendered-html.test.mjs
```

## 產品原則

- 缺資料時顯示待接或載入中，不用 AI 補假行情、假法人、假新聞。
- AI 輸出定位為研究摘要、情境推演與風險提醒，不做保證獲利的喊單。
- 公開版需保留資料來源與風險提示。
