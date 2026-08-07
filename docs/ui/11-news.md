# 11 新聞快訊 / News Intelligence

## Purpose

Intelligence Feed。把新聞事件整理成可判讀的市場情報。

## Primary Visualization

Category column + central News Feed + right AI Impact Panel。

## Grid Layout

- Category：2 cols。
- News Feed：6 cols，佔最大。
- AI Impact：4 cols。

## Components

- `NewsCategoryNav`
- `NewsFeed`
- `NewsCluster`
- `AIImpactPanel`
- `ImportanceScore`

## API Mapping

- 個股新聞：`GET /api/context?symbol=<selected>`
- 市場新聞：TWSE news via `getNewsContext`
- 國際事件：`GET /api/geopolitics`
- AI Impact：目前尚無獨立 endpoint，可用 analysis adapter；不得 mock。

## Interaction

- Category：全部 / 重大 / 公司 / 產業 / 法人 / 國際 / 總經 / AI。
- 點新聞：右側顯示 Event、Summary、Impact、Stocks、Importance。
- 同事件合併是後續功能；未完成前不可假裝已自動合併。

## Desktop

中央 feed 佔最大，右側 AI 是輔助。

## Tablet

Category 變 horizontal chips，AI Impact 下移。

## Mobile

News list -> selected impact drawer。

## Loading

Feed row skeleton。

## Empty

沒有新聞時顯示資料來源與查詢狀態。

## Error

TWSE/GDELT 錯誤各自顯示。
