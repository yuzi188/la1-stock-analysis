/**
 * Stock Robot — 全自動台股 AI 交易機器人
 * 
 * 流程：
 * 1. 拉取標的清單（whitelist 或外部 scan）
 * 2. 對每個標的取得最新 Context + 價格
 * 3. 呼叫 AI 產生 StructuredDecision
 * 4. Risk Engine 審核
 * 5. 通過 → Paper Broker 執行
 * 6. 持續監控持倉（停損/停利）
 * 
 * 全部行為受 TradingConfig 控制，可隨時緊急停止
 */

import type { TradingConfig } from "../config/trading.config";
import { defaultTradingConfig } from "../config/trading.config";
import type {
  StructuredDecision,
  DecisionSnapshot,
  DecisionAction,
} from "../types/decision";
import { RiskEngine, type AccountState } from "./risk-engine";
import { PaperBroker } from "../broker/paper-broker";

// ────────────────────────────────────────────────────────────
// 外部依賴介面（之後接到 LA1 的真實 API）
// ────────────────────────────────────────────────────────────

export interface MarketQuote {
  symbol: string;
  price: number;
  name?: string;
}

export interface MarketContextLite {
  quote: MarketQuote;
  // 之後可擴充 technical / revenue / news...
}

/** AI 決策函數（之後接 LA1 /api/analyze 或直接呼叫 OpenAI） */
export type AiDecisionFn = (
  symbol: string,
  context: MarketContextLite,
) => Promise<StructuredDecision>;

/** 取得報價函數 */
export type GetQuoteFn = (symbol: string) => Promise<MarketQuote | null>;

/** 取得候選標的（whitelist 為空時使用） */
export type GetCandidatesFn = () => Promise<string[]>;

