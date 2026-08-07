# 06 國際市場 / Global

## Purpose

呈現全球市場、匯率、美債、商品與地緣事件對台股的影響。定位是 Global Intelligence Room。

## Primary Visualization

World Market Map：平面情報地圖，重要市場節點發光。不要做 3D 地球。

## Grid Layout

- Region tabs：USA / JAPAN / CHINA / HK / EUROPE，12 cols。
- World Map：12 cols，高 360-420px。
- Market cards：S&P500 / Nasdaq / Dow / SOX / VIX，各 2-3 cols。
- Macro cards：USD/TWD / DXY / US10Y / Gold / Oil / BTC。
- Global Event Timeline：8 cols。
- 台股影響：4 cols。

## Components

- `WorldMarketMap`
- `GlobalMarketCard`
- `MacroFactorGrid`
- `EventTimeline`
- `ImpactPanel`

## API Mapping

- 全球市場：`GET /api/market` 的 `globalMarkets`
- Macro factors：`GET /api/market` 的 `macroFactors`
- 地緣事件：`GET /api/geopolitics`
- World Monitor metadata：`GET /api/geopolitics`
- 台股影響：目前由 `geopolitics` + `analysis` adapter 組合，不可 mock。

## Interaction

- 點國家/市場節點：更新右側市場摘要。
- 點事件：顯示影響產業與可能股票。
- World Monitor 未設定 key 時顯示 `needs_key`。

## Desktop

Map 是主焦點。下方 cards 不可比 map 更搶視覺。

## Tablet

Map 全寬，事件與影響上下排列。

## Mobile

Global 放在 More。進入後：主要指數 -> World events -> 台股影響 -> macro。

## Loading

Map 節點 skeleton；事件 feed 可獨立載入。

## Empty

GDELT 無資料時顯示低資料量，不假造事件。

## Error

全球資料與地緣資料各自 error。
