# 02 市場脈動 / Market Pulse

## Purpose

回答「現在盤面正在發生什麼」。這是 L2 Live Analysis，不放大 hero 圖。

## Primary Visualization

大型 Live Market Timeline，佔頁面約 40%。支援 Price、Volume、Institution Flow、Breadth overlay 與 Event Markers。

## Grid Layout

- Top metrics：12 cols，6 個 compact 指標：大盤、櫃買、成交額、上漲家數、情緒、多空比。
- Main timeline：8 cols。
- AI Market Pulse：4 cols。
- Momentum / Breadth / Volatility：各 4 cols。
- Liquidity / Institution / Market Emotion：各 4 cols。
- Market Events Timeline：8 cols。
- AI Pulse detail：4 cols。

## Components

- `MarketTimeline`
- `MetricStrip`
- `Panel`
- `Sparkline`
- `RiskBadge`
- `IntelligencePanel`
- `EventMarkerList`

## API Mapping

- 市場狀態、指數、市場廣度、法人：`GET /api/market`
- 國際事件：`GET /api/geopolitics`
- AI Pulse：先用 `GET /api/analyze?symbol=<selected>` adapter，後續可新增市場級 endpoint，但不得破壞舊 endpoint。

## Interaction

- Time range：1D / 5D / 20D / 60D。
- Overlay toggle：成交量 / 外資 / 投信 / 市場廣度。
- 點 event marker：右側顯示事件摘要。
- 點股票：Global Stock Drawer。

## Desktop

專業資料模式，無大圖背景。主圖必須是頁面焦點，不可被卡片搶走。

## Tablet

Timeline 全寬，AI panel 移到下方，metrics 3x2。

## Mobile

Market mobile 順序：Index -> Chart -> Market Emotion -> Capital Flow -> AI Pulse。不得塞全部桌機卡片。

## Loading

Timeline skeleton + metrics skeleton 分別載入。

## Empty

沒有 overlay 資料時保留主線，不畫假線。

## Error

市場資料失敗時 timeline 顯示 retry；AI 失敗不影響主圖。