// ────────────────────────────────────────────────────────────
// Robot 本體
// ────────────────────────────────────────────────────────────

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
  private snapshots: DecisionSnapshot[] = [];

  constructor(
    config: TradingConfig = defaultTradingConfig,
    private aiDecide: AiDecisionFn,
    private getQuote: GetQuoteFn,
    private getCandidates: GetCandidatesFn = async () => [],
  ) {
    this.config = { ...config };
    this.risk = new RiskEngine(this.config);
    this.broker = new PaperBroker(this.config);
  }

  /** 熱更新設定 */
  updateConfig(partial: Partial<TradingConfig>) {
    this.config = { ...this.config, ...partial };
    this.risk.updateConfig(partial);
    if (partial.emergencyStop) {
      this.stop("緊急停止被觸發");
    }
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

  getSnapshots() {
    return [...this.snapshots];
  }

  getBroker() {
    return this.broker;
  }

  /** 啟動全自動循環 */
  start() {
    if (this.running) return;
    if (this.config.emergencyStop) {
      this.lastError = "無法啟動：緊急停止中";
      return;
    }
    this.running = true;
    this.lastError = null;
    console.log(`[StockRobot] 啟動，決策間隔 ${this.config.decisionIntervalSec}s`);

    // 立刻跑一次
    this.runCycle().catch((e) => {
      this.lastError = String(e);
      console.error("[StockRobot] cycle error", e);
    });

    this.timer = setInterval(() => {
      this.runCycle().catch((e) => {
        this.lastError = String(e);
        console.error("[StockRobot] cycle error", e);
      });
    }, this.config.decisionIntervalSec * 1000);
  }

  /** 停止 */
  stop(reason = "手動停止") {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log(`[StockRobot] 已停止：${reason}`);
  }

  /** 單次決策循環（可手動觸發測試） */
  async runCycle() {
    if (!this.config.enabled || this.config.emergencyStop) {
      this.stop("config disabled or emergencyStop");
      return;
    }

    this.cycles += 1;
    this.lastCycleAt = new Date().toISOString();
    console.log(`[StockRobot] ===== Cycle #${this.cycles} ${this.lastCycleAt} =====`);

    // 1. 決定要看哪些標的
    let symbols =
      this.config.whitelist.length > 0
        ? [...this.config.whitelist]
        : await this.getCandidates();

    symbols = symbols.filter((s) => !this.config.blacklist.includes(s));
    if (symbols.length === 0) {
      console.log("[StockRobot] 沒有候選標的，跳過本輪");
      return;
    }

    // 2. 先處理既有持倉的出場檢查（簡易版）
    await this.checkExits();

    // 3. 對每個標的做決策
    for (const symbol of symbols) {
      try {
        await this.processSymbol(symbol);
      } catch (err) {
        console.error(`[StockRobot] 處理 ${symbol} 失敗`, err);
      }
    }
  }

  private async processSymbol(symbol: string) {
    const quote = await this.getQuote(symbol);
    if (!quote || !quote.price) {
      console.log(`[StockRobot] ${symbol} 無報價，跳過`);
      return;
    }

    const context: MarketContextLite = { quote };

    // AI 產生 Structured Decision
    const decision = await this.aiDecide(symbol, context);

    // 補上必要欄位
    if (!decision.id) {
      decision.id = `dec_${Date.now()}_${symbol}`;
    }
    if (!decision.generatedAt) {
      decision.generatedAt = new Date().toISOString();
    }
    decision.symbol = symbol;

    // 組 AccountState 給 Risk Engine
    const acc = this.broker.getAccount();
    const accountState: AccountState = {
      cash: acc.cash,
      equity: acc.equity,
      openPositions: acc.positions.size,
      dailyPnlPct: 0, // 之後可接真實日損益
      positions: Array.from(acc.positions.values()).map((p) => ({
        symbol: p.symbol,
        marketValue: p.quantity * quote.price, // 簡化
      })),
    };

    // Risk 審核
    const verdict = this.risk.evaluate(decision, accountState);

    // 存 Snapshot
    if (this.config.saveDecisionSnapshot) {
      const snap = this.risk.createSnapshot(decision, verdict, accountState);
      this.snapshots.push(snap);
      // 只保留最近 500 筆
      if (this.snapshots.length > 500) this.snapshots.shift();
    }

    console.log(
      `[StockRobot] ${symbol} → ${decision.action} conf=${decision.confidence.toFixed(2)} | Risk: ${verdict.approved ? "PASS" : "REJECT"} (${verdict.reason})`,
    );

    if (!verdict.approved) return;

    // 執行
    if (decision.action === "BUY" || decision.action === "SELL" || decision.action === "CLOSE") {
      const order = this.broker.executeMarketOrder(decision, verdict, quote.price);
      console.log(
        `[StockRobot] Order ${order.status} ${order.side} ${order.quantity} ${symbol} @ ${order.filledPrice ?? "-"}`,
      );
    }
  }

  /** 簡易出場檢查：停損 / 停利 */
  private async checkExits() {
    if (!this.config.autoExitEnabled) return;

    const positions = this.broker.getPositions();
    for (const pos of positions) {
      const quote = await this.getQuote(pos.symbol);
      if (!quote) continue;

      let shouldClose = false;
      let reason = "";

      if (pos.stopLoss && quote.price <= pos.stopLoss) {
        shouldClose = true;
        reason = `觸發停損 ${pos.stopLoss}`;
      }
      if (pos.takeProfit && quote.price >= pos.takeProfit) {
        shouldClose = true;
        reason = `觸發停利 ${pos.takeProfit}`;
      }

      if (shouldClose) {
        console.log(`[StockRobot] 自動出場 ${pos.symbol}：${reason}`);
        const decision: StructuredDecision = {
          id: `exit_${Date.now()}_${pos.symbol}`,
          generatedAt: new Date().toISOString(),
          symbol: pos.symbol,
          market: pos.market,
          action: "CLOSE",
          stance: "neutral",
          confidence: 1,
          conclusion: reason,
          plan: null,
          facts: [reason],
          risks: [],
          invalidation: [],
          model: "exit-monitor",
        };

        const acc = this.broker.getAccount();
        const accountState: AccountState = {
          cash: acc.cash,
          equity: acc.equity,
          openPositions: acc.positions.size,
          dailyPnlPct: 0,
          positions: [],
        };

        // 出場通常直接過 Risk（或做較寬鬆檢查）
        const verdict = {
          approved: true,
          reason: "auto exit",
          triggeredRules: ["auto_exit"],
        };

        this.broker.executeMarketOrder(decision, verdict, quote.price);
      }
    }
  }
}
