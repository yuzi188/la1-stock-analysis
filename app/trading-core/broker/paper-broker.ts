/**
 * Paper Broker — FIX: per-symbol marks for equity
 */
import type { TradingConfig } from "../config/trading.config";
import type { StructuredDecision, RiskVerdict } from "../types/decision";

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  filledPrice?: number;
  filledAt?: string;
  fee: number;
  createdAt: string;
  rejectReason?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  market: "TW" | "US" | "CRYPTO";
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
  lastMarkPrice?: number;
}

export interface PaperAccount {
  cash: number;
  equity: number;
  dayStartEquity: number;
  positions: Map<string, Position>;
  orders: Order[];
  closedTrades: {
    symbol: string;
    side: OrderSide;
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    fee: number;
    closedAt: string;
  }[];
}

export class PaperBroker {
  private account: PaperAccount;
  private orderSeq = 0;
  private marks = new Map<string, number>();

  constructor(private config: TradingConfig) {
    this.account = {
      cash: config.initialCapital,
      equity: config.initialCapital,
      dayStartEquity: config.initialCapital,
      positions: new Map(),
      orders: [],
      closedTrades: [],
    };
  }

  getAccount() { return this.account; }
  getCash() { return this.account.cash; }
  getPositions() { return Array.from(this.account.positions.values()); }

  updateMarks(prices: Record<string, number> | Map<string, number>) {
    const entries = prices instanceof Map ? prices.entries() : Object.entries(prices);
    for (const [symbol, price] of entries) {
      if (typeof price === "number" && Number.isFinite(price) && price > 0) {
        this.marks.set(symbol, price);
        const pos = this.account.positions.get(symbol);
        if (pos) pos.lastMarkPrice = price;
      }
    }
    this.recalcEquity();
  }

  getDailyPnlPct() {
    if (this.account.dayStartEquity <= 0) return 0;
    return ((this.account.equity - this.account.dayStartEquity) / this.account.dayStartEquity) * 100;
  }

  rollDay() {
    this.recalcEquity();
    this.account.dayStartEquity = this.account.equity;
  }

  recalcEquity() {
    let positionsValue = 0;
    for (const pos of this.account.positions.values()) {
      const px = pos.lastMarkPrice ?? this.marks.get(pos.symbol) ?? pos.avgPrice;
      positionsValue += pos.quantity * px;
    }
    this.account.equity = this.account.cash + positionsValue;
  }

  executeMarketOrder(decision: StructuredDecision, verdict: RiskVerdict, currentPrice: number): Order {
    if (!verdict.approved) return this.rejectOrder(decision.symbol, "buy", 0, "Risk 未通過");
    if (!currentPrice || currentPrice <= 0) return this.rejectOrder(decision.symbol, "buy", 0, "無效價格");
    this.marks.set(decision.symbol, currentPrice);
    if (decision.action === "BUY") return this.fillBuy(decision, verdict, currentPrice);
    if (decision.action === "SELL" || decision.action === "CLOSE") return this.fillSell(decision, currentPrice);
    return this.rejectOrder(decision.symbol, "buy", 0, "不支援的動作");
  }

  private fillBuy(decision: StructuredDecision, verdict: RiskVerdict, currentPrice: number): Order {
    const slippage = currentPrice * (this.config.slippageBps / 10000);
    const fillPrice = currentPrice + slippage;
    let quantity = verdict.finalShares ?? 0;
    if (quantity <= 0) {
      const sizePct = verdict.finalSizePct ?? decision.plan?.sizePct ?? 0;
      quantity = Math.floor((this.account.equity * (sizePct / 100)) / fillPrice);
    }
    if (quantity <= 0) return this.rejectOrder(decision.symbol, "buy", 0, "數量為 0");
    const notional = quantity * fillPrice;
    const fee = notional * this.config.feeRate;
    const cost = notional + fee;
    if (cost > this.account.cash) return this.rejectOrder(decision.symbol, "buy", quantity, "現金不足");
    this.account.cash -= cost;
    const existing = this.account.positions.get(decision.symbol);
    if (existing) {
      const totalQty = existing.quantity + quantity;
      existing.avgPrice = (existing.avgPrice * existing.quantity + fillPrice * quantity) / totalQty;
      existing.quantity = totalQty;
      existing.lastMarkPrice = currentPrice;
      if (decision.plan?.stopLoss) existing.stopLoss = decision.plan.stopLoss;
      if (decision.plan?.takeProfit) existing.takeProfit = decision.plan.takeProfit;
    } else {
      this.account.positions.set(decision.symbol, {
        symbol: decision.symbol,
        quantity,
        avgPrice: fillPrice,
        market: decision.market,
        stopLoss: decision.plan?.stopLoss,
        takeProfit: decision.plan?.takeProfit,
        openedAt: new Date().toISOString(),
        lastMarkPrice: currentPrice,
      });
    }
    const order: Order = {
      id: `PO-${++this.orderSeq}`,
      symbol: decision.symbol,
      side: "buy",
      type: "market",
      quantity,
      status: "filled",
      filledPrice: fillPrice,
      filledAt: new Date().toISOString(),
      fee,
      createdAt: new Date().toISOString(),
    };
    this.account.orders.push(order);
    this.recalcEquity();
    return order;
  }

  private fillSell(decision: StructuredDecision, currentPrice: number): Order {
    const pos = this.account.positions.get(decision.symbol);
    if (!pos || pos.quantity <= 0) return this.rejectOrder(decision.symbol, "sell", 0, "無持倉");
    const slippage = currentPrice * (this.config.slippageBps / 10000);
    const fillPrice = currentPrice - slippage;
    const sellQty = pos.quantity;
    const proceeds = sellQty * fillPrice;
    const tax = proceeds * this.config.taxRate;
    const sellFee = proceeds * this.config.feeRate;
    this.account.cash += proceeds - sellFee - tax;
    const pnl = (fillPrice - pos.avgPrice) * sellQty - sellFee - tax;
    this.account.closedTrades.push({
      symbol: decision.symbol, side: "sell", quantity: sellQty,
      entryPrice: pos.avgPrice, exitPrice: fillPrice, pnl, fee: sellFee + tax,
      closedAt: new Date().toISOString(),
    });
    this.account.positions.delete(decision.symbol);
    const order: Order = {
      id: `PO-${++this.orderSeq}`, symbol: decision.symbol, side: "sell", type: "market",
      quantity: sellQty, status: "filled", filledPrice: fillPrice,
      filledAt: new Date().toISOString(), fee: sellFee + tax, createdAt: new Date().toISOString(),
    };
    this.account.orders.push(order);
    this.recalcEquity();
    return order;
  }

  private rejectOrder(symbol: string, side: OrderSide, quantity: number, reason: string): Order {
    const order: Order = {
      id: `PO-${++this.orderSeq}`, symbol, side, type: "market", quantity,
      status: "rejected", fee: 0, createdAt: new Date().toISOString(), rejectReason: reason,
    };
    this.account.orders.push(order);
    console.warn(`[PaperBroker] Order rejected: ${reason}`);
    return order;
  }
}
