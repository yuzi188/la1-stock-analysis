/**
 * LA1 × GrokSim Level 6 — Trading Configuration
 * 全自動 AI Paper Trading 的全部可設定參數
 * 人只需要改這裡 + 緊急停止
 */

export type MarketType = "TW" | "US" | "CRYPTO";

export interface TradingConfig {
  enabled: boolean;
  emergencyStop: boolean;
  initialCapital: number;
  maxPortfolioRiskPct: number;
  maxTotalExposurePct: number;
  maxPositions: number;
  maxPositionPct: number;
  maxDailyLossPct: number;
  allowedMarkets: MarketType[];
  whitelist: string[];
  blacklist: string[];
  minConfidence: number;
  requireRiskApproval: boolean;
  autoExitEnabled: boolean;
  trailingStopEnabled: boolean;
  minRiskReward: number;
  feeRate: number;
  taxRate: number;
  slippageBps: number;
  decisionIntervalSec: number;
  monitorIntervalSec: number;
  baseCurrency: "TWD" | "USD" | "USDT";
  saveDecisionSnapshot: boolean;
}

export const defaultTradingConfig: TradingConfig = {
  enabled: true,
  emergencyStop: false,
  initialCapital: 1_000_000,
  maxPortfolioRiskPct: 2.0,
  maxTotalExposurePct: 60,
  maxPositions: 8,
  maxPositionPct: 15,
  maxDailyLossPct: 5,
  allowedMarkets: ["TW"],
  whitelist: [],
  blacklist: [],
  minConfidence: 0.65,
  requireRiskApproval: true,
  autoExitEnabled: true,
  trailingStopEnabled: true,
  minRiskReward: 1.5,
  feeRate: 0.001425,
  taxRate: 0.003,
  slippageBps: 5,
  decisionIntervalSec: 300,
  monitorIntervalSec: 60,
  baseCurrency: "TWD",
  saveDecisionSnapshot: true,
};

export function mergeTradingConfig(
  base: TradingConfig,
  partial: Partial<TradingConfig>,
): TradingConfig {
  return { ...base, ...partial };
}
