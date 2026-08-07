# 03 指數走勢 / Indices

## Purpose

分析主要指數趨勢與市場位置。定位是 Analytical Terminal，不做 TradingView clone。

## Primary Visualization

大型 Index Chart，可切 line/K-line。右側固定 Intelligence Panel。

## Grid Layout

- Index selector：12 cols，高 44px。
- Main chart：8 cols，高 520-600px。
- Intelligence Panel：4 cols，固定寬約 320px。
- Volume：8 cols，置於 main chart 下。
- Technical drawer：12 cols，MA / MACD / RSI / KD 預設收起。

## Components

- `IndexSelector`
- `MarketChart`
- `ChartTooltip`
- `ChartLegend`
- `IntelligencePanel`
- `MetricCard`
- `CollapsibleTechnicalPanel`

## API Mapping

- 指數摘要：`GET /api/market`
- 指數 K 線：目前尚無獨立 endpoint；第一版不可 mock，可先顯示現有 `/api/market` mini trend，並標記「需補指數 OHLC endpoint」。
- 個股 K 線：`GET /api/context?symbol=<selected>`
- AI 判斷：`GET /api/analyze?symbol=<selected>`

## Interaction

- Selector：TAIEX / OTC / 電子 / 金融 / 半導體。
- Range：1D / 5D / 1M / 3M / 6M / 1Y。
- 技術指標預設收起，使用者展開才看。
- 點 panel stock：Global Stock Drawer。

## Desktop

右側資訊欄固定，不跟 chart 混在一起。Chart 是唯一主角。

## Tablet

Chart 全寬，Intelligence Panel 下移。

## Mobile

Index -> Chart -> Intelligence summary -> 技術指標 accordion。

## Loading

Chart loading 不阻塞右側 summary。

## Empty

沒有指數 OHLC 時顯示「尚未接指數 K 線資料」，不得畫假 K 線。

## Error

API error 顯示於 chart panel。
