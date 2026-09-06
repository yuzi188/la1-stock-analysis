/**
 * Risk Engine — 最終 Veto + 真正 risk-based position sizing
 *
 * sizing 公式：
 *   riskBudget = equity × (maxPortfolioRiskPct / 100)
 *   perShareRisk = entry - stopLoss
 *   qty = floor(riskBudget / perShareRisk)
 * 再受 maxPositionPct、現金、maxPositions、總曝險 限制
 */

import type { TradingConfig } from "../config/trading.config";
import type {
  StructuredDecision,
  RiskVerdict,
  DecisionSnapshot,
} from "../types/decision";

export interface AccountState {
  cash: number;
  equity: number;
  openPositions: number;
  dailyPnlPct: number;
  positions: { symbol: string; marketValue: number }[];
}

export class RiskEngine {
  constructor(private config: TradingConfig) {}

  updateConfig(partial: Partial<TradingConfig>) {
    this.config = { ...this.config, ...partial };
  }

  evaluate(
    decision: StructuredDecision,
    account: AccountState,
  ): RiskVerdict {
    const triggered: string[] = [];

    if (!this.config.enabled) {
      return this.reject("系統未啟用 (enabled=false)", ["system_disabled"]);
    }
    if (this.config.emergencyStop) {
      return this.reject("緊急停止已啟動", ["emergency_stop"]);
    }
    if (decision.action === "HOLD") {
      return this.reject("HOLD 不執行交易", ["action_hold"]);
    }
    if (decision.confidence < this.config.minConfidence) {
      return this.reject(
        `信心 ${decision.confidence.toFixed(2)} 低於門檻 ${this.config.minConfidence}`,
        ["low_confidence"],
      );
    }
    if (this.config.blacklist.includes(decision.symbol)) {
      return this.reject(`標的在黑名單: ${decision.symbol}`, ["blacklist"]);
    }
    if (
      this.config.whitelist.length > 0 &&
      !this.config.whitelist.includes(decision.symbol)
    ) {
      return this.reject(`標的不在白名單: ${decision.symbol}`, ["whitelist"]);
    }
    if (!this.config.allowedMarkets.includes(decision.market)) {
      return this.reject(`市場未開放: ${decision.market}`, ["market_not_allowed"]);
    }

    // 單日虧損熔斷（依賴真實 dailyPnlPct）
    if (account.dailyPnlPct <= -this.config.maxDailyLossPct) {
      return this.reject(
        `已觸發單日最大虧損 ${this.config.maxDailyLossPct}%（目前 ${account.dailyPnlPct.toFixed(2)}%）`,
        ["daily_loss_limit"],
      );
    }

    if (decision.action === "BUY") {
      return this.evaluateBuy(decision, account, triggered);
    }

    // SELL / CLOSE / REDUCE：放行（仍可日後加更細規則）
    return {
      approved: true,
      reason: "通過出場檢查",
      triggeredRules: triggered,
    };
  }

  private evaluateBuy(
    decision: StructuredDecision,
    account: AccountState,
    triggered: string[],
  ): RiskVerdict {
    if (!decision.plan) {
      return this.reject("BUY 缺少 plan（entry/SL/TP）", ["missing_plan"]);
    }
    if (decision.plan.riskReward < this.config.minRiskReward) {
      return this.reject(
        `R:R ${decision.plan.riskReward.toFixed(2)} 低於最低要求 ${this.config.minRiskReward}`,
        ["low_rr"],
      );
    }
    if (account.openPositions >= this.config.maxPositions) {
      return this.reject(
        `已達最大持倉數 ${this.config.maxPositions}`,
        ["max_positions"],
      );
    }

    const entry = decision.plan.entry ?? 0;
    const stop = decision.plan.stopLoss;
    if (!entry || entry <= 0 || !stop || stop <= 0) {
      return this.reject("進場價或停損無效", ["invalid_levels"]);
    }
    if (stop >= entry) {
      return this.reject("停損必須低於進場價（多單）", ["invalid_stop"]);
    }

    const perShareRisk = entry - stop;
    if (perShareRisk <= 0) {
      return this.reject("每股風險無效", ["invalid_per_share_risk"]);
    }

    // === 真正 risk-based sizing ===
    const riskBudget =
      account.equity * (this.config.maxPortfolioRiskPct / 100);
    let qty = Math.floor(riskBudget / perShareRisk);
    triggered.push("risk_based_sizing");

    // 受單一標的市值上限限制
    const maxNotionalByPct =
      account.equity * (this.config.maxPositionPct / 100);
    const maxQtyByPct = Math.floor(maxNotionalByPct / entry);
    if (qty > maxQtyByPct) {
      qty = maxQtyByPct;
      triggered.push("capped_by_max_position_pct");
    }

    // 受現金限制（粗估含手續費）
    const estFeeRate = this.config.feeRate;
    const maxQtyByCash = Math.floor(
      account.cash / (entry * (1 + estFeeRate)),
    );
    if (qty > maxQtyByCash) {
      qty = maxQtyByCash;
      triggered.push("capped_by_cash");
    }

    // 總曝險
    const currentExposure = account.positions.reduce(
      (s, p) => s + p.marketValue,
      0,
    );
    const currentExposurePct =
      account.equity > 0 ? (currentExposure / account.equity) * 100 : 0;
    const remainingExposurePct =
      this.config.maxTotalExposurePct - currentExposurePct;
    if (remainingExposurePct <= 1) {
      return this.reject("總曝險已達上限", ["max_exposure"]);
    }
    const maxQtyByExposure = Math.floor(
      (account.equity * (remainingExposurePct / 100)) / entry,
    );
    if (qty > maxQtyByExposure) {
      qty = maxQtyByExposure;
      triggered.push("capped_by_total_exposure");
    }

    if (qty < 1) {
      return this.reject("調整後股數 < 1，放棄開倉", ["size_too_small"]);
    }

    // 回推 sizePct 供日誌/相容
    const finalSizePct = ((qty * entry) / account.equity) * 100;
    // 實際風險佔比
    const actualRiskPct = ((qty * perShareRisk) / account.equity) * 100;

    return {
      approved: true,
      reason: `通過（風險 ${actualRiskPct.toFixed(2)}% / 股數 ${qty}）`,
      finalSizePct: +finalSizePct.toFixed(4),
      finalShares: qty,
      triggeredRules: triggered,
    };
  }

  createSnapshot(
    decision: StructuredDecision,
    verdict: RiskVerdict,
    account: AccountState,
  ): DecisionSnapshot {
    return {
      decision,
      riskVerdict: verdict,
      accountStateBefore: {
        cash: account.cash,
        equity: account.equity,
        openPositions: account.openPositions,
        dailyPnlPct: account.dailyPnlPct,
      },
      createdAt: new Date().toISOString(),
    };
  }

  private reject(reason: string, rules: string[]): RiskVerdict {
    return {
      approved: false,
      reason,
      triggeredRules: rules,
    };
  }
}
