# 09 自選股中心 / Watchlist

## Purpose

Personal Intelligence Desk。給用戶快速看自己的股票，而不是首頁卡片堆疊。

## Primary Visualization

Watchlist groups + dense stock table。點股票開 Global Stock Drawer。

## Grid Layout

- Left Watchlist Groups：3 cols，核心持股 / AI / 半導體 / 電源 / 觀察 / 新增群組。
- Right Stock Table：9 cols。
- Bottom Portfolio / Watchlist Intelligence：12 cols。

## Components

- `WatchlistGroupNav`
- `StockTable`
- `WatchlistToolbar`
- `StockDrawer`
- `RiskBadge`
- `SignalBadge`

## API Mapping

- Watchlist：`GET /api/sync`、`POST /api/sync`
- 批次報價：`POST /api/quote-cache?ttlMs=30000`
- 新增股票查名稱/價格：`GET /api/quote-cache?symbol=<symbol>&ttlMs=30000`
- 掃描：`POST /api/scan`

## Interaction

- 新增代號後必須顯示公司名稱，不顯示「自選股」。
- 刪除可用。
- 報價 30 秒更新。
- 部署後自選資料不可消失，必須以 `/api/sync` / server-store 為準。
- 點股票右側 drawer，不跳新頁。

## Desktop

表格密度要高，一頁可看多檔。不得用過大卡片。

## Tablet

Group nav 上移成 horizontal chips，table 全寬。

## Mobile

Watchlist selector -> Stock list -> Stock detail。列表要完整資訊但高度控制。

## Loading

表格 row skeleton，不整頁 spinner。

## Empty

沒有自選股時顯示新增輸入與建議，不塞假持股。

## Error

個別股票報價失敗只標那一列，不影響整張表。
