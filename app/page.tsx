"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  volume: number | null;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  updatedAt: string | null;
  source: string;
};

type Analysis = {
  conclusion: string;
  stance: string;
  facts: string[];
  scenarios: {
    bullish: string;
    neutral: string;
    bearish: string;
  };
  risks: string[];
  nextChecks: string[];
  disclaimer: string;
};

type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
};

type TechnicalContext = {
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  latestClose: number | null;
  latestDate: string | null;
  pattern: string;
  candles: Candle[];
  source: string;
};

type RevenueContext = {
  available: boolean;
  companyName: string | null;
  dataMonth: string | null;
  monthlyRevenue: number | null;
  momChangePercent: number | null;
  yoyChangePercent: number | null;
  cumulativeRevenue: number | null;
  cumulativeYoyChangePercent: number | null;
  source: string;
  note?: string;
};

type MarketContext = {
  quote: Quote;
  technical: TechnicalContext;
  revenue: RevenueContext;
  institutional: {
    available: boolean;
    source: string;
    note: string;
  };
  news: {
    title: string;
    url: string;
    date: string;
    source: string;
  }[];
  generatedAt: string;
};

type MarketIndexContext = {
  name: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  date: string | null;
  source: string;
};

type MarketBreadthContext = {
  up: number;
  down: number;
  flat: number;
  total: number;
  score: number;
  source: string;
};

type InstitutionalFlowContext = {
  foreign: number | null;
  investmentTrust: number | null;
  dealer: number | null;
  total: number | null;
  date: string | null;
  source: string;
};

type RankingItem = {
  symbol: string;
  name: string;
  market: "TWSE" | "TPEx";
  close: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
};

type MacroFactorContext = {
  name: string;
  value: number | null;
  unit: string;
  period: string | null;
  source: string;
};

type IndustryRotationContext = {
  name: string;
  symbols: string[];
  averageChangePercent: number | null;
  upCount: number;
  downCount: number;
  totalMatched: number;
  score: number;
  leaders: RankingItem[];
  source: string;
};

type OfficialMarketSummary = {
  indices: {
    twse: MarketIndexContext;
    tpex: MarketIndexContext;
  };
  globalMarkets: MarketIndexContext[];
  macroFactors: MacroFactorContext[];
  breadth: MarketBreadthContext;
  institutional: InstitutionalFlowContext;
  rankings: {
    gainers: RankingItem[];
    losers: RankingItem[];
    volume: RankingItem[];
  };
  industryRotation: IndustryRotationContext[];
  generatedAt: string;
};

type GeopoliticalEvent = {
  id: string;
  title: string;
  url: string;
  domain: string;
  sourceCountry: string;
  publishedAt: string | null;
  tone: number | null;
  severity: "high" | "medium" | "low";
  theme: string;
  marketImpact: string;
  source: string;
};

type GeopoliticalHotspot = {
  name: string;
  count: number;
  severity: "high" | "medium" | "low";
};

type GeopoliticalSituation = {
  riskScore: number;
  stance: string;
  events: GeopoliticalEvent[];
  hotspots: GeopoliticalHotspot[];
  worldMonitor: {
    configured: boolean;
    status: "ready" | "needs_key";
    dashboardUrl: string;
    repositoryUrl: string;
    apiBaseUrl: string;
    mcpUrl: string;
    note: string;
  };
  generatedAt: string;
  source: string;
};

type ContextResponse =
  | { ok: true; context: MarketContext }
  | { ok: false; error: string; code?: string };

type AnalyzeResponse =
  | {
      ok: true;
      quote: Quote;
      context: MarketContext;
      analysis: Analysis;
      model: string;
      generatedAt: string;
    }
  | { ok: false; error: string; code?: string };

type MarketSummaryResponse =
  | { ok: true; summary: OfficialMarketSummary }
  | { ok: false; error: string; code?: string };

type GeopoliticsResponse =
  | { ok: true; situation: GeopoliticalSituation }
  | { ok: false; error: string; code?: string };

type PageKey =
  | "overview"
  | "morning"
  | "review"
  | "pulse"
  | "indices"
  | "breadth"
  | "sectors"
  | "themes"
  | "compare"
  | "institutions"
  | "global"
  | "data"
  | "ai"
  | "risk"
  | "notifications"
  | "notes"
  | "news"
  | "watchlist"
  | "settings";

type WatchItem = {
  symbol: string;
  name: string;
  theme: string;
};

type TradeSignal = {
  label: string;
  zone: string;
  tone: "up" | "down" | "neutral" | "warn";
  description: string;
  checks: string[];
};

type MarketRegime = {
  label: string;
  score: number;
  tone: "up" | "down" | "neutral" | "warn";
  posture: string;
  rule: string;
  confidence: string;
  checks: string[];
};

type AlertSettings = {
  upPercent: number;
  downPercent: number;
  riskScore: number;
  breakoutBuffer: number;
  supportBuffer: number;
};

type InvestmentNote = {
  id: string;
  symbol: string;
  title: string;
  thesis: string;
  stop: string;
  target: string;
  createdAt: string;
};

const defaultAlertSettings: AlertSettings = {
  upPercent: 3,
  downPercent: 3,
  riskScore: 65,
  breakoutBuffer: 0.5,
  supportBuffer: 1,
};

const pages: { key: PageKey; label: string; description: string }[] = [
  { key: "overview", label: "總覽首頁", description: "核心市場狀態、單股報價與快速同步。" },
  { key: "morning", label: "開盤摘要", description: "盤前市場方向、國際影響與今日觀察清單。" },
  { key: "review", label: "收盤復盤", description: "今日警報、強弱股與明日檢查重點。" },
  { key: "pulse", label: "市場脈動", description: "情緒分數、趨勢走勢與盤勢節奏。" },
  { key: "indices", label: "指數走勢", description: "加權、櫃買與後續國際指數監控。" },
  { key: "breadth", label: "市場廣度", description: "上漲下跌家數、廣度分數與待接全市場統計。" },
  { key: "sectors", label: "產業輪動", description: "AI、半導體、航太與供應鏈族群雷達。" },
  { key: "themes", label: "主題雷達", description: "AI、半導體、散熱、航太與電力題材強弱。" },
  { key: "compare", label: "股票比較", description: "自選股技術、漲跌、警報與風險快速比較。" },
  { key: "institutions", label: "法人動向", description: "外資、投信、自營商買賣超與授權缺口。" },
  { key: "global", label: "國際市場", description: "美股、匯率、VIX 與宏觀經濟數據。" },
  { key: "data", label: "鏈接數據", description: "Fugle、TWSE、OpenAI 與資料健康狀態。" },
  { key: "ai", label: "AI 分析中心", description: "條件式研究摘要、風險提醒與情境推演。" },
  { key: "risk", label: "風險監控", description: "風險溫度、資料缺口與警示狀態。" },
  { key: "notifications", label: "通知中心", description: "警報、異動與待處理事項集中管理。" },
  { key: "notes", label: "投資筆記", description: "記錄進場理由、停損、目標與復盤。" },
  { key: "news", label: "新聞快訊", description: "TWSE 新聞與市場事件清單。" },
  { key: "watchlist", label: "自選股監控", description: "AI 供應鏈與關注名單快速查詢。" },
  { key: "settings", label: "設定", description: "資料源、環境變數與產品護欄。" },
];

const navOrder: PageKey[] = [
  "overview",
  "watchlist",
  "notes",
  "morning",
  "review",
  "pulse",
  "indices",
  "breadth",
  "sectors",
  "themes",
  "compare",
  "institutions",
  "global",
  "data",
  "ai",
  "risk",
  "notifications",
  "news",
  "settings",
];

const navigationPages = navOrder
  .map((key) => pages.find((page) => page.key === key))
  .filter((page): page is (typeof pages)[number] => Boolean(page));

const watchlist: WatchItem[] = [
  { symbol: "2330", name: "台積電", theme: "晶圓代工 / AI 算力" },
  { symbol: "2317", name: "鴻海", theme: "AI 伺服器 / 電動車" },
  { symbol: "2382", name: "廣達", theme: "AI 伺服器 ODM" },
  { symbol: "3231", name: "緯創", theme: "AI 伺服器供應鏈" },
  { symbol: "3661", name: "世芯-KY", theme: "ASIC / 高速運算" },
  { symbol: "6446", name: "藥華藥", theme: "生技高價股觀察" },
];

const watchlistStorageKey = "la1-saved-watchlist";

function normalizeWatchItems(value: unknown): WatchItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Partial<WatchItem>;
      const symbol = typeof record.symbol === "string" ? record.symbol.replace(/\D/g, "").slice(0, 6) : "";
      if (!symbol) return null;
      return {
        symbol,
        name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : "待同步公司名稱",
        theme: typeof record.theme === "string" && record.theme.trim() ? record.theme.trim() : "自選股",
      };
    })
    .filter((item): item is WatchItem => Boolean(item));
}

function loadStoredWatchlist() {
  if (typeof window === "undefined") return watchlist;

  try {
    const stored = window.localStorage.getItem(watchlistStorageKey);
    if (stored === null) return watchlist;
    return normalizeWatchItems(JSON.parse(stored));
  } catch {
    window.localStorage.removeItem(watchlistStorageKey);
    return watchlist;
  }
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  }).format(value);
}

function formatVolume(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return `${new Intl.NumberFormat("zh-TW").format(value)} 張`;
}

