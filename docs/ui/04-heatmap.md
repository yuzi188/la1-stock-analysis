# 04 產業熱力圖 / Heat Map

## Purpose

顯示資金與強度在哪些產業聚集。定位是 Market Battlefield Map。

## Primary Visualization

Treemap。每個格子只顯示產業、漲跌、成交量或強度，不塞股票名稱。

## Grid Layout

- Filter bar：12 cols，今日 / 5D / 20D / 60D，漲跌 / 資金 / 法人 / 強度。
- Treemap：8 cols，高 620px。
- Sector Intelligence：4 cols，高 620px。
- Sector Ranking：12 cols 或 8 cols。

## Components

- `SectorTreemap`
- `SegmentedControl`
- `SectorIntelligencePanel`
- `SectorRanking`
- `StockDrawer`

## API Mapping

- 產業輪動：`GET /api/market` 的 `industryRotation`
- 領漲 / 領跌：`GET /api/market` 的 `rankings`
- 產業新聞：目前可由 `GET /api/context?symbol=<leader>` 取得個股新聞；不得 mock。
- AI 產業判斷：目前無獨立 endpoint，先標記待補或用現有 analysis adapter。

## Interaction

- 點產業：右側 drawer 顯示產業強度、5D/20D、法人、領漲股、領跌股、新聞、AI。
- Hover treemap：tooltip 顯示強度、資金、漲跌。

## Desktop

Treemap 必須最大。右側情報欄只服務所選產業。

## Tablet

Treemap 全寬，情報欄下移。

## Mobile

Sector mobile：Treemap -> Sector Ranking -> Selected Sector -> Top Stocks。

## Loading

Treemap skeleton 使用固定格子，不跳版。

## Empty

沒有產業資料時顯示 source 與待同步狀態。

## Error

Treemap 顯示 retry，右側保持空狀態。
