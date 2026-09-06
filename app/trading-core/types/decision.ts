/**
 * Structured Decision — AI 只能輸出這個格式
 * Risk Engine 與 Paper Broker 只認這個結構
 */

export type DecisionAction = "BUY" | "SELL" | "HOLD" | "REDUCE" | "CLOSE";

export type DecisionStance = "bullish" | "neutral" | "bearish";

export interface PriceLevel {
  price: number;
  reason: string;
}

export interface PositionPlan {
  /** 建議進場價（市價單可為 null） */
  entry: number | null;
  /** 停損 */
  stopLoss: number;
  /** 目標價 */
  takeProfit: number;
  /** 風險報酬比 */
  riskReward: number;
  /** 建議倉位佔總資金百分比 */
  sizePct: number;
  /** 建議股數（可選，由 Risk Engine 最終計算） */
  shares?: number;
}

export interface StructuredDecision {
  /** 唯一決策 ID */
  id: string;
  /** 產生時間 */
  generatedAt: string;
  /** 標的 */
  symbol: string;
  market: "TW" | "US" | "CRYPTO";
  /** 動作 */
  action: DecisionAction;
  /** 立場 */
  stance: DecisionStance;
  /** AI 信心 0~1 */
  confidence: number;
  /** 一句話結論 */
  conclusion: string;
  /** 進場與風險計畫（BUY 時必填） */
  plan: PositionPlan | null;
  /** 支持事實 */
  facts: string[];
  /** 主要風險 */
  risks: string[];
  /** 失效條件（thesis invalidation） */
  invalidation: string[];
  /** 使用的模型 */
  model: string;
  /** 當時的 Market Context 摘要（防 look-ahead 用） */
  contextSnapshotHash?: string;
  /** 原始 AI 輸出（debug） */
  raw?: unknown;
}

/** Risk Engine 審核結果 */
export interface RiskVerdict {
  approved: boolean;
  reason: string;
  /** 被調整後的最終倉位（可能比 AI 建議小） */
  finalSizePct?: number;
  finalShares?: number;
  /** 觸發的規則 */
  triggeredRules: string[];
}

/** 完整決策快照（一定要存） */
export interface DecisionSnapshot {
  decision: StructuredDecision;
  riskVerdict: RiskVerdict;
  accountStateBefore: {
    cash: number;
    equity: number;
    openPositions: number;
    dailyPnlPct: number;
  };
  createdAt: string;
}