function formatSharesAsLots(value: number | null | undefined) {
  if (value === null || value === undefined) return "--";
  return `${new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value / 1000)} 張`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${formatNumber(value)}%`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "尚未取得";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sentimentScore(quote: Quote | null) {
  const changePercent = quote?.changePercent ?? 0;
  return Math.round(clamp(50 + changePercent * 3, 0, 100));
}

function riskScore(quote: Quote | null, context: MarketContext | null) {
  const volatility =
    quote?.highPrice && quote.lowPrice && quote.price
      ? ((quote.highPrice - quote.lowPrice) / quote.price) * 100
      : 0;
  const belowMa20 =
    quote?.price && context?.technical.ma20 ? quote.price < context.technical.ma20 : false;
  return Math.round(clamp(35 + volatility * 5 + (belowMa20 ? 16 : 0), 0, 100));
}

function averageNumbers(values: (number | null | undefined)[]) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function buildMarketRegime(
  marketSummary: OfficialMarketSummary | null,
  geopolitics: GeopoliticalSituation | null,
  fallbackScore: number,
): MarketRegime {
  const breadthScore = marketSummary?.breadth.score ?? fallbackScore;
  const institutionalTotal = marketSummary?.institutional.total ?? 0;
  const institutionScore = marketSummary?.institutional.total === null || marketSummary?.institutional.total === undefined
    ? 50
    : clamp(50 + institutionalTotal / 250000, 15, 85);
  const globalChange = averageNumbers(marketSummary?.globalMarkets.map((market) => market.changePercent) ?? []);
  const vix = marketSummary?.globalMarkets.find((market) => market.name.toUpperCase().includes("VIX"))?.value ?? null;
  const globalScore = clamp(52 + (globalChange ?? 0) * 8 - (vix && vix > 20 ? (vix - 20) * 1.4 : 0), 15, 85);
  const geopoliticalRisk = geopolitics?.riskScore ?? 45;
  const riskAdjustment = geopoliticalRisk >= 70 ? -10 : geopoliticalRisk >= 55 ? -5 : geopoliticalRisk <= 35 ? 4 : 0;
  const score = Math.round(clamp(breadthScore * 0.42 + institutionScore * 0.26 + globalScore * 0.2 + (50 + riskAdjustment) * 0.12, 0, 100));

  if (score >= 65) {
    return {
      label: "主升盤",
      score,
      tone: "up",
      posture: "資金與廣度支持，允許主動承擔風險。",
      rule: "優先找強勢產業與站上 20/60 日線的個股。",
      confidence: "高",
      checks: ["大盤廣度維持 60 以上", "法人合計不轉賣超", "個股收盤守住 20 日線"],
    };
  }

  if (score >= 55) {
    return {
      label: "可承擔風險",
      score,
      tone: "up",
      posture: "盤面可做，但需要分批與停損紀律。",
      rule: "只買趨勢確認標的，不追短線過熱。",
      confidence: "中高",
      checks: ["回測不破 20 日線", "類股同步轉強", "國際風險未升高"],
    };
  }

  if (score >= 45) {
    return {
      label: "震盪控碼",
      score,
      tone: "neutral",
      posture: "盤面沒有全面優勢，先控部位。",
      rule: "不急買，只做突破確認或低風險回測。",
      confidence: "中",
      checks: ["等待量縮止跌", "確認大盤重新站穩", "降低單筆部位"],
    };
  }

  return {
    label: "防守盤",
    score,
    tone: "warn",
    posture: "大盤風險大於機會，先保留現金。",
    rule: "不開新倉，弱勢股反彈先賣或避開。",
    confidence: "中高",
    checks: ["跌破均線要降碼", "避開弱勢族群", "等大盤廣度回升"],
  };
}

function buildInstitutionalTradePlan(
  quote: Quote | null,
  context: MarketContext | null,
  technicalScore: number,
  currentRisk: number,
  regime: MarketRegime,
): TradeSignal {
  if (!quote || !context) {
    return {
      label: "等待資料",
      zone: "先查詢個股",
      tone: "neutral",
      description: "先同步即時報價、K 線與大盤制度，再輸出買、不買或賣出的明確決策。",
      checks: ["輸入股票代碼", "同步即時資料", "再產生 AI 分析"],
    };
  }

  const price = quote.price ?? context.technical.latestClose;
  const ma20 = context.technical.ma20;
  const ma60 = context.technical.ma60;
  const changePercent = quote.changePercent ?? 0;
  const aboveMa20 = Boolean(price && ma20 && price >= ma20);
  const aboveMa60 = Boolean(price && ma60 && price >= ma60);

  if (regime.score < 45) {
    return {
      label: "防守決策",
      zone: "不買 / 弱勢先賣",
      tone: "warn",
      description: `${regime.label}下，先以大盤風險控管為主；沒有必要逆勢開新倉。`,
      checks: regime.checks,
    };
  }

  if (currentRisk >= 70 || changePercent >= 6) {
    return {
      label: "風險決策",
      zone: "不追高",
      tone: "warn",
      description: "短線波動或漲幅已偏高，機構邏輯會等回測確認，不用追價承擔不對稱風險。",
      checks: ["回測 5/20 日線是否有承接", "成交量是否失控放大", "先規劃停利或降碼"],
    };
  }

  if (regime.score >= 55 && technicalScore >= 60 && aboveMa20 && (aboveMa60 || !ma60) && changePercent >= 0) {
    return {
      label: "進攻決策",
      zone: "建議分批買",
      tone: "up",
      description: `${regime.label}配合個股站上主要均線，屬於可承擔風險的進場條件；用分批買與停損控制錯判。`,
      checks: ["收盤守住 20 日線", "隔日量價不背離", "大盤制度不跌破 55"],
    };
  }

  if (!aboveMa20 || technicalScore < 45 || changePercent < -3) {
    return {
      label: "退場決策",
      zone: "建議賣出 / 避開",
      tone: "down",
      description: "個股弱於主要均線或動能不足，未符合機構型進場條件；已有部位先降碼，未持有不買。",
      checks: ["重新站回 20 日線再評估", "確認是否跌破前低", "等待大盤與族群同步轉強"],
    };
  }

  return {
    label: "等待決策",
    zone: "不買，等確認",
    tone: "neutral",
    description: "大盤與個股條件尚未形成高勝率組合；先等待突破、回測或法人/產業資料確認。",
    checks: ["突破壓力且收盤站穩", "回測支撐不破", "技術分數提升到 60 以上"],
  };
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "up" | "down" | "neutral" | "warn";
}) {
  return <span className={`status-chip ${tone}`}>{children}</span>;
}

function PageTitle({ page }: { page: (typeof pages)[number] }) {
  return (
    <section className="page-title">
      <span>LA1 Stock Lab</span>
      <h1>{page.label}</h1>
      <p>{page.description}</p>
    </section>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const angle = -120 + (clamp(value, 0, 100) / 100) * 240;

  return (
    <div className="gauge" aria-label={`${label} ${value} 分`}>
      <svg viewBox="0 0 180 118" role="img">
        <path className="gauge-track" d="M25 95 A65 65 0 0 1 155 95" />
        <path className="gauge-warm" d="M25 95 A65 65 0 0 1 64 37" />
        <path className="gauge-good" d="M64 37 A65 65 0 0 1 116 37" />
        <path className="gauge-cool" d="M116 37 A65 65 0 0 1 155 95" />
        <line
          className="gauge-needle"
          x1="90"
          x2="90"
          y1="92"
          y2="42"
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: "90px 92px" }}
        />
        <circle className="gauge-pin" cx="90" cy="92" r="4" />
      </svg>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Donut({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;

  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" role="img" aria-label={`${label} ${value} 分`}>
        <circle className="donut-track" cx="60" cy="60" r={radius} />
        <circle
          className="donut-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MiniTrend({ candles }: { candles: Candle[] }) {
  const ordered = [...candles].reverse();
  if (ordered.length < 2) return <div className="empty-mini">待接走勢資料</div>;

  const width = 520;
  const height = 170;
  const values = ordered.map((item) => item.close);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = ordered
    .map((item, index) => {
      const x = (index / Math.max(ordered.length - 1, 1)) * width;
      const y = height - ((item.close - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="mini-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="市場趨勢走勢">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 94, 108, .28)" />
          <stop offset="100%" stopColor="rgba(255, 94, 108, 0)" />
        </linearGradient>
      </defs>
      <polyline className="trend-line" points={points} />
      <polygon className="trend-fill" points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

function KLineChart({ candles }: { candles: Candle[] }) {
  const ordered = [...candles].reverse();
  if (ordered.length < 2) {
    return (
      <div className="k-chart-wrap">
        <div className="empty-chart">K 線資料不足</div>
        <div className="ma-legend">
          <span className="ma5">MA5</span>
          <span className="ma20">MA20</span>
          <span className="ma60">MA60 待更多日線</span>
        </div>
      </div>
    );
  }

  const width = 680;
  const height = 260;
  const padding = { top: 16, right: 52, bottom: 30, left: 14 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const highs = ordered.map((candle) => candle.high);
  const lows = ordered.map((candle) => candle.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = Math.max(max - min, 1);
  const step = chartWidth / Math.max(ordered.length - 1, 1);
  const bodyWidth = Math.max(6, Math.min(16, step * 0.52));
  const ticks = [max, min + range * 0.66, min + range * 0.33, min];
  const y = (price: number) => padding.top + ((max - price) / range) * chartHeight;
  const movingAveragePoints = (period: number) =>
    ordered
      .map((_, index) => {
        const slice = ordered.slice(index - period + 1, index + 1);
        if (slice.length < period) return null;
        const average = slice.reduce((sum, candle) => sum + candle.close, 0) / period;
        const x = padding.left + index * step;
        return `${x.toFixed(1)},${y(average).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  const ma5Points = movingAveragePoints(5);
  const ma20Points = movingAveragePoints(20);
  const ma60Points = movingAveragePoints(60);

  return (
    <div className="k-chart-wrap">
      <svg className="k-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="近 20 日 K 線圖與均線">
        <rect className="chart-bg" height={height} rx="8" width={width} />
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="chart-grid" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} />
            <text className="chart-label" x={width - padding.right + 8} y={y(tick) + 4}>
              {formatNumber(tick, 0)}
            </text>
          </g>
        ))}
        {ordered.map((candle, index) => {
          const x = padding.left + index * step;
          const up = candle.close >= candle.open;
          const top = y(Math.max(candle.open, candle.close));
          const bottom = y(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(bottom - top, 2);

          return (
            <g className={up ? "candle up" : "candle down"} key={candle.date}>
              <title>{`${candle.date} 開 ${candle.open} 高 ${candle.high} 低 ${candle.low} 收 ${candle.close}`}</title>
              <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} />
              <rect height={bodyHeight} rx="2" width={bodyWidth} x={x - bodyWidth / 2} y={top} />
            </g>
          );
        })}
        {ma5Points ? <polyline className="ma-line ma5" points={ma5Points} /> : null}
        {ma20Points ? <polyline className="ma-line ma20" points={ma20Points} /> : null}
        {ma60Points ? <polyline className="ma-line ma60" points={ma60Points} /> : null}
      </svg>
      <div className="ma-legend">
        <span className="ma5">MA5</span>
        <span className="ma20">MA20</span>
        <span className="ma60">{ma60Points ? "MA60" : "MA60 待更多日線"}</span>
      </div>
    </div>
  );
}

