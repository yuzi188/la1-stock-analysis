# 01 總覽首頁 / Overview

## Purpose

總覽首頁是全站 L1 Command View。使用者 3 秒內要知道市場狀態、戰情分數、趨勢方向、風險、資金方向與最重要警報。禁止塞滿深度分析。

## Primary Visualization

Mission Control Hero：金融戰略指揮中心圖片，不含人物。中央是大型資訊牆與世界市場儀表。Hero 只出現在首頁與 AI 戰情中心相關視覺區，不複製到所有頁面。

## Grid Layout

Desktop 1920x1080：

- Sidebar：210px fixed。
- Top Intelligence Bar：68px fixed。
- Main：12 columns，gap 12-16px，padding 16-20px。
- Hero：12 columns，高 280-320px。
- Row 1：市場總覽 3 cols / 大盤趨勢 4 cols / 資金流向 3 cols / 系統摘要 2 cols。
- Row 2：市場廣度 3 cols / 產業輪動 3 cols / 強勢股 3 cols / 弱勢股 3 cols。
- Row 3：全球市場 5 cols / Market News 4 cols / 自選股 3 cols。
- Row 4：Market Alerts 12 cols 或 6+6。

## Components

- `AppShell`
- `TopStatusBar`
- `Sidebar`
- `CommandHero`
- `Panel`
- `MetricCard`
- `Gauge`
- `Sparkline`
- `MarketChart`
- `CapitalFlow`
- `MarketBreadth`
- `SectorRotation`
- `StockTable`
- `NewsFeed`
- `SignalBadge`

## API Mapping

- 市場總覽：`GET /api/market`
- 大盤趨勢：`GET /api/market`
- 市場廣度：`GET /api/market`
- 資金流向：`GET /api/market`
- 產業輪動：`GET /api/market`
- 強勢 / 弱勢 / 成交量排行：`GET /api/market`
- 全球市場：`GET /api/market`
- 市場快訊：`GET /api/context?symbol=<selected>` 或 news adapter
- 自選股：`GET/POST /api/sync` + `POST /api/quote-cache?ttlMs=30000`
- AI 摘要：`GET /api/analyze?symbol=<selected>`

## Interaction

- Hero CTA：切到 `/intelligence`。
- 點股票：開啟 Global Stock Drawer。
- 點市場趨勢：開啟 enlarged chart modal 或導向 `/market-pulse`。
- 點產業：開啟 Sector Drawer。
- 每張卡片可放大，但首頁摘要不展開成完整深度分析。

## Desktop

必須對齊設計圖：左側選單清楚可見，首頁 Hero 最大，底下卡片密度高但層級清楚。首頁不是所有功能頁內容全集。

## Tablet

2 columns。Hero 全寬，Row 1 改成 2x2，排行與新聞往下排。

## Mobile

不縮小 desktop。順序：

1. Command Hero
2. Market Score
3. Index
4. Breadth
5. Sector
6. Signals
7. News

Bottom nav：總覽 / 市場 / 產業 / 自選股 / 更多。

## Loading

Hero 和卡片各自 skeleton。不可整頁 spinner。

## Empty

缺市場資料時保留框架，顯示「資料待同步」與 retry。

## Error

卡片內顯示錯誤與 retry。Fugle/OpenAI missing key 要顯示透明錯誤，不隱藏。
