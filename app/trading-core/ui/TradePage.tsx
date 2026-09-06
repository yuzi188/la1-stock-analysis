"use client";

import { useMemo, useState } from "react";
import type { TradingConfig } from "../config/trading.config";
import type { DecisionSnapshot } from "../types/decision";

type TradeTab = "overview" | "positions" | "orders" | "robot";

export interface PositionRow {
  symbol: string;
  name?: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface OrderRow {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  status: string;
  filledPrice?: number;
  createdAt: string;
}

export interface TradePageProps {
  cash: number;
  equity: number;
  dailyPnlPct: number;
  positions: PositionRow[];
  orders: OrderRow[];
  snapshots: DecisionSnapshot[];
  config: TradingConfig;
  robotRunning: boolean;
  robotCycles: number;
  lastCycleAt: string | null;
  onStartRobot: () => void;
  onStopRobot: () => void;
  onEmergencyStop: () => void;
  onUpdateConfig: (partial: Partial<TradingConfig>) => void;
  onClosePosition?: (symbol: string) => void;
}

function fmt(n: number, d = 0) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  }).format(n);
}

export function TradePage(props: TradePageProps) {
  const [tab, setTab] = useState<TradeTab>("overview");
  const [draft, setDraft] = useState({
    maxPortfolioRiskPct: props.config.maxPortfolioRiskPct,
    maxPositions: props.config.maxPositions,
    minConfidence: props.config.minConfidence,
    decisionIntervalSec: props.config.decisionIntervalSec,
    whitelistText: props.config.whitelist.join(","),
  });

  const recentLogs = useMemo(
    () =>
      [...props.snapshots]
        .reverse()
        .slice(0, 30)
        .map((s) => ({
          time: new Date(s.createdAt).toLocaleTimeString("zh-TW", { hour12: false }),
          symbol: s.decision.symbol,
          action: s.decision.action,
          conf: s.decision.confidence,
          pass: s.riskVerdict.approved,
          reason: s.riskVerdict.reason,
        })),
    [props.snapshots],
  );

  const tabs: { key: TradeTab; label: string }[] = [
    { key: "overview", label: "總覽" },
    { key: "positions", label: "持倉" },
    { key: "orders", label: "成交" },
    { key: "robot", label: "機器人" },
  ];

  return (
    <div className="dashboard">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "primary-button" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="panel">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
            <div><small>現金</small><div><strong>NT$ {fmt(props.cash)}</strong></div></div>
            <div><small>權益</small><div><strong>NT$ {fmt(props.equity)}</strong></div></div>
            <div><small>今日損益</small><div><strong>{props.dailyPnlPct > 0 ? "+" : ""}{props.dailyPnlPct.toFixed(2)}%</strong></div></div>
            <div><small>持倉數</small><div><strong>{props.positions.length}</strong></div></div>
          </div>
        </section>
      )}

      {tab === "positions" && (
        <section className="panel">
          <h3>持倉明細</h3>
          {props.positions.length === 0 ? (
            <p>尚無持倉</p>
          ) : (
            <div className="compact-list">
              {props.positions.map((p) => (
                <div key={p.symbol} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>{p.symbol} × {fmt(p.quantity)} @ {fmt(p.avgPrice, 2)}</span>
                  <button type="button" onClick={() => props.onClosePosition?.(p.symbol)}>平倉</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section className="panel">
          <h3>最近委託</h3>
          {props.orders.length === 0 ? (
            <p>尚無紀錄</p>
          ) : (
            <div className="compact-list">
              {[...props.orders].reverse().slice(0, 50).map((o) => (
                <div key={o.id}>
                  {o.symbol} {o.side} {o.quantity} {o.status} {o.filledPrice ? fmt(o.filledPrice, 2) : ""}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "robot" && (
        <>
          <section className="panel">
            <h3>AI 股票機器人</h3>
            <p>
              狀態：{props.robotRunning ? "運行中" : "已停止"} · 已跑 {props.robotCycles} 輪
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="primary-button" onClick={props.onStartRobot}>啟動</button>
              <button type="button" onClick={props.onStopRobot}>暫停</button>
              <button type="button" onClick={props.onEmergencyStop}>緊急停止</button>
            </div>
          </section>
          <section className="panel">
            <h3>可設定參數</h3>
            <label>單筆風險 %
              <input type="number" step="0.1" value={draft.maxPortfolioRiskPct}
                onChange={(e) => setDraft((d) => ({ ...d, maxPortfolioRiskPct: Number(e.target.value) }))} />
            </label>
            <label>最大持倉數
              <input type="number" value={draft.maxPositions}
                onChange={(e) => setDraft((d) => ({ ...d, maxPositions: Number(e.target.value) }))} />
            </label>
            <label>最低信心
              <input type="number" step="0.01" min={0} max={1} value={draft.minConfidence}
                onChange={(e) => setDraft((d) => ({ ...d, minConfidence: Number(e.target.value) }))} />
            </label>
            <label>白名單
              <input type="text" value={draft.whitelistText} placeholder="2330,2317,2454"
                onChange={(e) => setDraft((d) => ({ ...d, whitelistText: e.target.value }))} />
            </label>
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                props.onUpdateConfig({
                  maxPortfolioRiskPct: draft.maxPortfolioRiskPct,
                  maxPositions: draft.maxPositions,
                  minConfidence: draft.minConfidence,
                  decisionIntervalSec: draft.decisionIntervalSec,
                  whitelist: draft.whitelistText.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            >
              儲存設定
            </button>
          </section>
          <section className="panel">
            <h3>決策日誌</h3>
            {recentLogs.length === 0 ? (
              <p>尚無決策紀錄</p>
            ) : (
              <div className="compact-list">
                {recentLogs.map((l, i) => (
                  <div key={i}>
                    {l.time} {l.symbol} {l.action} {(l.conf * 100).toFixed(0)}% {l.pass ? "PASS" : "REJECT"} {l.reason}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
