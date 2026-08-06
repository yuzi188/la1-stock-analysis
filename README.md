# LA1 台股分析室

給台股投資人使用的市場情報 dashboard。功能包含即時報價、K 線、均線、月營收、新聞、法人、市場廣度、國際市場、宏觀因子、AI 分析、自選股掃描、警報與雲端同步。

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
- `/api/reports?type=review`
- `/api/notify`

## 環境變數

複製 `.env.example` 到 `.env.local` 後填入：

```bash
FUGLE_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
DATABASE_URL=
POSTGRES_URL=
LA1_DATA_FILE=.data/la1-store.json
APP_BASE_URL=
CRON_SECRET=
LA1_SERVICE_ROLE=web
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
LINE_WEBHOOK_URL=
EMAIL_WEBHOOK_URL=
NOTIFY_WEBHOOK_URL=
```

`DATABASE_URL` 或 `POSTGRES_URL` 存在時，會員、自選股、筆記、警報、通知、快取、掃描紀錄與摘要報告會寫入 Postgres。沒有資料庫時會退回本機 JSON，方便開發測試。

## Railway 部署

主要網站 service：

- `LA1_SERVICE_ROLE=web`
- Start command：`pnpm run start`
- Build command：`pnpm run build`

開盤摘要 cron service：

- `LA1_SERVICE_ROLE=cron-morning`
- Start command：`pnpm run start`
- Cron schedule 建議：`0 0 * * 1-5`
- 台灣時間約每日交易日上午 08:00 執行

收盤復盤 cron service：

- `LA1_SERVICE_ROLE=cron-review`
- Start command：`pnpm run start`
- Cron schedule 建議：`0 7 * * 1-5`
- 台灣時間約每日交易日下午 15:00 執行

Railway cron 使用 UTC 時區，設定時間時要換算台灣時間。

## 本地開發

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm test
```

## 注意

- AI 分析是投資研究輔助，不是保證獲利或買賣建議。
- Yahoo Finance 非官方付費行情源，適合 dashboard 輔助觀察；正式商用可再接授權資料源。
- 正式對大眾開放時，建議把簡易會員 ID 升級為完整 Auth 登入。
