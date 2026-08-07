# 10 風險監控 / Risk Monitor

## Purpose

Threat Analysis Center。辨識市場風險，不把整頁做紅。

## Primary Visualization

Risk Radar Chart。正常狀態以藍色為主，只有 High Risk 用紅。

## Grid Layout

- Top risk cards：Market / Volatility / Liquidity / Global，各 3 cols。
- Risk Radar：8 cols。
- Threat Level：4 cols。
- Risk Alert Timeline：12 cols。

## Components

- `RiskMetricCard`
- `RiskRadar`
- `ThreatLevelPanel`
- `RiskAlertTimeline`
- `AlertSettingsPanel`

## API Mapping

- Market risk：`GET /api/market` + frontend risk adapter。
- Global risk：`GET /api/geopolitics`
- Watchlist scan risk：`POST /api/scan`
- Notification：`POST /api/notify`
- Settings sync：`GET/POST /api/sync`

## Interaction

- 點 risk factor：右側顯示原因。
- Alert settings 可以編輯。
- High/Medium/Low filter。

## Desktop

Radar 是頁面主視覺，紅色只用於高風險節點與 high alert。

## Tablet

Radar 全寬，Threat Level 下移。

## Mobile

Risk score -> Radar -> High alerts -> Settings。

## Loading

Radar skeleton。

## Empty

沒有 alert 時顯示低風險狀態。

## Error

GDELT 或 market 失敗分開顯示。
