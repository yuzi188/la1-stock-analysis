"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  defaultTradingConfig,
  type TradingConfig,
} from "../config/trading.config";
import { PaperBroker } from "../broker/paper-broker";
import { RiskEngine, type AccountState } from "../engines/risk-engine";
import type { DecisionSnapshot, StructuredDecision } from "../types/decision";
import { toStructuredDecision, type La1AnalyzeResponse } from "../adapters/la1-analyze-adapter";

export function usePaperTrading() {
  const [config, setConfig] = useState<TradingConfig>({ ...defaultTradingConfig });
  const brokerRef = useRef(new PaperBroker(defaultTradingConfig));
  const riskRef = useRef(new RiskEngine(defaultTradingConfig));
  const [snapshots, setSnapshots] = useState<DecisionSnapshot[]>([]);
  const [tick, setTick] = useState(0);
  const [robotRunning, setRobotRunning] = useState(false);
  const [robotCycles, setRobotCycles] = useState(0);
  const [lastCycleAt, setLastCycleAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = () => setTick((t) => t + 1);

  const updateConfig = useCallback((partial: Partial<TradingConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      riskRef.current.updateConfig(partial);
      if (partial.emergencyStop) setRobotRunning(false);
      return next;
    });
  }, []);

  const getAccountSnapshot = useCallback(() => {
    const acc = brokerRef.current.getAccount();
    return {
      cash: acc.cash,
      equity: acc.equity,
      positions: Array.from(acc.positions.values()),
      orders: acc.orders,
      closedTrades: acc.closedTrades,
    };
  }, [tick]);

  const account = useMemo(() => getAccountSnapshot(), [getAccountSnapshot, tick]);

  const accountState = useCallback((markPrice = 0): AccountState => {
    const acc = brokerRef.current.getAccount();
    return {
      cash: acc.cash,
      equity: acc.equity,
      openPositions: acc.positions.size,
      dailyPnlPct: 0,
      positions: Array.from(acc.positions.values()).map((p) => ({
        symbol: p.symbol,
        marketValue: p.quantity * (markPrice || p.avgPrice),
      })),
    };
  }, []);

  const executeDecision = useCallback(
    (decision: StructuredDecision, currentPrice: number) => {
      const state = accountState(currentPrice);
      const verdict = riskRef.current.evaluate(decision, state);
      if (config.saveDecisionSnapshot) {
        const snap = riskRef.current.createSnapshot(decision, verdict, state);
        setSnapshots((prev) => [...prev.slice(-499), snap]);
      }
      if (!verdict.approved) {
        return { ok: false as const, reason: verdict.reason, verdict };
      }
      const order = brokerRef.current.executeMarketOrder(decision, verdict, currentPrice);
      refresh();
      return { ok: true as const, order, verdict };
    },
    [accountState, config.saveDecisionSnapshot],
  );

  const paperBuyFromAnalyze = useCallback(
    (analyzeRes: La1AnalyzeResponse, symbol: string, price: number) => {
      const decision = toStructuredDecision(analyzeRes, symbol);
      if (decision.action !== "BUY") {
        decision.action = "BUY";
        decision.plan = decision.plan ?? {
          entry: price,
          stopLoss: +(price * 0.97).toFixed(2),
          takeProfit: +(price * 1.06).toFixed(2),
          riskReward: 2,
          sizePct: 8,
        };
      }
      return executeDecision(decision, price);
    },
    [executeDecision],
  );

  const closePosition = useCallback(
    (symbol: string, currentPrice: number) => {
      const decision: StructuredDecision = {
        id: `manual_close_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        symbol,
        market: "TW",
        action: "CLOSE",
        stance: "neutral",
        confidence: 1,
        conclusion: "手動平倉",
        plan: null,
        facts: [],
        risks: [],
        invalidation: [],
        model: "manual",
      };
      return executeDecision(decision, currentPrice);
    },
    [executeDecision],
  );

  const robotState: "running" | "stopped" | "emergency" = config.emergencyStop
    ? "emergency"
    : robotRunning
      ? "running"
      : "stopped";

  const dailyPnlPct =
    config.initialCapital > 0
      ? ((account.equity - config.initialCapital) / config.initialCapital) * 100
      : 0;

  return {
    config,
    updateConfig,
    account,
    snapshots,
    robotRunning,
    setRobotRunning,
    robotCycles,
    setRobotCycles,
    lastCycleAt,
    setLastCycleAt,
    lastError,
    setLastError,
    robotState,
    dailyPnlPct,
    executeDecision,
    paperBuyFromAnalyze,
    closePosition,
    toStructuredDecision,
  };
}
