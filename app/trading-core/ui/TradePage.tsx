"use client";

/**
 * 交易頁（建議覆蓋原本 alerts 位置）
 * Tab：總覽 | 持倉 | 成交 | 機器人
 */

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

  const pnlTone = props.dailyPnlPct >= 0 ? "up" : "down";

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

  return (
    <div className="trade-page">
      <div className="tabs">
        {(
          [
            ["overview", "總覽"],
            ["positions", "持倉"],
            ["orders", "成交"],
            ["robot", "機器人"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="panel">
          <div className="metrics">
            <div>
              <span>現金</span>
              <strong>NT$ {fmt(props.cash)}</strong>
            </div>
            <div>
              <span>權益</span>
              <strong>NT$ {fmt(props.equity)}</strong>
            </div>
            <div className={pnlTone}>
              <span>今日損益</span>
              <strong>
                {props.dailyPnlPct > 0 ? "+" : ""}
                {props.dailyPnlPct.toFixed(2)}%
              </strong>
            </div>
            <div>
              <span>持倉數</span>
              <strong>{props.positions.length}</strong>
            </div>
          </div>
          <h3>目前持倉（摘要）</h3>
          {props.positions.length === 0 ? (
            <p className="muted">尚無持倉</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>標的</th>
                  <th>股數</th>
                  <th>均價</th>
                  <th>現價</th>
                  <th>損益%</th>
                </tr>
              </thead>
              <tbody>
                {props.positions.map((p) => {
                  const pnlPct =
                    p.avgPrice > 0
                      ? ((p.lastPrice - p.avgPrice) / p.avgPrice) * 100
                      : 0;
                  return (
                    <tr key={p.symbol}>
                      <td>{p.symbol}</td>
                      <td>{fmt(p.quantity)}</td>
                      <td>{fmt(p.avgPrice, 2)}</td>
                      <td>{fmt(p.lastPrice, 2)}</td>
                      <td className={pnlPct >= 0 ? "up" : "down"}>
                        {pnlPct >= 0 ? "+" : ""}
                        {pnlPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "positions" && (
        <section className="panel">
          <h3>持倉明細</h3>
          {props.positions.length === 0 ? (
            <p className="muted">尚無持倉</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>標的</th>
                  <th>股數</th>
                  <th>均價</th>
                  <th>現價</th>
                  <th>停損</th>
                  <th>目標</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {props.positions.map((p) => (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{fmt(p.quantity)}</td>
                    <td>{fmt(p.avgPrice, 2)}</td>
                    <td>{fmt(p.lastPrice, 2)}</td>
                    <td>{p.stopLoss ? fmt(p.stopLoss, 2) : "--"}</td>
                    <td>{p.takeProfit ? fmt(p.takeProfit, 2) : "--"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => props.onClosePosition?.(p.symbol)}
                      >
                        平倉
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "orders" && (
        <section className="panel">
          <h3>最近委託 / 成交</h3>
          {props.orders.length === 0 ? (
            <p className="muted">尚無紀錄</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>時間</th>
                  <th>標的</th>
                  <th>方向</th>
                  <th>數量</th>
                  <th>價格</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {[...props.orders].reverse().slice(0, 50).map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.createdAt).toLocaleTimeString("zh-TW", { hour12: false })}</td>
                    <td>{o.symbol}</td>
                    <td className={o.side === "buy" ? "up" : "down"}>{o.side}</td>
                    <td>{o.quantity}</td>
                    <td>{o.filledPrice ? fmt(o.filledPrice, 2) : "--"}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "robot" && (
        <>
          <section className="panel">
            <div className="robot-head">
              <div>
                <h3>AI 股票機器人</h3>
                <p className="muted">
                  狀態：{props.robotRunning ? "運行中" : "已停止"} · 已跑{" "}
                  {props.robotCycles} 輪
                  {props.lastCycleAt
                    ? ` · 上次 ${new Date(props.lastCycleAt).toLocaleTimeString("zh-TW", { hour12: false })}`
                    : ""}
                </p>
              </div>
              <div className="robot-actions">
                <button type="button" className="btn primary" onClick={props.onStartRobot}>
                  啟動
                </button>
                <button type="button" className="btn ghost" onClick={props.onStopRobot}>
                  暫停
                </button>
                <button type="button" className="btn danger" onClick={props.onEmergencyStop}>
                  緊急停止
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>可設定參數</h3>
            <div className="form-grid">
              <label>
                單筆風險 %
                <input
                  type="number"
                  step="0.1"
                  value={draft.maxPortfolioRiskPct}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      maxPortfolioRiskPct: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                最大持倉數
                <input
                  type="number"
                  value={draft.maxPositions}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, maxPositions: Number(e.target.value) }))
                  }
                />
              </label>
              <label>
                最低信心
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={draft.minConfidence}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, minConfidence: Number(e.target.value) }))
                  }
                />
              </label>
              <label>
                決策間隔（秒）
                <input
                  type="number"
                  value={draft.decisionIntervalSec}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      decisionIntervalSec: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="full">
                白名單（逗號分隔）
                <input
                  type="text"
                  value={draft.whitelistText}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, whitelistText: e.target.value }))
                  }
                  placeholder="2330,2317,2454"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                props.onUpdateConfig({
                  maxPortfolioRiskPct: draft.maxPortfolioRiskPct,
                  maxPositions: draft.maxPositions,
                  minConfidence: draft.minConfidence,
                  decisionIntervalSec: draft.decisionIntervalSec,
                  whitelist: draft.whitelistText
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            >
              儲存設定
            </button>
          </section>

          <section className="panel">
            <h3>決策日誌</h3>
            {recentLogs.length === 0 ? (
              <p className="muted">尚無決策紀錄</p>
            ) : (
              <div className="log">
                {recentLogs.map((l, i) => (
                  <div key={i} className="log-row">
                    <span className="time">{l.time}</span>
                    <span className="sym">{l.symbol}</span>
                    <span className={l.action === "BUY" ? "up" : l.action === "HOLD" ? "" : "down"}>
                      {l.action}
                    </span>
                    <span>{(l.conf * 100).toFixed(0)}%</span>
                    <span className={l.pass ? "up" : "down"}>
                      {l.pass ? "PASS" : "REJECT"}
                    </span>
                    <span className="reason">{l.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        .trade-page {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tabs button {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #9aa8b8;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 13px;
        }
        .tabs button.active {
          color: #f0b90b;
          border-color: rgba(240, 185, 11, 0.35);
          background: rgba(240, 185, 11, 0.08);
        }
        .panel {
          background: rgba(12, 18, 26, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 14px;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .metrics span {
          display: block;
          font-size: 12px;
          color: #8b98a8;
        }
        .metrics strong {
          font-size: 18px;
          color: #e8eef6;
        }
        .metrics .up strong {
          color: #0ecb81;
        }
        .metrics .down strong {
          color: #f6465d;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th,
        td {
          text-align: left;
          padding: 8px 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        th {
          color: #8b98a8;
          font-weight: 500;
        }
        .up {
          color: #0ecb81;
        }
        .down {
          color: #f6465d;
        }
        .muted {
          color: #8b98a8;
          font-size: 13px;
        }
        .robot-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .robot-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn {
          border: none;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn.small {
          padding: 6px 10px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.06);
          color: #d7e0ea;
        }
        .btn.primary {
          background: #0ecb81;
          color: #04140d;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.06);
          color: #d7e0ea;
        }
        .btn.danger {
          background: rgba(246, 70, 93, 0.15);
          color: #ff7b8a;
          border: 1px solid rgba(246, 70, 93, 0.35);
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        .form-grid label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #8b98a8;
        }
        .form-grid label.full {
          grid-column: 1 / -1;
        }
        .form-grid input {
          background: #0b1016;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e8eef6;
          padding: 9px 10px;
        }
        .log {
          max-height: 320px;
          overflow: auto;
          font-family: ui-monospace, monospace;
          font-size: 12px;
        }
        .log-row {
          display: grid;
          grid-template-columns: 70px 60px 60px 50px 60px 1fr;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: #c5d0dc;
        }
        .log-row .reason {
          color: #8b98a8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
