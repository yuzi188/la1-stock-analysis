# 08 策略訊號 / Signals

## Purpose

Signal Detection Center。不是買賣推薦頁，而是市場情報訊號偵測。

## Primary Visualization

Signal Feed + Signal Detail split view。列表是主體，不使用巨大卡片。

## Grid Layout

- Filter tabs：All / 法人 / Volume / Trend / News / Sector，12 cols。
- Signal Feed：7 cols。
- Signal Detail：5 cols。
- Detail 內：Stock header、Confidence、Why Triggered、Institution、Volume、Sector、News、AI Analysis。

## Components

- `SignalFilter`
- `SignalFeed`
- `SignalRow`
- `SignalDetailPanel`
- `ConfidenceBadge`
- `StockDrawer`

## API Mapping

- 現有訊號：`app/page.tsx` local `buildMarketRegime()`、`buildInstitutionalTradePlan()` derived。
- Watchlist scan：`POST /api/scan`
- 通知：`POST /api/notify`
- AI：`GET /api/analyze?symbol=<selected>`
- 市場資料：`GET /api/market`

## Interaction

- 點 signal row：更新右側 detail，不跳頁。
- 點股票：Global Stock Drawer。
- Confidence colors：80+ 藍/青、60-79 黃、低於 60 灰。

## Desktop

Feed 佔左側大面積，右側 detail 固定。避免全頁都是卡片。

## Tablet

Feed 全寬，Detail 下移。

## Mobile

Signal list -> selected detail drawer。

## Loading

Feed row skeleton。

## Empty

沒有訊號時顯示「目前沒有達標訊號」，不塞假訊號。

## Error

scan error 顯示於 feed header。
