/**
 * LA1 × GrokSim Level 6 — Trading Configuration
 * 全自動 AI Paper Trading 的全部可設定參數
 * 人只需要改這裡 + 緊急停止
 */

export type MarketType = "TW" | "US" | "CRYPTO";

export interface TradingConfig {
  // ─── 總開關 ───────────────────────────────────────────────
  /** 系統是否啟用全自動交易 */
  enabled: boolean;
  /** 緊急停止（一設為 true，立刻停止所有新開倉與大部分自動操作） */
  emergencyStop: boolean;

  // ─── 資金與風險 ───────────────────────────────────────────
  /** 初始模擬資金（TWD） */
  initialCapital: number;
  /** 單筆最大風險佔總資金百分比（例如 2 = 2%） */
  maxPortfolioRiskPct: number;
  /** 總持倉曝險上限百分比 */
  maxTotalExposurePct: number;
  /** 最大同時持倉數量 */
  maxPositions: number;
  /** 單一標的最大佔比百分比 */
  maxPositionPct: number;
  /** 單日最大虧損百分比（觸發當日停止開新倉） */
  maxDailyLossPct: number;

  // ─── 市場與標的 ───────────────────────────────────────────
  allowedMarkets: MarketType[];
  /** 白名單。空陣列 = 使用 scan 結果或全部允許 */
  whitelist: string[];
  blacklist: string[];

  // ─── AI 行為 ──────────────────────────────────────────────
  /** AI 最低信心門檻（0~1），低於此不開倉 */
  minConfidence: number;
  /** 是否強制經過 Risk Engine 審核 */
  requireRiskApproval: boolean;
  /** 是否啟用自動出場 */
  autoExitEnabled: boolean;
  /** 是否啟用移動停損 */
  trailingStopEnabled: boolean;
  /** 預設風險報酬比下限 */
  minRiskReward: number;

  // ─── 交易成本（台股近似） ─────────────────────────────────
  feeRate: number;       // 手續費率
  taxRate: number;       // 證交稅（賣出）
  slippageBps: number;   // 滑價（basis points）

  // ─── 運行節奏 ─────────────────────────────────────────────
  /** AI 決策循環間隔（秒） */
  decisionIntervalSec: number;
  /** 持倉監控間隔（秒） */
  monitorIntervalSec: number;

  // ─── 其他 ────────────────────────────────────────────────
  /** 預設幣別 */
  baseCurrency: "TWD" | "USD" | "USDT";
  /** 是否記錄完整 Decision Snapshot */
  saveDecisionSnapshot: boolean;
}

/** 預設設定（可直接改或從 DB / .env 覆蓋） */
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

/** 簡易深度合併，方便之後從 UI / API 更新部分設定 */
export function mergeTradingConfig(
  base: TradingConfig,
  partial: Partial<TradingConfig>,
): TradingConfig {
  return { ...base, ...partial };
}
