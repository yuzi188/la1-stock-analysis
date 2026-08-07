# 12 AI 戰情中心 / Intelligence

## Purpose

AI Strategic Briefing Room。這是產品最有價值頁面，不做聊天機器人。

## Primary Visualization

Structured AI Briefing：中央 50% 寬，左右是市場狀態與風險事件。

## Grid Layout

- Header：AI MARKET INTELLIGENCE + Last Update，12 cols。
- Left Market Status：3 cols。
- Center AI Briefing：6 cols。
- Right Risks / Events：3 cols。
- Bottom Scenario A/B/C：各 4 cols。

## Components

- `IntelligenceHeader`
- `MarketStatusPanel`
- `AIBriefing`
- `RiskEventPanel`
- `ScenarioCard`
- `WatchListPanel`

## API Mapping

- AI：`GET /api/analyze?symbol=<selected>`
- Market：`GET /api/market`
- Global risk：`GET /api/geopolitics`
- Watchlist context：`GET /api/sync` + `POST /api/quote-cache`

## Interaction

- 「產生戰情簡報」按鈕呼叫 analysis service。
- Briefing sections：MARKET STATUS / WHY / CAPITAL / SECTORS / RISKS / SCENARIOS / WATCH。
- 點股票：Global Stock Drawer。
- 點事件：右側展開事件來源。

## Desktop

中央 AI Briefing 必須最大。左右只提供 context。

## Tablet

Briefing 全寬，Market/Risk 變上下。

## Mobile

AI Intelligence 放在 More。進入後：Status -> Briefing -> Scenarios -> Watch。

## Loading

Briefing skeleton。Market/Risk 仍可先顯示。

## Empty

未查詢股票時提示輸入代號或選自選股，不生成假 AI。

## Error

OpenAI missing key 顯示明確錯誤。
