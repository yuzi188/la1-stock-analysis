# Trading Core FIX batch (Level 4 hardening)

## Fixed

1. **PaperBroker.recalcEquity**
   - No longer applies one `lastPrice` to all positions
   - Uses per-symbol `lastMarkPrice` / marks map / avgPrice fallback
   - `updateMarks({ symbol: price })` API added

2. **Risk-based position sizing**
   - `riskBudget = equity × maxPortfolioRiskPct%`
   - `qty = floor(riskBudget / (entry - stop))`
   - Then capped by maxPositionPct, cash, total exposure
   - Returns `finalShares` + `finalSizePct`

3. **dailyPnlPct**
   - Broker tracks `dayStartEquity`
   - `getDailyPnlPct()` is real
   - Hook passes real value into Risk Engine (daily loss circuit breaker works)

## Still not done

- Limit / Stop order execution (types only)
- Full Position Monitor (trailing, time exit)
- Backtest / Walk-forward / Level 6
