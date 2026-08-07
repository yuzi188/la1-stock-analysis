# 05 法人動向 / Institution

## Purpose

呈現三大法人資金流、共振與買賣超排行。定位是 Capital Flow Command。

## Primary Visualization

Capital Flow Stream chart。不是只有表格。

## Grid Layout

- Top cards：外資 / 投信 / 自營商 / 法人合計，各 3 cols。
- Capital Flow Chart：8 cols。
- Consensus Radar / Alignment Indicator：4 cols。
- Buy Top 20：6 cols。
- Sell Top 20：6 cols。
- 連續買超：6 cols。
- 連續賣超：6 cols。
- AI Institution Intelligence：12 cols。

## Components

- `CapitalFlowChart`
- `InstitutionConsensus`
- `StockTable`
- `RankingTable`
- `IntelligencePanel`

## API Mapping

- 法人合計：`GET /api/market` 的 `institutional`
- 個股法人：目前 `GET /api/context` 回傳 pending licensed source，不可編造。
- Top 20 / 連買連賣：目前沒有完整 endpoint，先標示缺口。
- AI 法人分析：目前可用 `/api/analyze` adapter，不可 mock。

## Interaction

- Range：Today / 5D / 20D。
- 點股票：Global Stock Drawer。
- Consensus 點擊顯示三法人方向與日期。

## Desktop

上方四張資金卡是 L1，chart 是 L2，排行是 L2，AI 是 L3。

## Tablet

Top cards 2x2，chart 全寬。

## Mobile

外資/投信/自營摘要 -> Consensus -> Top buy/sell tabs -> AI summary。

## Loading

資金與排行分區獨立 skeleton。

## Empty

若法人排行未接資料，明確顯示「待接授權資料」，不產生假排行。

## Error

官方資料失敗時顯示錯誤 source。
