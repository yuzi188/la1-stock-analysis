# 07 盤後數據 / After Hours

## Purpose

收盤後戰情簡報。定位是 Daily Mission Debrief。

## Primary Visualization

Daily Market Chart + AI Closing Brief。AI Closing Brief 是本頁主角。

## Grid Layout

- Header：日期、MARKET CLOSED、今日戰情評分，12 cols。
- Summary cards：指數 / 成交量 / 法人 / 市場廣度，各 3 cols。
- Daily Market Chart：8 cols。
- Closing Summary：4 cols。
- Top Movers / Volume Alerts / Institution：各 4 cols。
- Breakout / Breakdown / News Impact：各 4 cols。
- AI Closing Brief：12 cols。

## Components

- `ClosingHeader`
- `MetricCard`
- `MarketChart`
- `TopMovers`
- `AlertList`
- `ClosingBrief`

## API Mapping

- 今日盤後總結：`GET /api/market`
- Top Movers / Volume：`GET /api/market`
- 法人：`GET /api/market`
- AI Closing Brief：`GET /api/reports?type=review` 或 cron `POST /api/reports?type=review`

## Interaction

- 點 Top Movers 股票：Global Stock Drawer。
- 產生復盤：觸發 reports endpoint，不直接生成 mock 文案。

## Desktop

要像「任務復盤」，不要像普通市場頁。

## Tablet

Chart 全寬，Brief 緊接其下。

## Mobile

收盤狀態 -> 今日評分 -> AI Closing Brief -> Top Movers -> Alerts。

## Loading

Brief 可獨立 loading。

## Empty

盤中時可顯示「尚未收盤」，但仍保留 market summary。

## Error

reports error 不影響 market summary。
