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
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  market: "TW" | "US" | "CRYPTO";
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
}

export interface PaperAccount {
  cash: number;
  equity: number;
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

  constructor(private config: TradingConfig) {
    this.account = {
      cash: config.initialCapital,
      equity: config.initialCapital,
      positions: new Map(),
      orders: [],
      closedTrades: [],
    };
  }

  getAccount(): PaperAccount {
    return this.account;
  }

  getCash() {
    return this.account.cash;
  }

  getPositions() {
    return Array.from(this.account.positions.values());
  }

  executeMarketOrder(
    decision: StructuredDecision,
    verdict: RiskVerdict,
    currentPrice: number,
  ): Order {
    if (!verdict.approved) {
      return this.rejectOrder(decision.symbol, "buy", 0, "Risk 未通過");
    }

    const sizePct = verdict.finalSizePct ?? decision.plan?.sizePct ?? 0;
    const notional = this.account.equity * (sizePct / 100);
    const slippage = currentPrice * (this.config.slippageBps / 10000);
    const fillPrice =
      decision.action === "BUY" ? currentPrice + slippage : currentPrice - slippage;

    const quantity = Math.floor(notional / fillPrice) || (decision.action === "CLOSE" || decision.action === "SELL" ? 0 : 0);
    const fee = Math.max(notional, quantity * fillPrice) * this.config.feeRate;

    if (decision.action === "BUY") {
      const qty = Math.floor(notional / fillPrice);
      if (qty <= 0) return this.rejectOrder(decision.symbol, "buy", 0, "數量為 0");
      const cost = qty * fillPrice + fee;
      if (cost > this.account.cash) return this.rejectOrder(decision.symbol, "buy", qty, "現金不足");
      this.account.cash -= cost;
      const existing = this.account.positions.get(decision.symbol);
      if (existing) {
        const totalQty = existing.quantity + qty;
        existing.avgPrice =
          (existing.avgPrice * existing.quantity + fillPrice * qty) / totalQty;
        existing.quantity = totalQty;
        if (decision.plan?.stopLoss) existing.stopLoss = decision.plan.stopLoss;
        if (decision.plan?.takeProfit) existing.takeProfit = decision.plan.takeProfit;
      } else {
        this.account.positions.set(decision.symbol, {
          symbol: decision.symbol,
          quantity: qty,
          avgPrice: fillPrice,
          market: decision.market,
          stopLoss: decision.plan?.stopLoss,
          takeProfit: decision.plan?.takeProfit,
          openedAt: new Date().toISOString(),
        });
      }
      const order: Order = {
        id: `PO-${++this.orderSeq}`,
        symbol: decision.symbol,
        side: "buy",
        type: "market",
        quantity: qty,
        status: "filled",
        filledPrice: fillPrice,
        filledAt: new Date().toISOString(),
        fee,
        createdAt: new Date().toISOString(),
      };
      this.account.orders.push(order);
      this.recalcEquity(currentPrice);
      return order;
    }

    if (decision.action === "SELL" || decision.action === "CLOSE") {
      const pos = this.account.positions.get(decision.symbol);
      if (!pos || pos.quantity <= 0) return this.rejectOrder(decision.symbol, "sell", 0, "無持倉");
      const sellQty = pos.quantity;
      const proceeds = sellQty * fillPrice;
      const tax = proceeds * this.config.taxRate;
      const sellFee = proceeds * this.config.feeRate;
      this.account.cash += proceeds - sellFee - tax;
      const pnl = (fillPrice - pos.avgPrice) * sellQty - sellFee - tax;
      this.account.closedTrades.push({
        symbol: decision.symbol,
        side: "sell",
        quantity: sellQty,
        entryPrice: pos.avgPrice,
        exitPrice: fillPrice,
        pnl,
        fee: sellFee + tax,
        closedAt: new Date().toISOString(),
      });
      this.account.positions.delete(decision.symbol);
      const order: Order = {
        id: `PO-${++this.orderSeq}`,
        symbol: decision.symbol,
        side: "sell",
        type: "market",
        quantity: sellQty,
        status: "filled",
        filledPrice: fillPrice,
        filledAt: new Date().toISOString(),
        fee: sellFee + tax,
        createdAt: new Date().toISOString(),
      };
      this.account.orders.push(order);
      this.recalcEquity(currentPrice);
      return order;
    }

    return this.rejectOrder(decision.symbol, "buy", 0, "不支援的動作");
  }

  private rejectOrder(symbol: string, side: OrderSide, quantity: number, reason: string): Order {
    const order: Order = {
      id: `PO-${++this.orderSeq}`,
      symbol,
      side,
      type: "market",
      quantity,
      status: "rejected",
      fee: 0,
      createdAt: new Date().toISOString(),
    };
    this.account.orders.push(order);
    console.warn(`[PaperBroker] Order rejected: ${reason}`);
    return order;
  }

  private recalcEquity(lastPrice: number) {
    let positionsValue = 0;
    for (const pos of this.account.positions.values()) {
      positionsValue += pos.quantity * lastPrice;
    }
    this.account.equity = this.account.cash + positionsValue;
  }
}
