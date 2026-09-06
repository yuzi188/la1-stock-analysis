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
  entry: number | null;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  sizePct: number;
  shares?: number;
}

export interface StructuredDecision {
  id: string;
  generatedAt: string;
  symbol: string;
  market: "TW" | "US" | "CRYPTO";
  action: DecisionAction;
  stance: DecisionStance;
  confidence: number;
  conclusion: string;
  plan: PositionPlan | null;
  facts: string[];
  risks: string[];
  invalidation: string[];
  model: string;
  contextSnapshotHash?: string;
  raw?: unknown;
}

export interface RiskVerdict {
  approved: boolean;
  reason: string;
  finalSizePct?: number;
  finalShares?: number;
  triggeredRules: string[];
}

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
