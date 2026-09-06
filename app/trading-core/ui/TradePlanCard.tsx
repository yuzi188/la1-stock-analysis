"use client";

import type { StructuredDecision } from "../types/decision";

export interface TradePlanCardProps {
  decision: StructuredDecision | null;
  loading?: boolean;
  onPaperBuy?: () => void;
  onAddToRobot?: () => void;
}

export function TradePlanCard({ decision, loading, onPaperBuy, onAddToRobot }: TradePlanCardProps) {
  if (loading) {
    return (
      <section className="panel">
        <h2>AI 交易計畫</h2>
        <p style={{ color: "#8b98a8" }}>分析中…</p>
      </section>
    );
  }
  if (!decision) {
    return (
      <section className="panel">
        <h2>AI 交易計畫</h2>
        <p style={{ color: "#8b98a8" }}>先執行 AI 分析後，這裡會出現可執行的交易計畫。</p>
      </section>
    );
  }

  const actionColor =
    decision.action === "BUY" ? "#0ecb81" : decision.action === "SELL" || decision.action === "CLOSE" ? "#f6465d" : "#c5d0dc";

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>AI 交易計畫</h2>
        <span style={{ color: actionColor, fontWeight: 700 }}>{decision.action}</span>
      </div>
      <p>{decision.conclusion}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 14 }}>
        <div><small style={{ color: "#8b98a8" }}>信心</small><div><strong>{(decision.confidence * 100).toFixed(0)}%</strong></div></div>
        <div><small style={{ color: "#8b98a8" }}>立場</small><div><strong>{decision.stance === "bullish" ? "偏多" : decision.stance === "bearish" ? "偏空" : "中性"}</strong></div></div>
        {decision.plan ? (
          <>
            <div><small style={{ color: "#8b98a8" }}>進場</small><div><strong>{decision.plan.entry?.toFixed(2) ?? "市價"}</strong></div></div>
            <div><small style={{ color: "#8b98a8" }}>停損</small><div><strong style={{ color: "#f6465d" }}>{decision.plan.stopLoss.toFixed(2)}</strong></div></div>
            <div><small style={{ color: "#8b98a8" }}>目標</small><div><strong style={{ color: "#0ecb81" }}>{decision.plan.takeProfit.toFixed(2)}</strong></div></div>
            <div><small style={{ color: "#8b98a8" }}>R:R</small><div><strong>{decision.plan.riskReward.toFixed(2)}</strong></div></div>
            <div><small style={{ color: "#8b98a8" }}>建議倉位</small><div><strong>{decision.plan.sizePct}%</strong></div></div>
          </>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="primary-button" disabled={decision.action !== "BUY"} onClick={onPaperBuy}>
          一鍵模擬買入
        </button>
        <button type="button" onClick={onAddToRobot}>
          加入機器人觀察
        </button>
      </div>
    </section>
  );
}
