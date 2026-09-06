/**
 * LA1 Analyze → StructuredDecision 適配器
 */

import type {
  StructuredDecision,
  DecisionAction,
  DecisionStance,
  PositionPlan,
} from "../types/decision";

export interface La1AnalysisResult {
  conclusion: string;
  stance: "偏多" | "中性" | "偏保守";
  facts: string[];
  scenarios: { bullish: string; neutral: string; bearish: string };
  risks: string[];
  nextChecks: string[];
  disclaimer: string;
}

export interface La1AnalyzeResponse {
  ok: boolean;
  quote?: {
    symbol: string;
    name?: string;
    price?: number | null;
    change?: number | null;
    changePercent?: number | null;
    source?: string;
    updatedAt?: string | null;
  };
  context?: unknown;
  analysis?: La1AnalysisResult;
  model?: string;
  generatedAt?: string;
  error?: string;
}

function mapStance(stance: La1AnalysisResult["stance"]): DecisionStance {
  if (stance === "偏多") return "bullish";
  if (stance === "偏保守") return "bearish";
  return "neutral";
}

function inferAction(conclusion: string, stance: DecisionStance): DecisionAction {
  const text = conclusion.trim();
  if (/^建議買|^買進|^買入|^做多/i.test(text)) return "BUY";
  if (/^建議賣出|^賣出|^做空|^平倉/i.test(text)) return "SELL";
  if (/^不買|^觀望|^不建議/i.test(text)) return "HOLD";
  if (/^續抱|^持有|^觀察/i.test(text)) return "HOLD";
  if (stance === "bullish") return "BUY";
  if (stance === "bearish") return "SELL";
  return "HOLD";
}

function estimateConfidence(analysis: La1AnalysisResult, action: DecisionAction): number {
  let score = 0.55;
  if (action === "BUY" || action === "SELL") score += 0.1;
  if (analysis.facts.length >= 3) score += 0.05;
  if (analysis.risks.length <= 2) score += 0.05;
  if (/明確|強|突破|確認/.test(analysis.conclusion)) score += 0.08;
  if (/可能|或許|觀察|不確定/.test(analysis.conclusion)) score -= 0.1;
  return Math.max(0.3, Math.min(0.95, score));
}

function buildPlan(
  action: DecisionAction,
  price: number | null | undefined,
  stance: DecisionStance,
): PositionPlan | null {
  if (action !== "BUY" || !price || price <= 0) return null;
  const stopLoss = +(price * 0.97).toFixed(2);
  const takeProfit = +(price * 1.06).toFixed(2);
  const risk = price - stopLoss;
  const reward = takeProfit - price;
  const riskReward = risk > 0 ? +(reward / risk).toFixed(2) : 1.5;
  return {
    entry: price,
    stopLoss,
    takeProfit,
    riskReward,
    sizePct: stance === "bullish" ? 8 : 5,
  };
}

export function toStructuredDecision(
  res: La1AnalyzeResponse,
  symbolFallback?: string,
): StructuredDecision {
  if (!res.ok || !res.analysis) {
    return {
      id: `fallback_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      symbol: symbolFallback ?? res.quote?.symbol ?? "UNKNOWN",
      market: "TW",
      action: "HOLD",
      stance: "neutral",
      confidence: 0.3,
      conclusion: res.error ?? "分析失敗，維持觀望",
      plan: null,
      facts: [],
      risks: ["analyze API 回傳異常"],
      invalidation: [],
      model: res.model ?? "unknown",
      raw: res,
    };
  }

  const analysis = res.analysis;
  const symbol = res.quote?.symbol ?? symbolFallback ?? "UNKNOWN";
  const price = res.quote?.price ?? null;
  const stance = mapStance(analysis.stance);
  const action = inferAction(analysis.conclusion, stance);
  const confidence = estimateConfidence(analysis, action);
  const plan = buildPlan(action, price, stance);
  const invalidation = [
    ...analysis.nextChecks.slice(0, 2),
    ...analysis.risks.slice(0, 2),
  ].filter(Boolean);

  return {
    id: `la1_${Date.now()}_${symbol}`,
    generatedAt: res.generatedAt ?? new Date().toISOString(),
    symbol,
    market: "TW",
    action,
    stance,
    confidence,
    conclusion: analysis.conclusion,
    plan,
    facts: analysis.facts ?? [],
    risks: analysis.risks ?? [],
    invalidation,
    model: res.model ?? "la1-analyze",
    raw: res,
  };
}

export function createLa1AiDecideFn(baseUrl: string) {
  return async (
    symbol: string,
    _context: { quote: { symbol: string; price: number } },
  ): Promise<StructuredDecision> => {
    const url = `${baseUrl.replace(/\/$/, "")}/api/analyze?symbol=${encodeURIComponent(symbol)}`;
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json()) as La1AnalyzeResponse;
    return toStructuredDecision(data, symbol);
  };
}
