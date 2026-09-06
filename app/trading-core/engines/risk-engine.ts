/**
 * Risk Engine — 擁有最終 Veto 權
 * AI 再強，這裡不過就絕對不開倉
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
    let reason = "通過所有風險檢查";
    let finalSizePct = decision.plan?.sizePct ?? 0;

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

    if (decision.action === "BUY") {
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
      if (account.dailyPnlPct <= -this.config.maxDailyLossPct) {
        return this.reject(
          `已觸發單日最大虧損 ${this.config.maxDailyLossPct}%`,
          ["daily_loss_limit"],
        );
      }

      finalSizePct = Math.min(
        decision.plan.sizePct,
        this.config.maxPositionPct,
        this.config.maxPortfolioRiskPct * 2,
      );

      const currentExposurePct =
        account.equity > 0
          ? (account.positions.reduce((s, p) => s + p.marketValue, 0) /
              account.equity) *
            100
          : 0;

      if (currentExposurePct + finalSizePct > this.config.maxTotalExposurePct) {
        const remaining =
          this.config.maxTotalExposurePct - currentExposurePct;
        if (remaining <= 1) {
          return this.reject("總曝險已達上限", ["max_exposure"]);
        }
        finalSizePct = Math.min(finalSizePct, remaining);
        triggered.push("exposure_adjusted");
      }

      if (finalSizePct < 0.5) {
        return this.reject("調整後倉位過小，放棄開倉", ["size_too_small"]);
      }
    }

    if (triggered.length) {
      reason = `通過（已調整：${triggered.join(", ")}）`;
    }

    return {
      approved: true,
      reason,
      finalSizePct,
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