function Panel({
  className = "",
  eyebrow,
  title,
  status,
  statusTone,
  children,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  status?: string;
  statusTone?: "up" | "down" | "neutral" | "warn";
  children: ReactNode;
}) {
  return (
    <article className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {status ? <StatusPill tone={statusTone}>{status}</StatusPill> : null}
      </div>
      {children}
    </article>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [symbol, setSymbol] = useState("2330");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [context, setContext] = useState<MarketContext | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<{ model: string; generatedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [savedWatchlist, setSavedWatchlist] = useState<WatchItem[]>(loadStoredWatchlist);
  const [customWatchSymbol, setCustomWatchSymbol] = useState("");
  const [watchQuotes, setWatchQuotes] = useState<Record<string, Quote>>({});
  const [watchQuoteStatus, setWatchQuoteStatus] = useState("自動更新");
  const [marketSummary, setMarketSummary] = useState<OfficialMarketSummary | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [geopolitics, setGeopolitics] = useState<GeopoliticalSituation | null>(null);
  const [geopoliticsLoading, setGeopoliticsLoading] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(() => {
    if (typeof window === "undefined") return defaultAlertSettings;
    try {
      const stored = window.localStorage.getItem("la1-alert-settings");
      if (!stored) return defaultAlertSettings;
      return {
        ...defaultAlertSettings,
        ...(JSON.parse(stored) as Partial<AlertSettings>),
      };
    } catch {
      window.localStorage.removeItem("la1-alert-settings");
      return defaultAlertSettings;
    }
  });
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("la1-read-notifications");
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      window.localStorage.removeItem("la1-read-notifications");
      return [];
    }
  });
  const [investmentNotes, setInvestmentNotes] = useState<InvestmentNote[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("la1-investment-notes");
      return stored ? (JSON.parse(stored) as InvestmentNote[]) : [];
    } catch {
      window.localStorage.removeItem("la1-investment-notes");
      return [];
    }
  });
  const [noteDraft, setNoteDraft] = useState({
    symbol: "2330",
    title: "",
    thesis: "",
    stop: "",
    target: "",
  });
  const [cloudUserId, setCloudUserId] = useState(() => {
    if (typeof window === "undefined") return "demo-user";
    const existing = window.localStorage.getItem("la1-user-id");
    if (existing) return existing;
    const created = `la1-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    window.localStorage.setItem("la1-user-id", created);
    return created;
  });
  const [isSignedIn, setIsSignedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("la1-auth-user") === "1";
  });
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authPhone, setAuthPhone] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("la1-auth-phone") ?? "";
  });
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [cloudProfile, setCloudProfile] = useState({ email: "", name: "LA1 用戶" });
  const [cloudStatus, setCloudStatus] = useState("尚未同步");
  const [zoomedCard, setZoomedCard] = useState<{ title: string; markup: string; sourceClass: string } | null>(null);

  const score = sentimentScore(quote);
  const marketScore = marketSummary?.breadth.score ?? score;
  const risk = riskScore(quote, context);
  const marketRegime = buildMarketRegime(marketSummary, geopolitics, marketScore);
  const activePageMeta = pages.find((page) => page.key === activePage) ?? pages[0];
  const openZoomedCard = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const blockedSelector = "button, input, textarea, select, option, a, label, form, [role='button'], [data-no-card-zoom='true']";
    if (target.closest(blockedSelector)) return;

    const card = target.closest(".panel, .metric-card, .note-card");
    if (!(card instanceof HTMLElement) || !event.currentTarget.contains(card)) return;

    const title = card.querySelector("h2, strong")?.textContent?.trim() || "\u5361\u7247\u653e\u5927\u6aa2\u8996";
    setZoomedCard({
      title,
      markup: card.innerHTML,
      sourceClass: card.className,
    });
  }, []);

  useEffect(() => {
    if (!zoomedCard) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setZoomedCard(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomedCard]);
  const tone = useMemo(() => {
    if (!quote?.changePercent) return "flat";
    return quote.changePercent > 0 ? "up" : "down";
  }, [quote]);
  const currentPrice = quote?.price ?? context?.technical.latestClose ?? null;
  const technicalScore = context
    ? Math.round(
        clamp(
          42 +
            (currentPrice && context.technical.ma5 && currentPrice >= context.technical.ma5 ? 14 : 0) +
            (currentPrice && context.technical.ma20 && currentPrice >= context.technical.ma20 ? 18 : -8) +
            (currentPrice && context.technical.ma60 && currentPrice >= context.technical.ma60 ? 12 : 0) +
            (quote?.changePercent ?? 0) * 2,
          0,
          100,
        ),
      )
    : 0;
  const chipScore = !quote || marketSummary?.institutional.total === null || marketSummary?.institutional.total === undefined
    ? 0
    : Math.round(clamp(50 + marketSummary.institutional.total / 400000, 0, 100));
  const fundamentalScore = context?.revenue.available
    ? Math.round(clamp(55 + (context.revenue.yoyChangePercent ?? 0) / 2 + (context.revenue.momChangePercent ?? 0) / 3, 0, 100))
    : 0;
  const newsScore = context?.news.length ? 68 : 0;
  const supportCandidates = [
    context?.technical.ma5,
    context?.technical.ma20,
    context?.technical.ma60,
    quote?.lowPrice,
  ].filter((value): value is number => typeof value === "number" && value > 0 && (!currentPrice || value <= currentPrice * 1.01));
  const supportPrice = supportCandidates.length ? Math.max(...supportCandidates) : context?.technical.ma20 ?? quote?.lowPrice ?? null;
  const resistancePrice = quote?.highPrice && currentPrice
    ? Math.max(quote.highPrice, currentPrice * 1.04)
    : currentPrice
      ? currentPrice * 1.05
      : null;
  const stopPrice = supportPrice ? supportPrice * 0.97 : context?.technical.ma60 ?? null;
  const signal = buildInstitutionalTradePlan(quote, context, technicalScore, risk, marketRegime);
  const targetBreadthScore = quote
    ? Math.round(clamp(technicalScore * 0.45 + marketRegime.score * 0.35 + score * 0.2 - Math.max(0, risk - 55) * 0.25, 0, 100))
    : marketScore;
  const targetBreadthLabel = targetBreadthScore >= 62
    ? "標的強於盤"
    : targetBreadthScore <= 42
      ? "標的弱於盤"
      : "標的中性";
  const decisionStatus = !quote
    ? "先輸入"
    : signal.tone === "up"
      ? "建議分批買"
      : signal.tone === "warn"
        ? "不買 / 降低持股"
        : signal.tone === "down"
          ? "建議賣出 / 避開"
          : "不買，等確認";
  const decisionChecks = analysis?.nextChecks?.length ? analysis.nextChecks.slice(0, 3) : signal.checks;
  const alertRules = [
    {
      label: "上漲警報",
      trigger: `漲幅 >= ${alertSettings.upPercent}%`,
      value: quote ? formatPercent(quote.changePercent) : "--",
      active: Boolean(quote && (quote.changePercent ?? 0) >= alertSettings.upPercent),
      tone: "up" as const,
      note: "短線急漲，檢查量能與是否追高。",
    },
    {
      label: "下跌警報",
      trigger: `跌幅 <= -${alertSettings.downPercent}%`,
      value: quote ? formatPercent(quote.changePercent) : "--",
      active: Boolean(quote && (quote.changePercent ?? 0) <= -alertSettings.downPercent),
      tone: "down" as const,
      note: "短線轉弱，檢查停損與支撐是否失守。",
    },
    {
      label: "突破警報",
      trigger: `距離日高 <= ${alertSettings.breakoutBuffer}%`,
      value: formatNumber(quote?.highPrice),
      active: Boolean(currentPrice && quote?.highPrice && currentPrice >= quote.highPrice * (1 - alertSettings.breakoutBuffer / 100) && (quote.changePercent ?? 0) > 0),
      tone: "up" as const,
      note: "接近日內高點，觀察成交量是否同步放大。",
    },
    {
      label: "支撐警報",
      trigger: `距離支撐 <= ${alertSettings.supportBuffer}%`,
      value: formatNumber(supportPrice),
      active: Boolean(currentPrice && supportPrice && currentPrice <= supportPrice * (1 + alertSettings.supportBuffer / 100)),
      tone: "warn" as const,
      note: "接近或跌破支撐，避免情緒化加碼。",
    },
    {
      label: "風險警報",
      trigger: `風險 >= ${alertSettings.riskScore}`,
      value: `${risk}/100`,
      active: risk >= alertSettings.riskScore,
      tone: "warn" as const,
      note: "波動偏高，降低部位或等待冷卻。",
    },
  ];
  const activeAlertCount = alertRules.filter((rule) => rule.active).length;
  const rankingRows = [
    ...(marketSummary?.rankings.gainers ?? []),
    ...(marketSummary?.rankings.losers ?? []),
    ...(marketSummary?.rankings.volume ?? []),
  ];
  const watchMonitorRows = savedWatchlist.map((item) => {
    const ranking = rankingRows.find((row) => row.symbol === item.symbol);
    const isCurrentQuote = quote?.symbol === item.symbol;
    const liveQuote = watchQuotes[item.symbol] ?? (isCurrentQuote ? quote : null);
    const changePercent = liveQuote?.changePercent ?? ranking?.changePercent ?? null;
    const lastPrice = liveQuote?.price ?? ranking?.close ?? null;
    const triggeredUp = typeof changePercent === "number" && changePercent >= alertSettings.upPercent;
    const triggeredDown = typeof changePercent === "number" && changePercent <= -alertSettings.downPercent;
    const isTriggered = triggeredUp || triggeredDown;

    return {
      ...item,
      name: liveQuote?.name ?? item.name,
      changePercent,
      lastPrice,
      status: isTriggered ? "警報" : changePercent === null ? "待資料" : "正常",
      tone: isTriggered ? (triggeredUp ? "up" as const : "down" as const) : "neutral" as const,
      note: liveQuote ? "\u81ea\u9078\u80a1\u5373\u6642\u5831\u50f9" : ranking ? `${ranking.market} \u5b98\u65b9\u5e02\u5834\u8cc7\u6599` : "\u7b49\u5f85\u81ea\u9078\u80a1\u5831\u50f9",
    };
  });
  const watchAlertCount = watchMonitorRows.filter((row) => row.status === "警報").length;
  const notificationItems = [
    ...alertRules.map((rule) => ({
      id: `alert-${rule.label}`,
      title: rule.label,
      detail: `${rule.trigger} · ${rule.note}`,
      value: rule.value,
      active: rule.active,
      tone: rule.active ? rule.tone : "neutral" as const,
      source: quote ? `${quote.name} ${quote.symbol}` : "單股警報",
    })),
    ...watchMonitorRows
      .filter((row) => row.status === "警報" || row.status === "待資料")
      .map((row) => ({
        id: `watch-${row.symbol}-${row.status}`,
        title: `${row.name} ${row.status}`,
        detail: row.note,
        value: formatPercent(row.changePercent),
        active: row.status === "警報",
        tone: row.tone,
        source: row.symbol,
      })),
  ];
  const unreadNotificationCount = notificationItems.filter((item) => item.active && !readNotificationIds.includes(item.id)).length;
  const strongestMover = marketSummary?.rankings.gainers[0];
  const weakestMover = marketSummary?.rankings.losers[0];
  const morningBias = marketScore >= 58 ? "偏多開局" : marketScore <= 42 ? "保守開局" : "震盪觀察";
  const themeRadarRows = [
    { name: "AI 伺服器", symbols: ["2317", "2382", "3231"], catalyst: "算力需求 / ODM 出貨" },
    { name: "半導體", symbols: ["2330", "3661"], catalyst: "先進製程 / ASIC" },
    { name: "電力散熱", symbols: ["2308", "3017", "3324"], catalyst: "資料中心耗電與散熱" },
    { name: "太空航太", symbols: ["2634", "8033", "8222"], catalyst: "衛星通訊與航太零組件" },
    { name: "生技高波動", symbols: ["6446", "4147", "1762"], catalyst: "新藥題材 / 高價股輪動" },
  ].map((theme) => {
    const changes = theme.symbols
      .map((themeSymbol) => {
        if (quote?.symbol === themeSymbol) return quote.changePercent;
        return rankingRows.find((row) => row.symbol === themeSymbol)?.changePercent ?? null;
      })
      .filter((value): value is number => typeof value === "number");
    const averageChange = changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : null;
    const scoreValue = Math.round(clamp(50 + (averageChange ?? 0) * 8 + (marketScore - 50) * 0.4, 0, 100));
    return {
      ...theme,
      averageChange,
      score: scoreValue,
      tone: scoreValue >= 60 ? "up" as const : scoreValue <= 42 ? "down" as const : "neutral" as const,
    };
  });
  const compareRows = savedWatchlist.slice(0, 6).map((item) => {
    const ranking = rankingRows.find((row) => row.symbol === item.symbol);
    const isCurrentQuote = quote?.symbol === item.symbol;
    const changePercent = isCurrentQuote ? quote?.changePercent ?? null : ranking?.changePercent ?? null;
    const price = isCurrentQuote ? quote?.price ?? null : ranking?.close ?? null;
    const scoreValue = Math.round(clamp(50 + (changePercent ?? 0) * 5 + (isCurrentQuote ? technicalScore - 50 : 0) * 0.4, 0, 100));
    return {
      ...item,
      price,
      changePercent,
      score: changePercent === null ? null : scoreValue,
      status: changePercent === null ? "待資料" : scoreValue >= 62 ? "強勢" : scoreValue <= 42 ? "轉弱" : "中性",
      tone: changePercent === null ? "neutral" as const : scoreValue >= 62 ? "up" as const : scoreValue <= 42 ? "down" as const : "neutral" as const,
    };
  });

  const fetchMarketSummary = useCallback(async () => {
    setMarketLoading(true);
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      const payload = (await response.json()) as MarketSummaryResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      setMarketSummary(payload.summary);
    } catch {
      setError("官方市場總覽資料暫時無法載入。");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const fetchGeopolitics = useCallback(async () => {
    setGeopoliticsLoading(true);
    try {
      const response = await fetch("/api/geopolitics", { cache: "no-store" });
      const payload = (await response.json()) as GeopoliticsResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      setGeopolitics(payload.situation);
    } catch {
      setError("\u570b\u969b\u5c40\u52e2\u8cc7\u6599\u66ab\u6642\u7121\u6cd5\u8f09\u5165\u3002");
    } finally {
      setGeopoliticsLoading(false);
    }
  }, []);

  const fetchWatchQuotes = useCallback(async () => {
    const symbols = savedWatchlist.map((item) => item.symbol).filter(Boolean).slice(0, 20);
    if (!symbols.length) {
      setWatchQuotes({});
      setWatchQuoteStatus("無自選股");
      return;
    }

    try {
      const response = await fetch("/api/quote-cache?ttlMs=30000", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        quotes?: { symbol: string; ok: boolean; quote?: Quote }[];
      } | null;

      if (!response.ok || !payload?.ok) {
        setWatchQuoteStatus("報價待更新");
        return;
      }

      setWatchQuotes((quotes) => {
        const next = { ...quotes };
        for (const item of payload.quotes ?? []) {
          if (item.ok && item.quote) next[item.symbol] = item.quote;
        }
        return next;
      });
      setWatchQuoteStatus("30 秒更新");
    } catch {
      setWatchQuoteStatus("報價待更新");
    }
  }, [savedWatchlist]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([fetchMarketSummary(), fetchGeopolitics()]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchGeopolitics, fetchMarketSummary]);

  useEffect(() => {
    if (!isSignedIn) return;
    const firstTimer = window.setTimeout(() => {
      void fetchWatchQuotes();
    }, 0);
    const refreshTimer = window.setInterval(() => {
      void fetchWatchQuotes();
    }, 30_000);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(refreshTimer);
    };
  }, [fetchWatchQuotes, isSignedIn]);

  useEffect(() => {
    window.localStorage.setItem(watchlistStorageKey, JSON.stringify(savedWatchlist));
  }, [savedWatchlist]);

  useEffect(() => {
    window.localStorage.setItem("la1-alert-settings", JSON.stringify(alertSettings));
  }, [alertSettings]);

  useEffect(() => {
    window.localStorage.setItem("la1-read-notifications", JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    window.localStorage.setItem("la1-investment-notes", JSON.stringify(investmentNotes));
  }, [investmentNotes]);

  function updateAlertSetting(key: keyof AlertSettings, value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const ranges: Record<keyof AlertSettings, [number, number]> = {
      upPercent: [0.5, 10],
      downPercent: [0.5, 10],
      riskScore: [40, 95],
      breakoutBuffer: [0, 5],
      supportBuffer: [0, 5],
    };
    const [min, max] = ranges[key];
    setAlertSettings((settings) => ({
      ...settings,
      [key]: clamp(parsed, min, max),
    }));
  }

  function addInvestmentNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = noteDraft.title.trim();
    const thesis = noteDraft.thesis.trim();
    if (!title && !thesis) return;

    setInvestmentNotes((notes) => [
      {
        id: `${Date.now()}`,
        symbol: noteDraft.symbol.replace(/\D/g, "").slice(0, 6) || symbol,
        title: title || "未命名觀察",
        thesis: thesis || "待補進場理由。",
        stop: noteDraft.stop.trim(),
        target: noteDraft.target.trim(),
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ]);
    setNoteDraft({
      symbol: quote?.symbol ?? symbol,
      title: "",
      thesis: "",
      stop: "",
      target: "",
    });
  }

  function deleteInvestmentNote(id: string) {
    setInvestmentNotes((notes) => notes.filter((note) => note.id !== id));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = authPhone.replace(/\D/g, "");
    if (phone.length < 8) {
      setAuthMessage("\u8acb\u8f38\u5165\u6b63\u78ba\u624b\u6a5f\u865f\u78bc\u3002");
      return;
    }

    setAuthBusy(true);
    setAuthMessage(authMode === "register" ? "\u8a3b\u518a\u4e2d..." : "\u767b\u5165\u4e2d...");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: authMode,
          phone: authPhone,
          name: authName,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        phone?: string;
        user?: { id: string; name?: string; email?: string | null };
      } | null;

      if (!response.ok || !payload?.ok || !payload.user?.id) {
        setAuthMessage(payload?.error ?? "\u767b\u5165\u5931\u6557\uff0c\u8acb\u91cd\u65b0\u8f38\u5165\u624b\u6a5f\u865f\u3002");
        return;
      }

      window.localStorage.setItem("la1-user-id", payload.user.id);
      window.localStorage.setItem("la1-auth-user", "1");
      window.localStorage.setItem("la1-auth-phone", phone);
      setCloudUserId(payload.user.id);
      setCloudProfile({
        email: payload.user.email ?? "",
        name: payload.user.name ?? (authName || "LA1 \u7528\u6236"),
      });
      setCloudStatus("\u5df2\u767b\u5165 " + (payload.phone ?? phone));
      setIsSignedIn(true);
      setAuthMessage("\u767b\u5165\u6210\u529f");
      window.setTimeout(() => void pullCloudSnapshot(), 0);
    } catch {
      setAuthMessage("\u767b\u5165\u670d\u52d9\u66ab\u6642\u7121\u6cd5\u9023\u7dda\u3002");
    } finally {
      setAuthBusy(false);
    }
  }

  async function saveCloudProfile() {
    setCloudStatus("會員資料同步中");
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-la1-user-id": cloudUserId,
      },
      body: JSON.stringify(cloudProfile),
    });
    setCloudStatus(response.ok ? "會員資料已同步" : "會員資料同步失敗");
  }

  async function pushCloudSnapshot() {
    setCloudStatus("上傳雲端中");
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-la1-user-id": cloudUserId,
      },
      body: JSON.stringify({
        watchlist: savedWatchlist,
        notes: investmentNotes,
        alertSettings,
        readNotificationIds,
      }),
    });
    setCloudStatus(response.ok ? "雲端同步完成" : "雲端同步失敗");
  }

  async function pullCloudSnapshot() {
    setCloudStatus("讀取雲端中");
    const response = await fetch("/api/sync", {
      headers: { "x-la1-user-id": cloudUserId },
    });
    const payload = await response.json().catch(() => null) as {
      ok?: boolean;
      snapshot?: {
        watchlist?: WatchItem[];
        notes?: InvestmentNote[];
        alertSettings?: AlertSettings;
        readNotificationIds?: string[];
      };
    } | null;
    if (!response.ok || !payload?.ok || !payload.snapshot) {
      setCloudStatus("雲端讀取失敗");
      return;
    }
    const cloudWatchlist = normalizeWatchItems(payload.snapshot.watchlist);
    if (cloudWatchlist.length) {
      setSavedWatchlist(cloudWatchlist);
    }
    if (payload.snapshot.notes?.length) {
      setInvestmentNotes(payload.snapshot.notes);
    }
    setAlertSettings({ ...defaultAlertSettings, ...payload.snapshot.alertSettings });
    setReadNotificationIds(payload.snapshot.readNotificationIds ?? []);
    setCloudStatus("雲端資料已載入");
  }

  async function runCloudScan() {
    setCloudStatus("自選股掃描中");
    await pushCloudSnapshot();
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-la1-user-id": cloudUserId,
      },
      body: JSON.stringify({
        symbols: savedWatchlist.map((item) => item.symbol),
        alertSettings,
      }),
    });
    setCloudStatus(response.ok ? "批次掃描完成" : "批次掃描失敗，請確認 Fugle Key");
  }

  async function sendTestNotification() {
    setCloudStatus("測試通知發送中");
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-la1-user-id": cloudUserId,
      },
      body: JSON.stringify({
        title: "LA1 測試通知",
        detail: "如果 Railway 已設定通知環境變數，這則訊息會送到指定通道。",
        tone: "neutral",
        channels: ["telegram", "line", "email", "webhook"],
      }),
    });
    setCloudStatus(response.ok ? "測試通知已送出或已記錄" : "測試通知失敗");
  }

  const topCards = [
    {
      label: "加權指數",
      value: formatNumber(marketSummary?.indices.twse.value, 2),
      detail: `${formatNumber(marketSummary?.indices.twse.change)} / ${formatPercent(marketSummary?.indices.twse.changePercent)}`,
      tone: (marketSummary?.indices.twse.change ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      source: marketSummary?.indices.twse.source ?? "TWSE",
    },
    {
      label: "櫃買指數",
      value: formatNumber(marketSummary?.indices.tpex.value, 2),
      detail: `${formatNumber(marketSummary?.indices.tpex.change)} / ${formatPercent(marketSummary?.indices.tpex.changePercent)}`,
      tone: (marketSummary?.indices.tpex.change ?? 0) >= 0 ? ("up" as const) : ("down" as const),
      source: marketSummary?.indices.tpex.source ?? "TPEx",
    },
    {
      label: "個股即時",
      value: quote ? formatNumber(quote.price) : "--",
      detail: quote ? `${quote.name} ${quote.symbol}` : "請先查詢股票",
      tone: quote?.changePercent && quote.changePercent >= 0 ? ("up" as const) : ("down" as const),
      source: quote?.source ?? "Fugle",
    },
    {
      label: "廣度動能",
      value: `${marketScore}/100`,
      detail: marketSummary
        ? `上漲 ${marketSummary.breadth.up} / 下跌 ${marketSummary.breadth.down}`
        : "官方市場資料載入中",
      tone: marketScore >= 55 ? ("up" as const) : marketScore <= 45 ? ("down" as const) : ("neutral" as const),
      source: marketSummary?.breadth.source ?? "TWSE + TPEx",
    },
    {
      label: "風險溫度",
      value: `${risk}/100`,
      detail: risk > 60 ? "波動偏高" : "中性監控",
      tone: risk > 60 ? ("warn" as const) : ("neutral" as const),
      source: "報價 + 均線",
    },
    {
      label: "資料健康",
      value: context ? "可用" : "待查詢",
      detail: context ? "Fugle / TWSE / OpenAI" : "尚未載入",
      tone: context ? ("up" as const) : ("neutral" as const),
      source: "系統狀態",
    },
  ];

  const sectorRows = marketSummary?.industryRotation.length
    ? marketSummary.industryRotation
    : [
        {
          name: "半導體",
          averageChangePercent: context?.revenue.yoyChangePercent ?? null,
          upCount: 0,
          downCount: 0,
          totalMatched: context ? 1 : 0,
          score: context?.revenue.yoyChangePercent ? Math.round(clamp(50 + context.revenue.yoyChangePercent / 2, 0, 100)) : 50,
          leaders: quote ? [{ ...quote, market: "TWSE" as const, close: quote.price }] : [],
          source: context?.revenue.available ? "TWSE monthly revenue fallback" : "waiting market API",
          symbols: quote ? [quote.symbol] : [],
        },
      ];

  const moverRows = watchlist.map((item, index) => ({
    rank: index + 1,
    symbol: item.symbol,
    name: item.name,
    theme: item.theme,
    change: item.symbol === quote?.symbol ? quote.changePercent : null,
  }));

  async function fetchQuote(nextSymbol = symbol) {
    const cleanSymbol = nextSymbol.replace(/\D/g, "").slice(0, 6);
    if (!cleanSymbol) {
      setError("請輸入股票代號。");
      return;
    }

    setSymbol(cleanSymbol);
    setLoading(true);
    setError(null);
    setAnalysisError(null);
    setAnalysis(null);
    setAnalysisMeta(null);
    setContext(null);

    try {
      const response = await fetch(`/api/context?symbol=${cleanSymbol}`, { cache: "no-store" });
      const payload = (await response.json()) as ContextResponse;

      if (!payload.ok) {
        setQuote(null);
        setContext(null);
        setError(payload.error);
        return;
      }

      setQuote(payload.context.quote);
      setContext(payload.context);
    } catch {
      setQuote(null);
      setContext(null);
      setError("目前無法連線到市場資料服務，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalysis() {
    const cleanSymbol = (quote?.symbol ?? symbol).replace(/\D/g, "").slice(0, 6);
    if (!cleanSymbol) {
      setAnalysisError("請先查詢股票代號。");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`/api/analyze?symbol=${cleanSymbol}`, { cache: "no-store" });
      const payload = (await response.json()) as AnalyzeResponse;

      if (!payload.ok) {
        setAnalysis(null);
        setAnalysisMeta(null);
        setAnalysisError(payload.error);
        return;
      }

      setQuote(payload.quote);
      setContext(payload.context);
      setAnalysis(payload.analysis);
      setAnalysisMeta({ model: payload.model, generatedAt: payload.generatedAt });
    } catch {
      setAnalysis(null);
      setAnalysisMeta(null);
      setAnalysisError("目前無法連線到 AI 分析服務，請稍後再試。");
    } finally {
      setAnalysisLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void fetchQuote();
  }

  async function addWatchSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSymbol = customWatchSymbol.replace(/\D/g, "").slice(0, 6);
    if (!nextSymbol) return;

    let nextQuote = quote?.symbol === nextSymbol ? quote : null;
    if (!nextQuote) {
      try {
        const response = await fetch(`/api/quote-cache?symbol=${nextSymbol}&ttlMs=30000`, { cache: "no-store" });
        const payload = await response.json().catch(() => null) as {
          ok?: boolean;
          quote?: Quote;
        } | null;
        if (response.ok && payload?.ok && payload.quote) {
          nextQuote = payload.quote;
          setWatchQuotes((quotes) => ({ ...quotes, [nextSymbol]: payload.quote as Quote }));
        }
      } catch {
        // Keep adding the symbol even if the quote provider is temporarily unavailable.
      }
    }

    setSavedWatchlist((items) => {
      if (items.some((item) => item.symbol === nextSymbol)) return items;
      return [
        ...items,
        {
          symbol: nextSymbol,
          name: nextQuote?.name ?? "\u5f85\u540c\u6b65\u516c\u53f8\u540d\u7a31",
          theme: nextQuote ? "\u81ea\u9078\u80a1\u5373\u6642\u5831\u50f9" : "\u5f85\u540c\u6b65\u5831\u50f9",
        },
      ];
    });
    setCustomWatchSymbol("");
    void fetchQuote(nextSymbol);
  }

  function removeWatchSymbol(symbolToRemove: string) {
    setSavedWatchlist((items) => items.filter((item) => item.symbol !== symbolToRemove));
    setWatchQuotes((quotes) => {
      const next = { ...quotes };
      delete next[symbolToRemove];
      return next;
    });
  }

  const decisionPanel = (
    <Panel className={`decision-panel ${signal.tone}`} eyebrow="AI 投資決策卡" title={quote ? `${quote.name} ${quote.symbol}` : "輸入股票產生決策"} status={decisionStatus} statusTone={signal.tone}>
      <div className={`decision-hero ${signal.tone}`}>
        <div>
          <span>決策</span>
          <strong>{signal.zone}</strong>
        </div>
        <p>{signal.description}</p>
      </div>
      <div className="decision-regime">
        <span>大盤制度</span>
        <strong>{marketRegime.label} {marketRegime.score}/100</strong>
        <small>{marketRegime.posture} · {marketRegime.rule}</small>
      </div>
      <div className="decision-prices">
        <div><span>支撐</span><strong>{formatNumber(supportPrice)}</strong></div>
        <div><span>壓力</span><strong>{formatNumber(resistancePrice)}</strong></div>
        <div><span>停損</span><strong>{formatNumber(stopPrice)}</strong></div>
      </div>
      <div className="decision-scores">
        {[
          ["技術面", technicalScore, context ? "均線 / K 線" : "待資料"],
          ["籌碼面", chipScore, marketSummary ? "法人彙總" : "載入中"],
          ["基本面", fundamentalScore, context?.revenue.available ? "月營收" : "待資料"],
          ["新聞情緒", newsScore, context?.news.length ? "已接新聞" : "待查詢"],
        ].map(([name, value, note]) => (
          <div className="decision-score" key={String(name)}>
            <span>{name}</span>
            <strong>{typeof value === "number" && value > 0 ? `${value}/100` : "--"}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="decision-next">
        <span>明日檢查</span>
        {decisionChecks.map((check) => (
          <strong key={check}>{check}</strong>
        ))}
      </div>
      <button className="decision-action" disabled={!quote || analysisLoading} onClick={() => void fetchAnalysis()} type="button">
        {analysisLoading ? "AI 分析中" : analysis ? "更新 AI 分析" : "產生完整 AI 分析"}
      </button>
    </Panel>
  );

  const alertPanel = (
    <Panel
      className="alert-panel"
      eyebrow="漲跌警報"
      title={activeAlertCount ? `${activeAlertCount} 個警報觸發` : "預設警報監控"}
      status={quote ? "即時檢查" : "待查詢"}
      statusTone={activeAlertCount ? "warn" : "neutral"}
    >
      <div className="alert-summary">
        <strong>{activeAlertCount ? "注意異動" : "尚無觸發"}</strong>
        <span>{quote ? `${quote.name} ${quote.symbol} · ${formatTime(quote.updatedAt)}` : "輸入股票後監控上漲、下跌與支撐壓力。"}</span>
      </div>
      <div className="alert-list">
        {alertRules.map((rule) => (
          <div className={`alert-row ${rule.active ? rule.tone : ""}`} key={rule.label}>
            <div>
              <span>{rule.label}</span>
              <strong>{rule.trigger}</strong>
              <small>{rule.note}</small>
            </div>
            <div>
              <em>{rule.value}</em>
              <StatusPill tone={rule.active ? rule.tone : "neutral"}>{rule.active ? "已觸發" : "監控中"}</StatusPill>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const alertSettingsPanel = (
    <Panel className="alert-settings-panel" eyebrow="警報設定" title="自訂觸發門檻" status="本機保存">
      <div className="alert-settings-grid">
        {[
          ["upPercent", "上漲警報", "%", 0.5],
          ["downPercent", "下跌警報", "%", 0.5],
          ["riskScore", "風險警報", "分", 1],
          ["breakoutBuffer", "接近日高", "%", 0.1],
          ["supportBuffer", "接近支撐", "%", 0.1],
        ].map(([key, label, unit, step]) => (
          <label key={String(key)}>
            <span>{label}</span>
            <div>
              <input
                inputMode="decimal"
                onChange={(event) => updateAlertSetting(key as keyof AlertSettings, event.target.value)}
                step={Number(step)}
                type="number"
                value={alertSettings[key as keyof AlertSettings]}
              />
              <strong>{unit}</strong>
            </div>
          </label>
        ))}
      </div>
      <button className="settings-reset" onClick={() => setAlertSettings(defaultAlertSettings)} type="button">
        還原預設警報
      </button>
      <p className="settings-note">目前設定存在這台裝置的瀏覽器；接會員系統後可同步到帳號與推播。</p>
    </Panel>
  );

  const quotePanel = (
    <Panel className={`quote-panel ${tone}`} eyebrow="Live Quote" title={quote ? `${quote.name} ${quote.symbol}` : "單股監控"} status={quote?.source ?? "Fugle"}>
      <div className="quote-price">
        <strong>{formatNumber(quote?.price)}</strong>
        <div>
          <span>{formatNumber(quote?.change)}</span>
          <span>{formatNumber(quote?.changePercent)}%</span>
        </div>
      </div>
      <div className="quote-grid">
        <div><span>開盤</span><strong>{formatNumber(quote?.openPrice)}</strong></div>
        <div><span>最高</span><strong>{formatNumber(quote?.highPrice)}</strong></div>
        <div><span>最低</span><strong>{formatNumber(quote?.lowPrice)}</strong></div>
        <div><span>成交量</span><strong>{formatVolume(quote?.volume)}</strong></div>
      </div>
      <KLineChart candles={context?.technical.candles ?? []} />
      <div className="quote-actions">
        <span>更新時間：{formatTime(quote?.updatedAt)}</span>
        <button disabled={!quote || analysisLoading} onClick={() => void fetchAnalysis()} type="button">
          {analysisLoading ? "分析中" : "產生 AI 分析"}
        </button>
      </div>
    </Panel>
  );

  const homeQuotePanel = (
    <Panel
      className={`home-quote-panel ${tone}`}
      eyebrow={"Live Quote"}
      title={quote ? `${quote.name} ${quote.symbol}` : "\u500b\u80a1\u5373\u6642"}
      status={quote?.source ?? "Fugle"}
      statusTone={tone === "up" ? "up" : tone === "down" ? "down" : "neutral"}
    >
      <div className="home-quote-price">
        <strong>{formatNumber(quote?.price)}</strong>
        <div>
          <span>{formatNumber(quote?.change)}</span>
          <em>{formatNumber(quote?.changePercent)}%</em>
        </div>
      </div>
      <div className="home-quote-grid">
        <div><span>{"\u958b"}</span><strong>{formatNumber(quote?.openPrice)}</strong></div>
        <div><span>{"\u9ad8"}</span><strong>{formatNumber(quote?.highPrice)}</strong></div>
        <div><span>{"\u4f4e"}</span><strong>{formatNumber(quote?.lowPrice)}</strong></div>
        <div><span>{"\u91cf"}</span><strong>{formatVolume(quote?.volume)}</strong></div>
      </div>
      <div className="home-quote-footer">
        <span>{quote ? formatTime(quote.updatedAt) : "\u8acb\u67e5\u8a62\u80a1\u7968"}</span>
        <button disabled={loading} onClick={() => void fetchQuote()} type="button">
          {loading ? "\u66f4\u65b0\u4e2d" : "\u66f4\u65b0"}
        </button>
      </div>
    </Panel>
  );

  const sentimentPanel = (
    <Panel className="sentiment-panel" eyebrow="市場情緒總覽" title={score >= 60 ? "偏熱" : score <= 40 ? "偏冷" : "中性"} status={context ? "由個股暫估" : "待查詢"}>
      <Gauge label="情緒分數" value={score} />
      <div className="sentiment-grid">
        <div><span>技術溫度</span><strong>{context ? formatNumber(context.technical.ma20, 0) : "--"}</strong></div>
        <div><span>風險溫度</span><strong>{risk}/100</strong></div>
        <div><span>營收年增</span><strong>{context?.revenue.yoyChangePercent !== null && context?.revenue.yoyChangePercent !== undefined ? `${formatNumber(context.revenue.yoyChangePercent)}%` : "--"}</strong></div>
        <div><span>資料完整度</span><strong>{context ? "80%" : "--"}</strong></div>
      </div>
    </Panel>
  );

  const trendPanel = (
    <Panel
      className="trend-panel"
      eyebrow="市場趨勢走勢"
      title={quote ? `${quote.name} ${quote.symbol}` : "請先搜尋個股"}
      status={quote?.changePercent ? `${formatNumber(quote.changePercent)}%` : "待接資料"}
      statusTone={tone === "up" ? "up" : tone === "down" ? "down" : "neutral"}
    >
      <MiniTrend candles={context?.technical.candles ?? []} />
      <div className="trend-footer">
        <span>MA5 {formatNumber(context?.technical.ma5)}</span>
        <span>MA20 {formatNumber(context?.technical.ma20)}</span>
        <span>MA60 {formatNumber(context?.technical.ma60)}</span>
      </div>
    </Panel>
  );

  const institutionPanel = (
    <Panel
      className="institution-panel"
      eyebrow="三大法人動向"
      title={marketSummary ? "上市 + 上櫃彙總" : "官方資料載入中"}
      status={marketSummary?.institutional.source ?? "TWSE / TPEx"}
      statusTone={marketSummary ? "up" : "neutral"}
    >
      {[
        ["外資", marketSummary?.institutional.foreign],
        ["投信", marketSummary?.institutional.investmentTrust],
        ["自營商", marketSummary?.institutional.dealer],
        ["合計", marketSummary?.institutional.total],
      ].map(([name, value]) => (
        <div className="institution-row" key={String(name)}>
          <span>{name}</span>
          <strong>{formatSharesAsLots(value as number | null | undefined)}</strong>
        </div>
      ))}
      <p>{marketSummary ? `資料日 ${marketSummary.institutional.date ?? "--"}，來源為官方免費公開端點。` : "載入官方法人買賣超中。"}</p>
    </Panel>
  );

  const breadthPanel = (
    <Panel className="breadth-panel" eyebrow="市場廣度" title="上市 + 上櫃家數" status={marketSummary ? "已接官方" : "載入中"}>
      <Donut label="廣度分數" value={marketScore} />
      {[
        ["上漲", marketSummary?.breadth.up ?? "--", "TWSE + TPEx"],
        ["下跌", marketSummary?.breadth.down ?? "--", "TWSE + TPEx"],
        ["平盤", marketSummary?.breadth.flat ?? "--", `總計 ${marketSummary?.breadth.total ?? "--"} 檔`],
      ].map(([name, value, note]) => (
        <div className="compact-row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
      ))}
    </Panel>
  );

  const targetBreadthPanel = (
    <Panel
      className="breadth-panel"
      eyebrow="標的相對廣度"
      title={quote ? `${quote.name} ${quote.symbol}` : "先查詢股票"}
      status={quote ? targetBreadthLabel : "待查詢"}
      statusTone={targetBreadthScore >= 62 ? "up" : targetBreadthScore <= 42 ? "down" : "neutral"}
    >
      <Donut label="標的分數" value={targetBreadthScore} />
      {[
        ["大盤制度", `${marketRegime.score}/100`, marketRegime.label],
        ["個股趨勢", context ? `${technicalScore}/100` : "--", context ? "均線 / K 線" : "待同步"],
        ["風險扣分", quote ? `${risk}/100` : "--", risk >= 65 ? "波動偏高" : "可控"],
      ].map(([name, value, note]) => (
        <div className="compact-row" key={name}>
          <span>{name}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
      ))}
    </Panel>
  );

  const sectorPanel = (
    <Panel
      className="sector-panel"
      eyebrow="產業輪動"
      title={marketSummary?.industryRotation.length ? "主題資金強弱" : "AI / 半導體雷達"}
      status={marketSummary?.industryRotation.length ? "官方行情彙總" : "載入中"}
      statusTone={marketSummary?.industryRotation.length ? "up" : "neutral"}
    >
      {sectorRows.map((row) => (
        <div className="sector-row" key={row.name}>
          <span>{row.name}</span>
          <div><i style={{ width: `${clamp(row.score, 12, 100)}%` }} /></div>
          <strong>{formatPercent(row.averageChangePercent)}</strong>
          <small>
            {row.totalMatched
              ? `分數 ${row.score}/100 · 上漲 ${row.upCount} / 下跌 ${row.downCount} · ${row.leaders[0] ? `領先 ${row.leaders[0].name} ${formatPercent(row.leaders[0].changePercent)}` : "無強勢股"}`
              : "等待官方行情"}
          </small>
        </div>
      ))}
    </Panel>
  );

  const rankingPanel = (
    <Panel className="ranking-panel" eyebrow="漲幅排行榜" title={marketSummary ? "全市場排行" : "觀察清單"} status={marketSummary ? "官方資料" : "點選查詢"}>
      {(marketSummary?.rankings.gainers.length
        ? marketSummary.rankings.gainers
        : moverRows.map((row) => ({
            symbol: row.symbol,
            name: row.name,
            market: "TWSE" as const,
            close: null,
            change: null,
            changePercent: row.change,
            volume: null,
          }))
      ).map((row, index) => (
        <button className="rank-row" key={`${row.market}-${row.symbol}`} onClick={() => void fetchQuote(row.symbol)} type="button">
          <span>{index + 1}</span>
          <strong>{row.name}</strong>
          <small>{row.symbol} · {row.market} · 收 {formatNumber(row.close)}</small>
          <em>{formatPercent(row.changePercent)}</em>
        </button>
      ))}
    </Panel>
  );

  const downRankingPanel = (
    <Panel className="ranking-panel down-list" eyebrow="跌幅排行榜" title={marketSummary ? "全市場排行" : "官方資料載入中"} status={marketSummary ? "官方資料" : "載入中"} statusTone={marketSummary ? "neutral" : "warn"}>
      {(marketSummary?.rankings.losers.length ? marketSummary.rankings.losers : []).map((item, index) => (
        <button className="rank-row" key={`${item.market}-${item.symbol}`} onClick={() => void fetchQuote(item.symbol)} type="button">
          <span>{index + 1}</span>
          <strong>{item.name}</strong>
          <small>{item.symbol} · {item.market} · 收 {formatNumber(item.close)}</small>
          <em>{formatPercent(item.changePercent)}</em>
        </button>
      ))}
      {!marketSummary ? <div className="empty-mini">官方排行載入中</div> : null}
    </Panel>
  );

  const newsPanel = (
    <Panel className="news-panel" eyebrow="市場快訊" title="TWSE 新聞" status={context?.news.length ? "已接" : "待查詢"}>
      {(context?.news.length ? context.news.slice(0, 5) : [{ title: "查詢個股後載入證交所新聞", url: "", date: "", source: "" }]).map((item) =>
        item.url ? (
          <a className="news-item" href={item.url} key={`${item.date}-${item.title}`} target="_blank">
            <span>{item.date || "TWSE"}</span>
            <strong>{item.title}</strong>
          </a>
        ) : (
          <div className="news-item" key={item.title}>
            <span>待接</span>
            <strong>{item.title}</strong>
          </div>
        ),
      )}
    </Panel>
  );

  const globalPanel = (
    <Panel
      className="global-panel"
      eyebrow="國際市場"
      title="跨市場監控"
      status={marketSummary?.globalMarkets.length ? "已接行情" : "載入中"}
      statusTone={marketSummary?.globalMarkets.length ? "up" : "neutral"}
    >
      {(marketSummary?.globalMarkets.length
        ? marketSummary.globalMarkets
        : [
            { name: "Dow Jones", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "S&P 500", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "Nasdaq", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "VIX", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "美元/新台幣", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "日經 225", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
            { name: "費半指數", value: null, change: null, changePercent: null, date: null, source: "Yahoo Finance chart endpoint" },
          ]
      ).map((item) => (
        <div className="compact-row" key={item.name}>
          <span>{item.name}</span>
          <strong>{formatNumber(item.value, item.name.includes("美元") ? 3 : 2)}</strong>
          <small>{formatNumber(item.change, 2)} / {formatPercent(item.changePercent)}</small>
        </div>
      ))}
    </Panel>
  );

  const economyPanel = (
    <Panel
      className="economy-panel"
      eyebrow="最新經濟數據"
      title="宏觀因子"
      status={marketSummary?.macroFactors.length ? "已接資料" : "載入中"}
      statusTone={marketSummary?.macroFactors.length ? "up" : "neutral"}
    >
      {(marketSummary?.macroFactors.length
        ? marketSummary.macroFactors
        : [
            { name: "台灣失業率", value: null, unit: "%", period: null, source: "中華民國統計資訊網" },
            { name: "消費者物價指數年增率", value: null, unit: "%", period: null, source: "中華民國統計資訊網" },
            { name: "美債10年殖利率", value: null, unit: "%", period: null, source: "U.S. Treasury" },
          ]
      ).map((item) => (
        <div className="compact-row" key={item.name}>
          <span>{item.name}</span>
          <strong>{formatNumber(item.value, 2)}{item.value === null ? "" : item.unit}</strong>
          <small>{item.period ?? "載入中"} · {item.source}</small>
        </div>
      ))}
    </Panel>
  );

  const geopoliticalPanel = (
    <Panel
      className="geopolitics-panel"
      eyebrow="\u570b\u969b\u5c40\u52e2"
      title={geopolitics?.stance ?? "\u5168\u7403\u98a8\u96aa\u76e3\u63a7"}
      status={geopolitics ? `\u98a8\u96aa ${geopolitics.riskScore}/100` : geopoliticsLoading ? "\u8f09\u5165\u4e2d" : "\u5f85\u540c\u6b65"}
      statusTone={geopolitics && geopolitics.riskScore >= 70 ? "warn" : geopolitics && geopolitics.riskScore >= 52 ? "neutral" : "up"}
    >
      <div className="situation-hero">
        <div>
          <span>GDELT</span>
          <strong>{geopolitics ? "\u8fd1 24 \u5c0f\u6642\u4e8b\u4ef6" : "\u5f85\u63a5\u6536\u8cc7\u6599"}</strong>
          <small>{geopolitics?.source ?? "GDELT DOC 2.0"}</small>
        </div>
        <div>
          <span>World Monitor</span>
          <strong>{geopolitics?.worldMonitor.configured ? "\u5df2\u914d\u7f6e" : "\u53ef\u63a5\u5165"}</strong>
          <small>{geopolitics?.worldMonitor.configured ? "API/MCP ready" : "\u9700 WORLDMONITOR_API_KEY"}</small>
        </div>
      </div>
      <div className="hotspot-grid">
        {(geopolitics?.hotspots.length
          ? geopolitics.hotspots
          : [
              { name: "\u53f0\u6d77 / \u5357\u6d77", count: 0, severity: "medium" as const },
              { name: "\u4e2d\u6771 / \u7d05\u6d77", count: 0, severity: "medium" as const },
              { name: "AI / \u534a\u5c0e\u9ad4", count: 0, severity: "low" as const },
            ]
        ).map((item) => (
          <div className={`hotspot-chip ${item.severity}`} key={item.name}>
            <strong>{item.name}</strong>
            <span>{item.count ? `${item.count} \u5247` : "\u5f85\u8cc7\u6599"}</span>
          </div>
        ))}
      </div>
      <div className="world-monitor-links" data-no-card-zoom="true">
        <a href={geopolitics?.worldMonitor.dashboardUrl ?? "https://www.worldmonitor.app/"} target="_blank">
          World Monitor
        </a>
        <a href={geopolitics?.worldMonitor.repositoryUrl ?? "https://github.com/tncsharetool/worldmonitor"} target="_blank">
          GitHub
        </a>
      </div>
    </Panel>
  );

  const situationFeedPanel = (
    <Panel
      className="situation-feed-panel"
      eyebrow="\u5373\u6642\u570b\u969b\u4e8b\u4ef6"
      title={geopolitics?.events.length ? "\u5e02\u5834\u76f8\u95dc\u8ffd\u8e64" : "\u7b49\u5f85 GDELT"}
      status={geopolitics ? "\u514d\u8cbb\u516c\u958b API" : "\u5f85\u540c\u6b65"}
      statusTone={geopolitics ? "up" : "neutral"}
    >
      <div className="situation-list">
        {(geopolitics?.events.length
          ? geopolitics.events.slice(0, 6)
          : [
              {
                id: "empty-situation",
                title: "\u540c\u6b65\u5f8c\u986f\u793a\u6230\u722d\u3001\u80fd\u6e90\u3001\u822a\u904b\u8207\u534a\u5c0e\u9ad4\u76f8\u95dc\u570b\u969b\u4e8b\u4ef6\u3002",
                url: "",
                domain: "GDELT",
                sourceCountry: "",
                publishedAt: null,
                tone: null,
                severity: "low" as const,
                theme: "\u570b\u969b\u5c40\u52e2",
                marketImpact: "\u7528\u65bc\u8f14\u52a9\u5224\u65b7\u53f0\u80a1\u958b\u76e4\u98a8\u96aa\u8207\u4f9b\u61c9\u93c8\u58d3\u529b\u3002",
                source: "GDELT DOC 2.0",
              },
            ]
        ).map((item) => {
          const content = (
            <>
              <div>
                <span>{item.theme}</span>
                <strong>{item.title}</strong>
                <small>{item.marketImpact}</small>
              </div>
              <div>
                <StatusPill tone={item.severity === "high" ? "warn" : item.severity === "medium" ? "neutral" : "up"}>
                  {item.severity === "high" ? "\u9ad8" : item.severity === "medium" ? "\u4e2d" : "\u4f4e"}
                </StatusPill>
                <small>{item.publishedAt ? formatTime(item.publishedAt) : item.domain || item.source}</small>
              </div>
            </>
          );

          return item.url ? (
            <a className={`situation-item ${item.severity}`} href={item.url} key={item.id} target="_blank">
              {content}
            </a>
          ) : (
            <div className={`situation-item ${item.severity}`} key={item.id}>
              {content}
            </div>
          );
        })}
      </div>
    </Panel>
  );

  const aiPanel = (
    <Panel className="ai-panel" eyebrow="AI 分析中心" title={analysis?.stance ?? "等待分析"} status={analysisMeta?.model ?? "OpenAI"}>
      <p>{analysis?.conclusion ?? "查詢個股後，可產生條件式研究摘要、風險提醒與下一步檢查清單。"}</p>
      {analysis && (
        <div className="scenario-mini">
          <div><strong>偏多</strong><span>{analysis.scenarios.bullish}</span></div>
          <div><strong>觀望</strong><span>{analysis.scenarios.neutral}</span></div>
          <div><strong>偏空</strong><span>{analysis.scenarios.bearish}</span></div>
        </div>
      )}
    </Panel>
  );

  const signalPanel = (
    <Panel className="signal-panel" eyebrow="AI 進出場燈號" title={signal.label} status={signal.zone} statusTone={signal.tone}>
      <div className={`signal-badge ${signal.tone}`}>
        <strong>{signal.zone}</strong>
        <span>{signal.description}</span>
      </div>
      <div className="signal-checks">
        {signal.checks.map((check) => (
          <span key={check}>{check}</span>
        ))}
      </div>
      <p>這是研究輔助訊號，不是投資建議；公開版會保留風險提示與資料來源。</p>
    </Panel>
  );

  const watchPanel = (
    <Panel className="watch-panel" eyebrow="自選股監控" title="AI 供應鏈" status={watchQuoteStatus}>
      <form className="watch-add" onSubmit={addWatchSymbol}>
        <input
          aria-label="新增自選股代碼"
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setCustomWatchSymbol(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="輸入代碼"
          value={customWatchSymbol}
        />
        <button type="submit">加入</button>
      </form>
      {watchMonitorRows.map((item) => (
        <div className="watch-row-shell" key={item.symbol}>
          <button className={`watch-row ${item.tone}`} onClick={() => void fetchQuote(item.symbol)} type="button">
            <strong>{item.symbol}</strong>
            <span>{item.name}</span>
            <small>{item.theme}</small>
            <div className="watch-price">
              <em>{item.lastPrice ? `收 ${formatNumber(item.lastPrice)}` : "待報價"}</em>
              <small>{formatPercent(item.changePercent)}</small>
            </div>
          </button>
          <button
            aria-label={`\u522a\u9664 ${item.symbol}`}
            className="watch-remove"
            onClick={() => removeWatchSymbol(item.symbol)}
            type="button"
          >
            {"\u522a\u9664"}
          </button>
        </div>
      ))}
    </Panel>
  );

  const watchMonitorPanel = (
    <Panel
      className="watch-monitor-panel"
      eyebrow="自選股批次監控"
      title={watchAlertCount ? `${watchAlertCount} 檔觸發警報` : "名單狀態總覽"}
      status={marketSummary ? "官方資料" : "載入中"}
      statusTone={watchAlertCount ? "warn" : "neutral"}
    >
      <div className="watch-monitor-list">
        {watchMonitorRows.map((item) => (
          <div className={`watch-monitor-row ${item.tone}`} key={item.symbol}>
            <button className="watch-monitor-main" onClick={() => void fetchQuote(item.symbol)} type="button">
              <div>
                <strong>{item.symbol}</strong>
                <span>{item.name}</span>
                <small className="watch-monitor-theme">{item.theme}</small>
              </div>
              <div>
                <em>{formatPercent(item.changePercent)}</em>
                <StatusPill tone={item.tone}>{item.status}</StatusPill>
              </div>
              <small className="watch-monitor-note">{item.lastPrice ? "\u6536 " + formatNumber(item.lastPrice) + " \u00b7 " + item.note : item.note}</small>
            </button>
            <button
              aria-label={`\u522a\u9664 ${item.symbol}`}
              className="watch-remove"
              onClick={() => removeWatchSymbol(item.symbol)}
              type="button"
            >
              {"\u522a\u9664"}
            </button>
          </div>
        ))}
      </div>
      <p className="settings-note">批次監控目前使用官方排行與目前查詢個股，不會大量消耗 Fugle 即時報價額度。</p>
    </Panel>
  );

  const morningPanel = (
    <Panel className="brief-panel" eyebrow="每日開盤前摘要" title={morningBias} status={marketSummary ? "已接市場" : "載入中"} statusTone={marketScore >= 58 ? "up" : marketScore <= 42 ? "down" : "neutral"}>
      <div className="brief-hero">
        <strong>{morningBias}</strong>
        <span>{marketSummary ? `市場廣度 ${marketScore}/100，上漲 ${marketSummary.breadth.up} 檔，下跌 ${marketSummary.breadth.down} 檔。` : "等待官方市場總覽資料。"}</span>
      </div>
      <div className="brief-list">
        <div><span>國際觀察</span><strong>{marketSummary?.globalMarkets[0]?.name ?? "Dow Jones"} {formatPercent(marketSummary?.globalMarkets[0]?.changePercent)}</strong></div>
        <div><span>今日強勢</span><strong>{strongestMover ? `${strongestMover.name} ${formatPercent(strongestMover.changePercent)}` : "待市場排行"}</strong></div>
        <div><span>今日風險</span><strong>{weakestMover ? `${weakestMover.name} ${formatPercent(weakestMover.changePercent)}` : "待市場排行"}</strong></div>
        <div><span>自選警報</span><strong>{watchAlertCount ? `${watchAlertCount} 檔需處理` : "暫無觸發"}</strong></div>
      </div>
    </Panel>
  );

  const reviewPanel = (
    <Panel className="brief-panel" eyebrow="收盤後復盤" title={watchAlertCount || activeAlertCount ? "今日有異動" : "今日平穩"} status="待收盤補強" statusTone={watchAlertCount || activeAlertCount ? "warn" : "neutral"}>
      <div className="brief-list">
        <div><span>觸發警報</span><strong>{activeAlertCount + watchAlertCount} 則</strong></div>
        <div><span>最強股</span><strong>{strongestMover ? `${strongestMover.name} ${formatPercent(strongestMover.changePercent)}` : "待排行"}</strong></div>
        <div><span>最弱股</span><strong>{weakestMover ? `${weakestMover.name} ${formatPercent(weakestMover.changePercent)}` : "待排行"}</strong></div>
        <div><span>明日重點</span><strong>{decisionChecks[0] ?? "觀察美股與法人動向"}</strong></div>
      </div>
      <p className="settings-note">正式版可在收盤後自動產生復盤，並把觸發過的警報寫入通知中心。</p>
    </Panel>
  );

  const notificationPanel = (
    <Panel className="notification-panel" eyebrow="通知中心" title={unreadNotificationCount ? `${unreadNotificationCount} 則待處理` : "通知已整理"} status={`${notificationItems.length} 則`} statusTone={unreadNotificationCount ? "warn" : "neutral"}>
      <button className="settings-reset" onClick={() => setReadNotificationIds(notificationItems.map((item) => item.id))} type="button">
        全部標記已讀
      </button>
      <div className="notification-list">
        {notificationItems.map((item) => {
          const isRead = readNotificationIds.includes(item.id);
          return (
            <button className={`notification-row ${item.active && !isRead ? item.tone : ""}`} key={item.id} onClick={() => setReadNotificationIds((ids) => Array.from(new Set([...ids, item.id])))} type="button">
              <div>
                <span>{item.source}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
              <div>
                <em>{item.value}</em>
                <StatusPill tone={item.active && !isRead ? item.tone : "neutral"}>{isRead ? "已讀" : item.active ? "待處理" : "監控中"}</StatusPill>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );

  const notesPanel = (
    <Panel className="notes-panel" eyebrow="我的投資筆記" title={investmentNotes.length ? `${investmentNotes.length} 則筆記` : "建立第一則筆記"} status="本機保存">
      <form className="note-form" onSubmit={addInvestmentNote}>
        <div className="note-form-grid">
          <label><span>股票代號</span><input inputMode="numeric" maxLength={6} onChange={(event) => setNoteDraft((draft) => ({ ...draft, symbol: event.target.value.replace(/\D/g, "").slice(0, 6) }))} value={noteDraft.symbol} /></label>
          <label><span>標題</span><input onChange={(event) => setNoteDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="例如：回測月線觀察" value={noteDraft.title} /></label>
          <label><span>停損</span><input onChange={(event) => setNoteDraft((draft) => ({ ...draft, stop: event.target.value }))} placeholder="例如：跌破 820" value={noteDraft.stop} /></label>
          <label><span>目標</span><input onChange={(event) => setNoteDraft((draft) => ({ ...draft, target: event.target.value }))} placeholder="例如：900 到 920" value={noteDraft.target} /></label>
        </div>
        <label className="note-thesis"><span>理由</span><textarea onChange={(event) => setNoteDraft((draft) => ({ ...draft, thesis: event.target.value }))} placeholder="寫下進場理由、風險或明天要確認的條件。" value={noteDraft.thesis} /></label>
        <button className="decision-action" type="submit">新增投資筆記</button>
      </form>
      <div className="note-list">
        {(investmentNotes.length ? investmentNotes : [{ id: "empty", symbol: symbol, title: "還沒有筆記", thesis: "可以先記錄一檔股票的觀察理由、停損與目標價。", stop: "--", target: "--", createdAt: new Date().toISOString() }]).map((note) => (
          <article className="note-card" key={note.id}>
            <div>
              <span>{note.symbol}</span>
              <strong>{note.title}</strong>
            </div>
            <p>{note.thesis}</p>
            <small>停損 {note.stop || "--"} · 目標 {note.target || "--"} · {new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit" }).format(new Date(note.createdAt))}</small>
            {note.id !== "empty" ? <button onClick={() => deleteInvestmentNote(note.id)} type="button">刪除</button> : null}
          </article>
        ))}
      </div>
    </Panel>
  );

  const themeRadarPanel = (
    <Panel className="theme-panel" eyebrow="主題雷達" title="題材強弱掃描" status="自選 + 排行">
      <div className="theme-list">
        {themeRadarRows.map((theme) => (
          <div className={`theme-row ${theme.tone}`} key={theme.name}>
            <div>
              <span>{theme.name}</span>
              <strong>{theme.score}/100</strong>
              <small>{theme.catalyst}</small>
            </div>
            <div>
              <em>{theme.averageChange === null ? "--" : formatPercent(theme.averageChange)}</em>
              <small>{theme.symbols.join(" / ")}</small>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  const comparePanel = (
    <Panel className="compare-panel" eyebrow="股票比較" title="自選股快速比較" status={`${compareRows.length} 檔`}>
      <div className="compare-table">
        <div className="compare-head"><span>股票</span><span>價格</span><span>漲跌</span><span>評分</span><span>狀態</span></div>
        {compareRows.map((row) => (
          <button className={`compare-row ${row.tone}`} key={row.symbol} onClick={() => void fetchQuote(row.symbol)} type="button">
            <strong>{row.symbol} {row.name}</strong>
            <span>{formatNumber(row.price)}</span>
            <span>{formatPercent(row.changePercent)}</span>
            <span>{row.score === null ? "--" : `${row.score}/100`}</span>
            <StatusPill tone={row.tone}>{row.status}</StatusPill>
          </button>
        ))}
      </div>
      <p className="settings-note">點選任一股票即可切到該檔即時報價與 AI 決策卡。</p>
    </Panel>
  );

  const cloudPanel = (
    <Panel className="cloud-panel" eyebrow="會員與雲端同步" title="公開版帳號資料" status={cloudStatus}>
      <div className="cloud-id">
        <span>雲端 ID</span>
        <strong>{cloudUserId}</strong>
      </div>
      <div className="note-form-grid">
        <label><span>Email</span><input onChange={(event) => setCloudProfile((profile) => ({ ...profile, email: event.target.value }))} placeholder="user@example.com" value={cloudProfile.email} /></label>
        <label><span>名稱</span><input onChange={(event) => setCloudProfile((profile) => ({ ...profile, name: event.target.value }))} value={cloudProfile.name} /></label>
      </div>
      <div className="cloud-actions">
        <button onClick={() => void saveCloudProfile()} type="button">保存會員</button>
        <button onClick={() => void pushCloudSnapshot()} type="button">上傳同步</button>
        <button onClick={() => void pullCloudSnapshot()} type="button">載入雲端</button>
        <button onClick={() => void runCloudScan()} type="button">批次掃描</button>
        <button onClick={() => void sendTestNotification()} type="button">測試通知</button>
      </div>
      <p className="settings-note">目前是輕量會員模式；正式版可替換成 Google、LINE 或 Email Magic Link 登入。</p>
    </Panel>
  );

  const sourcePanel = (
    <Panel className="data-panel" eyebrow="資料源狀態" title="真資料優先" status={context ? "已載入" : "待查詢"}>
      <div className="source-grid">
        <div><strong>Fugle</strong><span>即時報價 / K 線 / 均線</span><StatusPill tone={context ? "up" : "neutral"}>{context ? "已接" : "待查詢"}</StatusPill></div>
        <div><strong>TWSE OpenAPI</strong><span>上市月營收 / 新聞</span><StatusPill tone={context ? "up" : "neutral"}>{context ? "已接" : "待查詢"}</StatusPill></div>
        <div><strong>OpenAI</strong><span>研究摘要 / 情境推演</span><StatusPill tone={analysis ? "up" : "neutral"}>{analysis ? "已產生" : "待分析"}</StatusPill></div>
        <div><strong>法人買賣超</strong><span>TWSE T86 / TPEx 3insti</span><StatusPill tone={marketSummary ? "up" : "neutral"}>{marketSummary ? "已接官方" : "載入中"}</StatusPill></div>
        <div><strong>GDELT</strong><span>國際局勢 / 近即時新聞事件</span><StatusPill tone={geopolitics ? "up" : "neutral"}>{geopolitics ? "已接" : "待同步"}</StatusPill></div>
        <div><strong>World Monitor</strong><span>全球情報儀表板 / API MCP</span><StatusPill tone={geopolitics?.worldMonitor.configured ? "up" : "warn"}>{geopolitics?.worldMonitor.configured ? "已配置" : "待 KEY"}</StatusPill></div>
      </div>
    </Panel>
  );

  function renderPage() {
    switch (activePage) {
      case "overview":
        return (
          <>
            {sentimentPanel}
            {trendPanel}
            {institutionPanel}
            {breadthPanel}
            {sectorPanel}
            {rankingPanel}
            {downRankingPanel}
            {globalPanel}
            {newsPanel}
            {watchMonitorPanel}
          </>
        );
      case "morning":
        return (
          <>
            {morningPanel}
            {globalPanel}
            {geopoliticalPanel}
            {themeRadarPanel}
            {watchMonitorPanel}
          </>
        );
      case "review":
        return (
          <>
            {reviewPanel}
            {notificationPanel}
            {watchMonitorPanel}
            {notesPanel}
          </>
        );
      case "pulse":
        return (
          <>
            {sentimentPanel}
            {trendPanel}
            {targetBreadthPanel}
            {homeQuotePanel}
            {quotePanel}
          </>
        );
      case "indices":
        return (
          <>
            {globalPanel}
            <Panel className="breadth-panel" eyebrow="台股指數" title="加權 / 櫃買" status={marketSummary ? "已接官方" : "載入中"}>
              <div className="compact-row">
                <span>加權指數</span>
                <strong>{formatNumber(marketSummary?.indices.twse.value, 2)}</strong>
                <small>{formatNumber(marketSummary?.indices.twse.change)} / {formatPercent(marketSummary?.indices.twse.changePercent)}</small>
              </div>
              <div className="compact-row">
                <span>櫃買指數</span>
                <strong>{formatNumber(marketSummary?.indices.tpex.value, 2)}</strong>
                <small>{formatNumber(marketSummary?.indices.tpex.change)} / {formatPercent(marketSummary?.indices.tpex.changePercent)}</small>
              </div>
            </Panel>
          </>
        );
      case "breadth":
        return (
          <>
            {targetBreadthPanel}
            {breadthPanel}
            {rankingPanel}
            {downRankingPanel}
          </>
        );
      case "sectors":
        return (
          <>
            {sectorPanel}
            {themeRadarPanel}
          </>
        );
      case "themes":
        return (
          <>
            {themeRadarPanel}
            {sectorPanel}
          </>
        );
      case "compare":
        return (
          <>
            {comparePanel}
          </>
        );
      case "institutions":
        return (
          <>
            {institutionPanel}
          </>
        );
      case "global":
        return (
          <>
            {globalPanel}
            {economyPanel}
            {geopoliticalPanel}
            {situationFeedPanel}
          </>
        );
      case "data":
        return (
          <>
            {sourcePanel}
            {cloudPanel}
          </>
        );
      case "ai":
        return (
          <>
            {decisionPanel}
            {signalPanel}
            {aiPanel}
            {quotePanel}
          </>
        );
      case "risk":
        return (
          <>
            {decisionPanel}
            {alertPanel}
            {alertSettingsPanel}
            {signalPanel}
            {sentimentPanel}
          </>
        );
      case "notifications":
        return (
          <>
            {notificationPanel}
            {alertPanel}
            {watchMonitorPanel}
          </>
        );
      case "notes":
        return (
          <>
            {notesPanel}
          </>
        );
      case "news":
        return <>{newsPanel}</>;
      case "watchlist":
        return (
          <>
            {watchMonitorPanel}
            {watchPanel}
            {quotePanel}
            {alertPanel}
          </>
        );
      case "settings":
        return (
          <>
            {cloudPanel}
            {alertSettingsPanel}
            <Panel className="ai-panel" eyebrow="產品護欄" title="大眾版投資智能體" status="已啟用">
              <p>缺資料時顯示待接，不用 AI 補假行情、假法人或假新聞。輸出定位為研究摘要、情境推演與風險提醒，不做保證獲利的喊單。</p>
            </Panel>
          </>
        );
      default:
        return null;
    }
  }

  if (!isSignedIn) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-brand">
            <span className="live-dot" />
            <div>
              <strong>{"LA1 \u53f0\u80a1\u5206\u6790\u5ba4"}</strong>
              <p>{"\u624b\u6a5f\u865f\u8a3b\u518a\u5f8c\u5373\u53ef\u540c\u6b65\u81ea\u9078\u80a1\u3001\u7b46\u8a18\u8207\u8b66\u5831\u8a2d\u5b9a\u3002"}</p>
            </div>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="member mode">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              {"\u767b\u5165"}
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              {"\u8a3b\u518a"}
            </button>
          </div>

          <form className="auth-form" onSubmit={submitAuth}>
            <label>
              <span>{"\u624b\u6a5f\u865f\u78bc"}</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                onChange={(event) => setAuthPhone(event.target.value)}
                placeholder="0912345678"
                value={authPhone}
              />
            </label>

            {authMode === "register" ? (
              <label>
                <span>{"\u986f\u793a\u540d\u7a31"}</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="LA1 \u6703\u54e1"
                  value={authName}
                />
              </label>
            ) : null}

            <button className="auth-submit" disabled={authBusy} type="submit">
              {authBusy ? "\u8655\u7406\u4e2d" : authMode === "register" ? "\u5efa\u7acb\u5e33\u865f" : "\u624b\u6a5f\u767b\u5165"}
            </button>
          </form>

          {authMessage ? <p className="auth-message">{authMessage}</p> : null}
          <p className="auth-note">{"\u6b64\u7248\u672c\u4e0d\u9700\u8981\u7c21\u8a0a\u9a57\u8b49\u78bc\u3002\u6b63\u5f0f\u516c\u958b\u71df\u904b\u524d\uff0c\u53ef\u518d\u5347\u7d1a\u6210 OTP \u6216\u7b2c\u4e09\u65b9\u767b\u5165\u3002"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="terminal-shell command-center">
      <div className="command-marquee">STRATEGIC COMMAND CENTER</div>
      <aside className="sidebar">
        <div className="brand-block">
          <strong>LA1 STOCK LAB</strong>
          <span>MARKET INTELLIGENCE</span>
        </div>
        <nav className="side-nav" aria-label="主要功能">
          {navigationPages.map((page, index) => (
            <button
              className={activePage === page.key ? "active" : ""}
              key={page.key}
              onClick={() => setActivePage(page.key)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {page.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="live-dot" />
          <div>
            <strong>{"\u6230\u5099\u6a21\u5f0f"}</strong>
            <p>{"\u76e4\u4e2d\u5831\u50f9 30 \u79d2\u66f4\u65b0"}</p>
          </div>
        </div>
      </aside>

      <section className="workbench">
        <header className="topbar">
          <div className="sync-state">
            <span className="live-dot" />
            <strong>{"\u6230\u7565\u7e3d\u89bd / \u5e02\u5834\u6230\u6cc1\u6307\u63ee\u4e2d\u5fc3"}</strong>
            <span>{"\u8cc7\u6599\u65e5\u671f"} {new Date().toLocaleDateString("zh-TW")}</span>
          </div>
          <form className="stock-search" onSubmit={submit}>
            <span>⌕</span>
            <input
              aria-label="搜尋股票代號"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setSymbol(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="搜尋股票代號、名稱或指標"
              value={symbol}
            />
          </form>
          <button className="sync-button" disabled={loading || marketLoading || geopoliticsLoading} onClick={() => void Promise.all([fetchQuote(), fetchMarketSummary(), fetchGeopolitics()])} type="button">
            {loading || marketLoading || geopoliticsLoading ? "同步中" : "同步資料"}
          </button>
        </header>

        {(error || analysisError) && (
          <div className="notice-strip">
            {error}
            {analysisError}
          </div>
        )}

        <PageTitle page={activePageMeta} />

        {activePage === "overview" ? (
          <section className="top-metrics" aria-label="市場總覽指標" onClick={openZoomedCard}>
            {topCards.map((card) => (
              <article className="metric-card" key={card.label}>
                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.detail}</p>
                </div>
                <StatusPill tone={card.tone}>{card.source}</StatusPill>
              </article>
            ))}
          </section>
        ) : null}

        <section className={`dashboard-layout page-${activePage}`} onClick={openZoomedCard}>
          {renderPage()}
        </section>
      </section>

      {zoomedCard ? (
        <div
          className="card-zoom-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setZoomedCard(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-zoom-title"
        >
          <section className={`card-zoom-modal ${zoomedCard.sourceClass.includes("metric-card") ? "metric-source" : "panel-source"}`}>
            <header className="card-zoom-toolbar">
              <div>
                <span>{"\u653e\u5927\u6aa2\u8996"}</span>
                <strong id="card-zoom-title">{zoomedCard.title}</strong>
              </div>
              <button data-no-card-zoom="true" onClick={() => setZoomedCard(null)} type="button">
                {"\u95dc\u9589"}
              </button>
            </header>
            <div className="card-zoom-content" dangerouslySetInnerHTML={{ __html: zoomedCard.markup }} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
