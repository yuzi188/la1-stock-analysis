"use client";

/**
 * 全域狀態列 — 建議放在 LA1 主 layout / page 最上方
 * 顯示：現金、權益、今日損益、機器人狀態、緊急停止
 */

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
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(n);
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
    robotState === "running"
      ? "運行中"
      : robotState === "emergency"
        ? "緊急停止"
        : "已停止";
  const robotTone =
    robotState === "running" ? "up" : robotState === "emergency" ? "down" : "neutral";

  return (
    <div className="la1-status-bar">
      <div className="la1-status-left">
        <div className="la1-status-item">
          <span className="label">現金</span>
          <strong>NT$ {formatMoney(cash)}</strong>
        </div>
        <div className="la1-status-item">
          <span className="label">權益</span>
          <strong>NT$ {formatMoney(equity)}</strong>
        </div>
        <div className={`la1-status-item ${pnlTone}`}>
          <span className="label">今日</span>
          <strong>
            {dailyPnlPct > 0 ? "+" : ""}
            {dailyPnlPct.toFixed(2)}%
          </strong>
        </div>
        <div className="la1-status-item">
          <span className="label">持倉</span>
          <strong>{openPositions}</strong>
        </div>
      </div>

      <div className="la1-status-right">
        <div className={`la1-robot-pill ${robotTone}`}>
          <span className="dot" />
          機器人：{robotLabel}
        </div>
        {onOpenTrade && (
          <button type="button" className="la1-btn ghost" onClick={onOpenTrade}>
            交易台
          </button>
        )}
        <button
          type="button"
          className="la1-btn danger"
          onClick={onEmergencyStop}
          disabled={robotState === "emergency"}
        >
          緊急停止
        </button>
      </div>

      <style jsx>{`
        .la1-status-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          background: rgba(8, 14, 22, 0.92);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
        }
        .la1-status-left,
        .la1-status-right {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
        }
        .la1-status-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 72px;
        }
        .la1-status-item .label {
          font-size: 11px;
          color: #8b98a8;
        }
        .la1-status-item strong {
          font-size: 14px;
          color: #e8eef6;
        }
        .la1-status-item.up strong {
          color: #0ecb81;
        }
        .la1-status-item.down strong {
          color: #f6465d;
        }
        .la1-robot-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #c5d0dc;
        }
        .la1-robot-pill .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #848e9c;
        }
        .la1-robot-pill.up {
          color: #0ecb81;
          border-color: rgba(14, 203, 129, 0.35);
        }
        .la1-robot-pill.up .dot {
          background: #0ecb81;
          box-shadow: 0 0 8px rgba(14, 203, 129, 0.6);
        }
        .la1-robot-pill.down {
          color: #f6465d;
          border-color: rgba(246, 70, 93, 0.4);
        }
        .la1-robot-pill.down .dot {
          background: #f6465d;
        }
        .la1-btn {
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .la1-btn.ghost {
          background: rgba(255, 255, 255, 0.06);
          color: #d7e0ea;
        }
        .la1-btn.danger {
          background: rgba(246, 70, 93, 0.15);
          color: #ff7b8a;
          border: 1px solid rgba(246, 70, 93, 0.35);
        }
        .la1-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
