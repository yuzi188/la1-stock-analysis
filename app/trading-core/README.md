# LA1 Trading Core（全自動 AI Paper Trading）

TypeScript 模組，設計用來直接整合進 `yuzi188/la1-stock-analysis`。

## 已完成骨架

| 檔案 | 說明 |
|------|------|
| `config/trading.config.ts` | 全部可設定參數（風險、倉位、白名單、信心門檻、開關…） |
| `types/decision.ts` | Structured Decision 標準格式（AI 只能輸出這個） |
| `engines/risk-engine.ts` | Risk Engine（最終否決權） |
| `broker/paper-broker.ts` | Paper Broker（市價單 + 手續費 + 滑價 + 持倉） |
| `engines/stock-robot.ts` | **股票機器人**（全自動 Decision Loop + 自動出場） |
| `examples/run-demo.ts` | 用假資料跑機器人的示範 |

## 設計原則

- AI 只輸出 `StructuredDecision`
- Risk Engine 擁有最終 veto
- 每筆決策可存 `DecisionSnapshot`
- 全部參數可熱更新
- 支援緊急停止
- 全自動運行（可設定間隔）

## 股票機器人使用方式

```ts
import { StockRobot, defaultTradingConfig } from "./index";

const robot = new StockRobot(
  defaultTradingConfig,
  aiDecideFn,    // 接 LA1 /api/analyze
  getQuoteFn,    // 接 LA1 /api/quote
  getCandidatesFn
);

robot.start();           // 開始全自動
robot.updateConfig({ emergencyStop: true }); // 緊急停止
robot.stop();
```

## 下一步

1. 把 `/api/analyze` 輸出改成 `StructuredDecision`
2. 用真實 LA1 quote / context 替換 demo 的 mock
3. 補完整 Position Monitor（移動停損、時間出場）
4. 績效 DB + 簡單回測

## Analyze 適配器（已完成）

`adapters/la1-analyze-adapter.ts`

把 LA1 `/api/analyze` 的回傳轉成 `StructuredDecision`。

### 快速串接範例

```ts
import {
  StockRobot,
  defaultTradingConfig,
  createLa1AiDecideFn,
} from "./la1-trading-core";

// 1. AI 決策：直接打 LA1 analyze API
const aiDecide = createLa1AiDecideFn("http://localhost:3000");

// 2. 報價：接你現有的 quote API
async function getQuote(symbol: string) {
  const res = await fetch(`http://localhost:3000/api/quote?symbol=${symbol}`);
  const data = await res.json();
  return data.quote ? { symbol, price: data.quote.price } : null;
}

// 3. 候選標的
async function getCandidates() {
  return ["2330", "2317", "2454", "2303"]; // 或打 /api/scan
}

const robot = new StockRobot(
  {
    ...defaultTradingConfig,
    whitelist: ["2330", "2317", "2454"],
    decisionIntervalSec: 300,
    minConfidence: 0.65,
  },
  aiDecide,
  getQuote,
  getCandidates,
);

robot.start(); // 全自動開始
```


## UI 元件（已完成）

| 檔案 | 說明 |
|------|------|
| `ui/GlobalStatusBar.tsx` | 全域資金 + 機器人狀態 + 緊急停止 |
| `ui/TradePlanCard.tsx` | 個股/智能頁的 AI 交易計畫卡 |
| `ui/TradePage.tsx` | 交易主頁（總覽/持倉/成交/機器人） |
| `ui/INTEGRATION.md` | 如何最小改動貼進 LA1 page.tsx |
