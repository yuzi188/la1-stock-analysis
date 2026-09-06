"use client";

type RobotState = "running" | "stopped" | "emergency";

export interface GlobalStatusBarProps {
  cash: number;
  equity: number;
  dailyPnlPct: number;
  robotState: RobotState;
  openPositions: number;
  onEmergencyStop: () => void;
  onOpenTrade?: () => void;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(n);
}

export function GlobalStatusBar({
  cash,
  equity,
  dailyPnlPct,
  robotState,
  openPositions,
  onEmergencyStop,
  onOpenTrade,
}: GlobalStatusBarProps) {
  const pnlTone = dailyPnlPct > 0 ? "up" : dailyPnlPct < 0 ? "down" : "neutral";
  const robotLabel =
    robotState === "running" ? "運行中" : robotState === "emergency" ? "緊急停止" : "已停止";
  const robotTone =
    robotState === "running" ? "up" : robotState === "emergency" ? "down" : "neutral";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 16px",
        background: "rgba(8, 14, 22, 0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "#8b98a8" }}>現金</div>
          <strong style={{ color: "#e8eef6" }}>NT$ {formatMoney(cash)}</strong>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8b98a8" }}>權益</div>
          <strong style={{ color: "#e8eef6" }}>NT$ {formatMoney(equity)}</strong>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8b98a8" }}>今日</div>
          <strong style={{ color: pnlTone === "up" ? "#0ecb81" : pnlTone === "down" ? "#f6465d" : "#e8eef6" }}>
            {dailyPnlPct > 0 ? "+" : ""}{dailyPnlPct.toFixed(2)}%
          </strong>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8b98a8" }}>持倉</div>
          <strong style={{ color: "#e8eef6" }}>{openPositions}</strong>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: robotTone === "up" ? "#0ecb81" : robotTone === "down" ? "#f6465d" : "#c5d0dc" }}>
          ● 機器人：{robotLabel}
        </span>
        {onOpenTrade ? (
          <button type="button" onClick={onOpenTrade} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "#d7e0ea", cursor: "pointer" }}>
            交易台
          </button>
        ) : null}
        <button
          type="button"
          onClick={onEmergencyStop}
          disabled={robotState === "emergency"}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(246,70,93,0.35)", background: "rgba(246,70,93,0.15)", color: "#ff7b8a", cursor: "pointer" }}
        >
          緊急停止
        </button>
      </div>
    </div>
  );
}
