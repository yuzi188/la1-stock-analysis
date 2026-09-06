/**
 * Stock Robot — 全自動決策循環骨架
 * 實際 UI 目前透過 usePaperTrading hook 操作 PaperBroker
 */

import type { TradingConfig } from "../config/trading.config";
import type { StructuredDecision } from "../types/decision";
import { RiskEngine, type AccountState } from "./risk-engine";
import { PaperBroker } from "../broker/paper-broker";

export interface MarketQuote {
  symbol: string;
  price: number;
  name?: string;
}

export interface MarketContextLite {
  quote: MarketQuote;
}

export type AiDecisionFn = (
  symbol: string,
  context: MarketContextLite,
) => Promise<StructuredDecision>;

export type GetQuoteFn = (symbol: string) => Promise<MarketQuote | null>;
export type GetCandidatesFn = () => Promise<string[]>;

export interface RobotStatus {
  running: boolean;
  lastCycleAt: string | null;
  cycles: number;
  lastError: string | null;
  openPositions: number;
  equity: number;
  cash: number;
}

export class StockRobot {
  private config: TradingConfig;
  private risk: RiskEngine;
  private broker: PaperBroker;
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private cycles = 0;
  private lastCycleAt: string | null = null;
  private lastError: string | null = null;

  constructor(
    config: TradingConfig,
    private aiDecide: AiDecisionFn,
    private getQuote: GetQuoteFn,
    private getCandidates: GetCandidatesFn = async () => [],
  ) {
    this.config = { ...config };
    this.risk = new RiskEngine(this.config);
    this.broker = new PaperBroker(this.config);
  }

  updateConfig(partial: Partial<TradingConfig>) {
    this.config = { ...this.config, ...partial };
    this.risk.updateConfig(partial);
    if (partial.emergencyStop) this.stop("緊急停止被觸發");
  }

  getConfig() {
    return { ...this.config };
  }

  getStatus(): RobotStatus {
    const acc = this.broker.getAccount();
    return {
      running: this.running,
      lastCycleAt: this.lastCycleAt,
      cycles: this.cycles,
      lastError: this.lastError,
      openPositions: acc.positions.size,
      equity: acc.equity,
      cash: acc.cash,
    };
  }

  getBroker() {
    return this.broker;
  }

  start() {
    if (this.running) return;
    if (this.config.emergencyStop) {
      this.lastError = "無法啟動：緊急停止中";
      return;
    }
    this.running = true;
    this.lastError = null;
    void this.runCycle();
    this.timer = setInterval(() => {
      void this.runCycle();
    }, this.config.decisionIntervalSec * 1000);
  }

  stop(reason = "手動停止") {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log(`[StockRobot] 已停止：${reason}`);
  }

  async runCycle() {
    if (!this.config.enabled || this.config.emergencyStop) {
      this.stop("config disabled or emergencyStop");
      return;
    }
    this.cycles += 1;
    this.lastCycleAt = new Date().toISOString();
    let symbols =
      this.config.whitelist.length > 0
        ? [...this.config.whitelist]
        : await this.getCandidates();
    symbols = symbols.filter((s) => !this.config.blacklist.includes(s));
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        if (!quote?.price) continue;
        const decision = await this.aiDecide(symbol, { quote });
        decision.symbol = symbol;
        if (!decision.id) decision.id = `dec_${Date.now()}_${symbol}`;
        if (!decision.generatedAt) decision.generatedAt = new Date().toISOString();
        const acc = this.broker.getAccount();
        const accountState: AccountState = {
          cash: acc.cash,
          equity: acc.equity,
          openPositions: acc.positions.size,
          dailyPnlPct: 0,
          positions: Array.from(acc.positions.values()).map((p) => ({
            symbol: p.symbol,
            marketValue: p.quantity * quote.price,
          })),
        };
        const verdict = this.risk.evaluate(decision, accountState);
        if (verdict.approved) {
          this.broker.executeMarketOrder(decision, verdict, quote.price);
        }
      } catch (err) {
        this.lastError = String(err);
      }
    }
  }
}
