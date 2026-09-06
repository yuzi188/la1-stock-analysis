"use client";

/**
 * 個股頁 / 智能頁用的「AI 交易計畫」卡片
 * 接 StructuredDecision，提供一鍵模擬買入
 */

import type { StructuredDecision } from "../types/decision";

export interface TradePlanCardProps {
  decision: StructuredDecision | null;
  loading?: boolean;
  onPaperBuy?: () => void;
  onAddToRobot?: () => void;
}

export function TradePlanCard({
  decision,
  loading,
  onPaperBuy,
  onAddToRobot,
}: TradePlanCardProps) {
  if (loading) {
    return (
      <section className="panel trade-plan">
        <div className="panel-head">
          <h2>AI 交易計畫</h2>
        </div>
        <p className="muted">分析中…</p>
      </section>
    );
  }

  if (!decision) {
    return (
      <section className="panel trade-plan">
        <div className="panel-head">
          <h2>AI 交易計畫</h2>
        </div>
        <p className="muted">先執行 AI 分析後，這裡會出現可執行的交易計畫。</p>
      </section>
    );
  }

  const actionTone =
    decision.action === "BUY"
      ? "up"
      : decision.action === "SELL" || decision.action === "CLOSE"
        ? "down"
        : "neutral";

  return (
    <section className="panel trade-plan">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Structured Decision</span>
          <h2>AI 交易計畫</h2>
        </div>
        <span className={`badge ${actionTone}`}>{decision.action}</span>
      </div>

      <p className="conclusion">{decision.conclusion}</p>

      <div className="grid">
        <div>
          <span className="label">信心</span>
          <strong>{(decision.confidence * 100).toFixed(0)}%</strong>
        </div>
        <div>
          <span className="label">立場</span>
          <strong>
            {decision.stance === "bullish"
              ? "偏多"
              : decision.stance === "bearish"
                ? "偏空"
                : "中性"}
          </strong>
        </div>
        {decision.plan && (
          <>
            <div>
              <span className="label">進場</span>
              <strong>{decision.plan.entry?.toFixed(2) ?? "市價"}</strong>
            </div>
            <div>
              <span className="label">停損</span>
              <strong className="down">{decision.plan.stopLoss.toFixed(2)}</strong>
            </div>
            <div>
              <span className="label">目標</span>
              <strong className="up">{decision.plan.takeProfit.toFixed(2)}</strong>
            </div>
            <div>
              <span className="label">R:R</span>
              <strong>{decision.plan.riskReward.toFixed(2)}</strong>
            </div>
            <div>
              <span className="label">建議倉位</span>
              <strong>{decision.plan.sizePct}%</strong>
            </div>
          </>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn primary"
          disabled={decision.action !== "BUY"}
          onClick={onPaperBuy}
        >
          一鍵模擬買入
        </button>
        <button type="button" className="btn ghost" onClick={onAddToRobot}>
          加入機器人觀察
        </button>
      </div>

      <style jsx>{`
        .trade-plan .eyebrow {
          font-size: 11px;
          color: #8b98a8;
        }
        .trade-plan .badge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .trade-plan .badge.up {
          color: #0ecb81;
          border-color: rgba(14, 203, 129, 0.35);
        }
        .trade-plan .badge.down {
          color: #f6465d;
          border-color: rgba(246, 70, 93, 0.35);
        }
        .conclusion {
          margin: 8px 0 14px;
          color: #d7e0ea;
          line-height: 1.5;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .grid .label {
          display: block;
          font-size: 11px;
          color: #8b98a8;
          margin-bottom: 2px;
        }
        .grid strong {
          font-size: 15px;
          color: #e8eef6;
        }
        .grid .up {
          color: #0ecb81;
        }
        .grid .down {
          color: #f6465d;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .btn {
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn.primary {
          background: #0ecb81;
          color: #04140d;
        }
        .btn.primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.06);
          color: #d7e0ea;
        }
        .muted {
          color: #8b98a8;
          font-size: 13px;
        }
      `}</style>
    </section>
  );
}
