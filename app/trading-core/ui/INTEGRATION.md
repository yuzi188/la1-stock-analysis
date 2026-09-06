# LA1 前端整合指南（最小改動）

把交易模擬器 + 股票機器人融進現有 `app/page.tsx`。

## 1. 複製模組

把整個 `la1-trading-core` 放到例如：

```
app/trading-core/
```

或 `lib/trading-core/`。

## 2. 修改 PageKey

原本：

```ts
type PageKey = "overview" | "market" | "quote" | "watchlist" | "ai" | "alerts" | "settings";
```

改成：

```ts
type PageKey = "overview" | "market" | "quote" | "watchlist" | "ai" | "trade" | "settings";
```

`pages` 陣列把 alerts 換成：

```ts
{ key: "trade", label: "交易", hint: "模擬與機器人" },
```

## 3. 頂部加 GlobalStatusBar

在主 return 最上方加入：

```tsx
import { GlobalStatusBar } from "./trading-core/ui/GlobalStatusBar";

<GlobalStatusBar
  cash={paperCash}
  equity={paperEquity}
  dailyPnlPct={dailyPnlPct}
  robotState={robotState}
  openPositions={positions.length}
  onEmergencyStop={() => robot.updateConfig({ emergencyStop: true })}
  onOpenTrade={() => setPage("trade")}
/>
```

## 4. 個股 / 智能頁加 TradePlanCard

在 AI 分析結果下方：

```tsx
import { TradePlanCard } from "./trading-core/ui/TradePlanCard";
import { toStructuredDecision } from "./trading-core/adapters/la1-analyze-adapter";

// analyze 成功後
const decision = toStructuredDecision(analyzeResponse);

<TradePlanCard
  decision={decision}
  onPaperBuy={() => /* 呼叫 paper broker */}
  onAddToRobot={() => /* 把 symbol 加進 whitelist */}
/>
```

## 5. 交易頁覆蓋原 alerts

```tsx
import { TradePage } from "./trading-core/ui/TradePage";

{page === "trade" && (
  <TradePage
    cash={...}
    equity={...}
    dailyPnlPct={...}
    positions={...}
    orders={...}
    snapshots={robot.getSnapshots()}
    config={robot.getConfig()}
    robotRunning={status.running}
    robotCycles={status.cycles}
    lastCycleAt={status.lastCycleAt}
    onStartRobot={() => robot.start()}
    onStopRobot={() => robot.stop()}
    onEmergencyStop={() => robot.updateConfig({ emergencyStop: true })}
    onUpdateConfig={(p) => robot.updateConfig(p)}
  />
)}
```

## 6. 建議刪減

- 移除或降級獨立 `alerts` 頁（功能併入交易/機器人）
- overview 次要卡片可預設摺疊，把視覺重心留給狀態列與交易入口

## 完成後效果

- 原分析能力完整保留
- 新增「交易」主分頁
- 個股頁可一鍵模擬下單
- 機器人可設定、可緊急停止、有決策日誌
EOF

# update main README
cat >> /home/workdir/artifacts/la1-trading-core/README.md << 'EOF'

## UI 元件（已完成）

| 檔案 | 說明 |
|------|------|
| `ui/GlobalStatusBar.tsx` | 全域資金 + 機器人狀態 + 緊急停止 |
| `ui/TradePlanCard.tsx` | 個股/智能頁的 AI 交易計畫卡 |
| `ui/TradePage.tsx` | 交易主頁（總覽/持倉/成交/機器人） |
| `ui/INTEGRATION.md` | 如何最小改動貼進 LA1 page.tsx |

EOF

find /home/workdir/artifacts/la1-trading-core -type f | sort
뽠description