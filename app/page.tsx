"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { getStockAnalysis } from "./services/analysis.service";
import { authenticateByPhone } from "./services/auth.service";
import { getGeopoliticalSituation, getMarketSummary } from "./services/market.service";
import { getBatchCachedQuotes, getCachedQuote, getStockContext } from "./services/stock.service";
import {
  pullCloudSnapshot as pullCloudSnapshotRequest,
  pushCloudSnapshot as pushCloudSnapshotRequest,
  runWatchlistScan,
} from "./services/watchlist.service";

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

type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
};

type MarketContext = {
  quote: Quote;
  technical: {
    ma5: number | null;
    ma20: number | null;
    ma60: number | null;
    latestClose: number | null;
    latestDate: string | null;
    pattern: string;
    candles: Candle[];
    source: string;
  };
  revenue: {
    available: boolean;
    companyName: string | null;
    dataMonth: string | null;
    monthlyRevenue: number | null;
    momChangePercent: number | null;
    yoyChangePercent: number | null;
    source: string;
  };
  institutional: {
    available: boolean;
    source: string;
    note: string;
  };
  news: { title: string; url: string; date: string; source: string }[];
  generatedAt: string;
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

type MarketIndex = {
  name: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
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

type OfficialMarketSummary = {
  indices: {
    twse: MarketIndex;
    tpex: MarketIndex;
  };
  globalMarkets: MarketIndex[];
  macroFactors: { name: string; value: number | null; unit: string; period: string | null; source: string }[];
  breadth: { up: number; down: number; flat: number; total: number; score: number; source: string };
  institutional: {
    foreign: number | null;
    investmentTrust: number | null;
    dealer: number | null;
    total: number | null;
    date: string | null;
    source: string;
  };
  rankings: {
    gainers: RankingItem[];
    losers: RankingItem[];
    volume: RankingItem[];
  };
  industryRotation: {
    name: string;
    symbols: string[];
    averageChangePercent: number | null;
    upCount: number;
    downCount: number;
    totalMatched: number;
    score: number;
    leaders: RankingItem[];
    source: string;
  }[];
  generatedAt: string;
};

type GeopoliticalSituation = {
  riskScore: number;
  stance: string;
  events: {
    id: string;
    title: string;
    url: string;
    domain: string;
    publishedAt: string | null;
    severity: "high" | "medium" | "low";
    theme: string;
    marketImpact: string;
  }[];
  hotspots: { name: string; count: number; severity: "high" | "medium" | "low" }[];
  generatedAt: string;
  source: string;
};

type WatchItem = {
  symbol: string;
  name: string;
  theme: string;
};

type PageKey = "overview" | "market" | "quote" | "watchlist" | "ai" | "alerts" | "settings";

type AlertSettings = {
  upPercent: number;
  downPercent: number;
  riskScore: number;
};

type ContextResponse = { ok: true; context: MarketContext } | { ok: false; error: string; code?: string };
type MarketSummaryResponse = { ok: true; summary: OfficialMarketSummary } | { ok: false; error: string; code?: string };
type GeopoliticsResponse = { ok: true; situation: GeopoliticalSituation } | { ok: false; error: string; code?: string };
type AnalyzeResponse =
  | { ok: true; quote: Quote; context: MarketContext; analysis: Analysis; model: string; generatedAt: string }
  | { ok: false; error: string; code?: string };

const watchlistStorageKey = "la1-saved-watchlist";
const authStorageKey = "la1-auth";
const userStorageKey = "la1-user-id";

const defaultWatchlist: WatchItem[] = [
  { symbol: "2330", name: "台積電", theme: "晶圓代工 / AI 算力" },
  { symbol: "2317", name: "鴻海", theme: "AI 伺服器 / 電動車" },
  { symbol: "2382", name: "廣達", theme: "AI 伺服器 ODM" },
  { symbol: "3231", name: "緯創", theme: "AI 伺服器供應鏈" },
  { symbol: "2308", name: "台達電", theme: "電源 / 散熱 / 工控" },
];

const pages: { key: PageKey; label: string; hint: string }[] = [
  { key: "overview", label: "總覽", hint: "市場戰情" },
  { key: "market", label: "市場", hint: "大盤脈動" },
  { key: "quote", label: "個股", hint: "報價與K線" },
  { key: "watchlist", label: "自選", hint: "持續監控" },
  { key: "ai", label: "智能", hint: "分析結論" },
  { key: "alerts", label: "警報", hint: "漲跌提醒" },
  { key: "settings", label: "設定", hint: "同步與帳戶" },
];

function normalizeWatchItems(value: unknown): WatchItem[] {
  if (!Array.isArray(value)) return defaultWatchlist;
  const normalized = value
    .map((item) => {
      const record = item as Partial<WatchItem>;
      const symbol = typeof record.symbol === "string" ? record.symbol.replace(/\D/g, "").slice(0, 6) : "";
      if (!symbol) return null;
      return {
        symbol,
        name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : "自選股",
        theme: typeof record.theme === "string" && record.theme.trim() ? record.theme.trim() : "觀察名單",
      };
    })
    .filter((item): item is WatchItem => Boolean(item));
  return normalized.length ? normalized : defaultWatchlist;
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function formatInteger(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${formatNumber(value, 1)} 億`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "尚未更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toneClass(value: number | null | undefined) {
  if (typeof value !== "number") return "neutral";
  return value > 0 ? "up" : value < 0 ? "down" : "neutral";
}

function marketDirection(score: number) {
  if (score >= 64) return "偏多";
  if (score <= 42) return "偏空";
  return "中性";
}

function riskLabel(score: number) {
  if (score >= 70) return "高";
  if (score >= 48) return "中";
  return "低";
}

function buildMarketScore(summary: OfficialMarketSummary | null, geo: GeopoliticalSituation | null, quote: Quote | null) {
  const breadthScore = summary?.breadth.score ?? 50;
  const institution = summary?.institutional.total ?? 0;
  const institutionScore = clamp(50 + institution / 35, 20, 80);
  const quoteScore = clamp(50 + (quote?.changePercent ?? 0) * 4, 20, 80);
  const geoPenalty = geo ? Math.max(0, geo.riskScore - 50) * 0.22 : 0;
  return Math.round(clamp(breadthScore * 0.48 + institutionScore * 0.28 + quoteScore * 0.24 - geoPenalty, 0, 100));
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "up" | "down" | "neutral" | "warn";
}) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const rotation = -120 + (clamp(value, 0, 100) / 100) * 240;
  return (
    <div className="gauge" aria-label={`戰情指數 ${value}`}>
      <div className="gauge-arc" />
      <div className="gauge-needle" style={{ transform: `rotate(${rotation}deg)` }} />
      <div className="gauge-center" />
      <strong>{value}</strong>
      <span>戰情指數</span>
    </div>
  );
}

function Sparkline({ values }: { values: (number | null | undefined)[] }) {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (clean.length < 2) return <div className="empty-chart">資料不足</div>;
  const width = 360;
  const height = 110;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = Math.max(max - min, 1);
  const points = clean
    .map((value, index) => {
      const x = (index / Math.max(clean.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="走勢圖">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function KLineChart({ candles }: { candles: Candle[] }) {
  const ordered = [...candles].reverse().slice(-45);
  if (!ordered.length) return <div className="empty-chart large">尚未取得 K 線資料</div>;

  const width = 760;
  const height = 260;
  const pad = { top: 16, right: 32, bottom: 24, left: 26 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const max = Math.max(...ordered.map((item) => item.high));
  const min = Math.min(...ordered.map((item) => item.low));
  const range = Math.max(max - min, 1);
  const step = chartWidth / Math.max(ordered.length, 1);
  const bodyWidth = Math.max(5, Math.min(13, step * 0.58));
  const y = (price: number) => pad.top + ((max - price) / range) * chartHeight;

  return (
    <svg className="kline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="K線圖">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + chartHeight * ratio}
          y2={pad.top + chartHeight * ratio}
        />
      ))}
      {ordered.map((candle, index) => {
        const x = pad.left + index * step + step / 2;
        const isUp = candle.close >= candle.open;
        const top = y(Math.max(candle.open, candle.close));
        const bottom = y(Math.min(candle.open, candle.close));
        return (
          <g key={`${candle.date}-${index}`} className={isUp ? "candle up" : "candle down"}>
            <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} />
            <rect x={x - bodyWidth / 2} y={top} width={bodyWidth} height={Math.max(bottom - top, 2)} rx="1.5" />
          </g>
        );
      })}
    </svg>
  );
}

function AuthGate({
  mode,
  phone,
  name,
  busy,
  message,
  onMode,
  onPhone,
  onName,
  onSubmit,
}: {
  mode: "login" | "register";
  phone: string;
  name: string;
  busy: boolean;
  message: string;
  onMode: (mode: "login" | "register") => void;
  onPhone: (value: string) => void;
  onName: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="brand-mark">LA1 台股分析室</span>
        <h1>手機號註冊</h1>
        <p>用手機號建立簡易帳戶，不做簡訊驗證。登入後保留自選股、警報與筆記同步入口。</p>
        <form onSubmit={onSubmit}>
          <div className="segmented">
            <button className={mode === "login" ? "active" : ""} onClick={() => onMode("login")} type="button">
              登入
            </button>
            <button className={mode === "register" ? "active" : ""} onClick={() => onMode("register")} type="button">
              註冊
            </button>
          </div>
          <label>
            手機號碼
            <input inputMode="tel" onChange={(event) => onPhone(event.target.value)} placeholder="0912345678" value={phone} />
          </label>
          {mode === "register" ? (
            <label>
              顯示名稱
              <input onChange={(event) => onName(event.target.value)} placeholder="LA1 用戶" value={name} />
            </label>
          ) : null}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "處理中" : mode === "login" ? "登入" : "建立帳戶"}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [symbol, setSymbol] = useState("2330");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [context, setContext] = useState<MarketContext | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<{ model: string; generatedAt: string } | null>(null);
  const [marketSummary, setMarketSummary] = useState<OfficialMarketSummary | null>(null);
  const [geopolitics, setGeopolitics] = useState<GeopoliticalSituation | null>(null);
  const [watchItems, setWatchItems] = useState<WatchItem[]>(defaultWatchlist);
  const [watchQuotes, setWatchQuotes] = useState<Record<string, Quote>>({});
  const [newWatchSymbol, setNewWatchSymbol] = useState("");
  const [newWatchName, setNewWatchName] = useState("");
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({ upPercent: 3, downPercent: 3, riskScore: 65 });
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [watchStatus, setWatchStatus] = useState("30 秒更新");
  const [statusMessage, setStatusMessage] = useState("尚未同步");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authPhone, setAuthPhone] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [userId, setUserId] = useState("demo-user");

  const marketScore = buildMarketScore(marketSummary, geopolitics, quote);
  const riskScore = Math.round(clamp((geopolitics?.riskScore ?? 42) * 0.62 + (100 - marketScore) * 0.38, 0, 100));
  const currentPrice = quote?.price ?? context?.technical.latestClose ?? null;
  const latestCandles = context?.technical.candles ?? [];
  const watchRows = useMemo(
    () =>
      watchItems.map((item) => {
        const live = watchQuotes[item.symbol] ?? (quote?.symbol === item.symbol ? quote : null);
        const changePercent = live?.changePercent ?? null;
        const alert =
          typeof changePercent === "number" &&
          (changePercent >= alertSettings.upPercent || changePercent <= -alertSettings.downPercent);
        return {
          ...item,
          live,
          changePercent,
          alert,
        };
      }),
    [alertSettings.downPercent, alertSettings.upPercent, quote, watchItems, watchQuotes],
  );

  const topAlerts = watchRows.filter((row) => row.alert);

  const fetchMarket = useCallback(async () => {
    setMarketLoading(true);
    try {
      const [{ payload: marketPayload }, { payload: geoPayload }] = await Promise.all([
        getMarketSummary<MarketSummaryResponse>(),
        getGeopoliticalSituation<GeopoliticsResponse>(),
      ]);
      if (marketPayload?.ok) setMarketSummary(marketPayload.summary);
      if (geoPayload?.ok) setGeopolitics(geoPayload.situation);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const fetchQuote = useCallback(async (target = symbol) => {
    const clean = target.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;
    setSymbol(clean);
    setLoading(true);
    try {
      const { payload } = await getStockContext<ContextResponse>(clean);
      if (payload?.ok) {
        setContext(payload.context);
        setQuote(payload.context.quote);
        setAnalysis(null);
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const fetchAnalysis = useCallback(async () => {
    const clean = (quote?.symbol ?? symbol).replace(/\D/g, "").slice(0, 6);
    if (!clean) return;
    setAnalysisLoading(true);
    try {
      const { payload } = await getStockAnalysis<AnalyzeResponse>(clean);
      if (payload?.ok) {
        setQuote(payload.quote);
        setContext(payload.context);
        setAnalysis(payload.analysis);
        setAnalysisMeta({ model: payload.model, generatedAt: payload.generatedAt });
      }
    } finally {
      setAnalysisLoading(false);
    }
  }, [quote?.symbol, symbol]);

  const fetchWatchQuotes = useCallback(async () => {
    const symbols = watchItems.map((item) => item.symbol).slice(0, 20);
    if (!symbols.length) return;
    try {
      const { payload } = await getBatchCachedQuotes<{
        ok: true;
        quotes: { symbol: string; ok: boolean; quote?: Quote }[];
      }>(symbols, 30_000);
      if (payload?.ok) {
        const next: Record<string, Quote> = {};
        payload.quotes.forEach((item) => {
          if (item.ok && item.quote) next[item.symbol] = item.quote;
        });
        setWatchQuotes(next);
        setWatchStatus(`已更新 ${new Date().toLocaleTimeString("zh-TW", { hour12: false })}`);
      }
    } catch {
      setWatchStatus("更新失敗");
    }
  }, [watchItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedAuth = window.localStorage.getItem(authStorageKey);
      const storedUserId = window.localStorage.getItem(userStorageKey);
      const storedWatchlist = window.localStorage.getItem(watchlistStorageKey);
      const storedAlerts = window.localStorage.getItem("la1-alert-settings");
      if (storedUserId) setUserId(storedUserId);
      if (storedAuth === "signed-in") setIsSignedIn(true);
      if (storedWatchlist) setWatchItems(normalizeWatchItems(JSON.parse(storedWatchlist)));
      if (storedAlerts) setAlertSettings((current) => ({ ...current, ...JSON.parse(storedAlerts) }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    const timer = window.setTimeout(() => {
      void fetchMarket();
      void fetchQuote(symbol);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMarket, fetchQuote, isSignedIn, symbol]);

  useEffect(() => {
    if (!isSignedIn) return;
    const firstRun = window.setTimeout(() => void fetchWatchQuotes(), 0);
    const timer = window.setInterval(() => void fetchWatchQuotes(), 30_000);
    return () => {
      window.clearTimeout(firstRun);
      window.clearInterval(timer);
    };
  }, [fetchWatchQuotes, isSignedIn]);

  useEffect(() => {
    window.localStorage.setItem(watchlistStorageKey, JSON.stringify(watchItems));
  }, [watchItems]);

  useEffect(() => {
    window.localStorage.setItem("la1-alert-settings", JSON.stringify(alertSettings));
  }, [alertSettings]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phone = authPhone.replace(/\D/g, "");
    if (phone.length < 8) {
      setAuthMessage("請輸入正確手機號碼");
      return;
    }
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const { response, payload } = await authenticateByPhone<{
        ok: boolean;
        user?: { id: string; name: string };
        error?: string;
      }>({ mode: authMode, phone, name: authName || "LA1 用戶" });
      if (!response.ok || !payload?.ok || !payload.user) {
        setAuthMessage(payload?.error ?? "登入失敗");
        return;
      }
      setUserId(payload.user.id);
      setIsSignedIn(true);
      window.localStorage.setItem(authStorageKey, "signed-in");
      window.localStorage.setItem(userStorageKey, payload.user.id);
    } finally {
      setAuthBusy(false);
    }
  }

  async function addWatchItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = newWatchSymbol.replace(/\D/g, "").slice(0, 6);
    if (!clean || watchItems.some((item) => item.symbol === clean)) return;
    let name = newWatchName.trim();
    try {
      const { payload } = await getCachedQuote<{ ok: true; quote: Quote } | { ok: false; error: string }>(clean);
      if (payload?.ok) name = payload.quote.name || name || clean;
    } catch {
      name = name || clean;
    }
    setWatchItems((current) => [...current, { symbol: clean, name: name || clean, theme: "手動新增" }]);
    setNewWatchSymbol("");
    setNewWatchName("");
    void fetchQuote(clean);
  }

  function removeWatchItem(symbolToRemove: string) {
    setWatchItems((current) => current.filter((item) => item.symbol !== symbolToRemove));
    setWatchQuotes((current) => {
      const next = { ...current };
      delete next[symbolToRemove];
      return next;
    });
  }

  async function pushCloudSnapshot() {
    const { response } = await pushCloudSnapshotRequest(userId, {
      watchlist: watchItems,
      notes: [],
      alertSettings,
      readNotificationIds: [],
    });
    setStatusMessage(response.ok ? "已同步到雲端" : "同步失敗");
  }

  async function pullCloudSnapshot() {
    const { response, payload } = await pullCloudSnapshotRequest<{
      ok: boolean;
      snapshot?: { watchlist?: unknown; alertSettings?: Partial<AlertSettings> };
    }>(userId);
    if (response.ok && payload?.ok && payload.snapshot) {
      setWatchItems(normalizeWatchItems(payload.snapshot.watchlist));
      setAlertSettings((current) => ({ ...current, ...(payload.snapshot?.alertSettings ?? {}) }));
      setStatusMessage("已讀取雲端資料");
    } else {
      setStatusMessage("讀取失敗");
    }
  }

  async function runScan() {
    const { response } = await runWatchlistScan(userId, {
      symbols: watchItems.map((item) => item.symbol),
      alertSettings,
    });
    setStatusMessage(response.ok ? "已完成自選掃描" : "掃描失敗");
  }

  if (!isSignedIn) {
    return (
      <AuthGate
        busy={authBusy}
        message={authMessage}
        mode={authMode}
        name={authName}
        phone={authPhone}
        onMode={setAuthMode}
        onName={setAuthName}
        onPhone={setAuthPhone}
        onSubmit={submitAuth}
      />
    );
  }

  const page = pages.find((item) => item.key === activePage) ?? pages[0];

  return (
    <main className="la1-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>LA1 台股分析室</strong>
          <span>台股戰情系統</span>
        </div>
        <nav>
          {pages.map((item, index) => (
            <button className={activePage === item.key ? "active" : ""} key={item.key} onClick={() => setActivePage(item.key)} type="button">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span>系統狀態</span>
          <strong>API 已接入</strong>
          <small>{watchStatus}</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="status-line">
            <span className="live-dot" />
            <div>
              <strong>{page.label}</strong>
              <small>資料時間 {formatTime(marketSummary?.generatedAt ?? quote?.updatedAt)}</small>
            </div>
          </div>
          <form className="search-box" onSubmit={(event) => { event.preventDefault(); void fetchQuote(symbol); setActivePage("quote"); }}>
            <input inputMode="numeric" onChange={(event) => setSymbol(event.target.value.replace(/\D/g, "").slice(0, 6))} value={symbol} />
            <button disabled={loading} type="submit">{loading ? "查詢中" : "查詢"}</button>
          </form>
          <button className="ghost-button" disabled={marketLoading || loading} onClick={() => void Promise.all([fetchMarket(), fetchQuote(symbol)])} type="button">
            更新資料
          </button>
        </header>

        {activePage === "overview" ? (
          <section className="dashboard overview-grid">
            <div className="hero">
              <div>
                <span className="hero-kicker">盤勢總覽</span>
                <h1>市場戰情指數 {marketScore}</h1>
                <p>
                  目前方向：{marketDirection(marketScore)}。風險等級：{riskLabel(riskScore)}。首頁只放決策摘要，細節進各功能頁查看。
                </p>
              </div>
              <button onClick={() => setActivePage("ai")} type="button">進入智能分析</button>
            </div>
            <Panel className="score-panel" title="市場總覽" eyebrow="大盤狀態">
              <Gauge value={marketScore} />
              <div className="metric-grid two">
                <Metric label="加權指數" value={formatNumber(marketSummary?.indices.twse.value, 2)} detail={formatPercent(marketSummary?.indices.twse.changePercent)} tone={toneClass(marketSummary?.indices.twse.changePercent)} />
                <Metric label="櫃買指數" value={formatNumber(marketSummary?.indices.tpex.value, 2)} detail={formatPercent(marketSummary?.indices.tpex.changePercent)} tone={toneClass(marketSummary?.indices.tpex.changePercent)} />
              </div>
            </Panel>
            <Panel className="trend-panel" title="大盤趨勢" eyebrow="即時走勢">
              <Sparkline values={[marketSummary?.indices.twse.value, ...(latestCandles.map((item) => item.close))]} />
              <div className="metric-grid four">
                <Metric label="開" value={formatNumber(quote?.openPrice, 2)} />
                <Metric label="高" value={formatNumber(quote?.highPrice, 2)} />
                <Metric label="低" value={formatNumber(quote?.lowPrice, 2)} />
                <Metric label="收" value={formatNumber(currentPrice, 2)} />
              </div>
            </Panel>
            <Panel title="資金流向" eyebrow="法人">
              <div className="flow-list">
                <Metric label="外資" value={formatMoney(marketSummary?.institutional.foreign)} tone={toneClass(marketSummary?.institutional.foreign)} />
                <Metric label="投信" value={formatMoney(marketSummary?.institutional.investmentTrust)} tone={toneClass(marketSummary?.institutional.investmentTrust)} />
                <Metric label="自營商" value={formatMoney(marketSummary?.institutional.dealer)} tone={toneClass(marketSummary?.institutional.dealer)} />
                <Metric label="合計" value={formatMoney(marketSummary?.institutional.total)} tone={toneClass(marketSummary?.institutional.total)} />
              </div>
            </Panel>
            <Panel title="市場廣度" eyebrow="家數結構">
              <div className="metric-grid three">
                <Metric label="上漲" value={formatInteger(marketSummary?.breadth.up)} tone="up" />
                <Metric label="下跌" value={formatInteger(marketSummary?.breadth.down)} tone="down" />
                <Metric label="平盤" value={formatInteger(marketSummary?.breadth.flat)} />
              </div>
            </Panel>
            <Panel title="產業輪動" eyebrow="強度排序">
              <div className="compact-list">
                {(marketSummary?.industryRotation ?? []).slice(0, 6).map((item) => (
                  <div className="bar-row" key={item.name}>
                    <span>{item.name}</span>
                    <div><i style={{ width: `${clamp(item.score, 5, 100)}%` }} /></div>
                    <b className={toneClass(item.averageChangePercent)}>{formatPercent(item.averageChangePercent)}</b>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="強勢股" eyebrow="漲幅排行">
              <StockList items={(marketSummary?.rankings.gainers ?? []).slice(0, 5)} onPick={(next) => void fetchQuote(next)} />
            </Panel>
            <Panel title="弱勢股" eyebrow="跌幅排行">
              <StockList items={(marketSummary?.rankings.losers ?? []).slice(0, 5)} onPick={(next) => void fetchQuote(next)} />
            </Panel>
          </section>
        ) : null}

        {activePage === "market" ? (
          <section className="dashboard market-grid">
            <Panel className="wide-panel" title="市場脈動" eyebrow="大盤 / 櫃買 / 廣度">
              <div className="metric-grid five">
                <Metric label="加權" value={formatNumber(marketSummary?.indices.twse.value, 2)} detail={formatPercent(marketSummary?.indices.twse.changePercent)} tone={toneClass(marketSummary?.indices.twse.changePercent)} />
                <Metric label="櫃買" value={formatNumber(marketSummary?.indices.tpex.value, 2)} detail={formatPercent(marketSummary?.indices.tpex.changePercent)} tone={toneClass(marketSummary?.indices.tpex.changePercent)} />
                <Metric label="廣度分數" value={`${marketSummary?.breadth.score ?? "--"}/100`} />
                <Metric label="法人合計" value={formatMoney(marketSummary?.institutional.total)} tone={toneClass(marketSummary?.institutional.total)} />
                <Metric label="國際風險" value={`${geopolitics?.riskScore ?? "--"}/100`} />
              </div>
              <Sparkline values={(marketSummary?.globalMarkets ?? []).map((item) => item.changePercent)} />
            </Panel>
            <Panel title="全球市場" eyebrow="外部因子">
              <div className="market-strip">
                {(marketSummary?.globalMarkets ?? []).slice(0, 8).map((item) => (
                  <Metric key={item.name} label={item.name} value={formatNumber(item.value, 2)} detail={formatPercent(item.changePercent)} tone={toneClass(item.changePercent)} />
                ))}
              </div>
            </Panel>
            <Panel title="國際局勢" eyebrow="World Monitor">
              <div className="compact-list">
                {(geopolitics?.events ?? []).slice(0, 5).map((event) => (
                  <a href={event.url} key={event.id} rel="noreferrer" target="_blank">
                    <b>{event.title}</b>
                    <span>{event.marketImpact}</span>
                  </a>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activePage === "quote" ? (
          <section className="dashboard quote-grid">
            <Panel className="quote-card" title={`即時報價 ${quote?.symbol ?? symbol}`} eyebrow={quote?.source ?? "Fugle"}>
              <div className={`quote-price ${toneClass(quote?.changePercent)}`}>
                <strong>{formatNumber(currentPrice, 2)}</strong>
                <span>{formatNumber(quote?.change, 2)} / {formatPercent(quote?.changePercent)}</span>
              </div>
              <div className="metric-grid four">
                <Metric label="開盤" value={formatNumber(quote?.openPrice, 2)} />
                <Metric label="最高" value={formatNumber(quote?.highPrice, 2)} />
                <Metric label="最低" value={formatNumber(quote?.lowPrice, 2)} />
                <Metric label="成交量" value={`${formatInteger(quote?.volume)} 張`} />
              </div>
            </Panel>
            <Panel className="chart-panel" title="K 線圖" eyebrow={context?.technical.source ?? "TWSE"}>
              <KLineChart candles={latestCandles} />
              <div className="metric-grid three">
                <Metric label="MA5" value={formatNumber(context?.technical.ma5, 2)} />
                <Metric label="MA20" value={formatNumber(context?.technical.ma20, 2)} />
                <Metric label="MA60" value={formatNumber(context?.technical.ma60, 2)} />
              </div>
            </Panel>
            <Panel title="個股資料" eyebrow="營收 / 新聞">
              <div className="compact-list">
                <Metric label="公司名稱" value={context?.revenue.companyName ?? quote?.name ?? "--"} />
                <Metric label="月營收年增" value={formatPercent(context?.revenue.yoyChangePercent)} tone={toneClass(context?.revenue.yoyChangePercent)} />
                {(context?.news ?? []).slice(0, 4).map((item) => (
                  <a href={item.url} key={item.url} rel="noreferrer" target="_blank">
                    <b>{item.title}</b>
                    <span>{item.source} / {item.date}</span>
                  </a>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activePage === "watchlist" ? (
          <section className="dashboard watch-grid">
            <Panel className="wide-panel" title="自選股監控" eyebrow={watchStatus}>
              <form className="watch-form" onSubmit={addWatchItem}>
                <input inputMode="numeric" onChange={(event) => setNewWatchSymbol(event.target.value)} placeholder="代號" value={newWatchSymbol} />
                <input onChange={(event) => setNewWatchName(event.target.value)} placeholder="公司名稱，可留空自動帶入" value={newWatchName} />
                <button type="submit">加入</button>
              </form>
              <div className="watch-table">
                {watchRows.map((item) => (
                  <div className={item.alert ? "watch-row alert" : "watch-row"} key={item.symbol}>
                    <button onClick={() => { void fetchQuote(item.symbol); setActivePage("quote"); }} type="button">
                      <b>{item.symbol}</b>
                      <strong>{item.live?.name ?? item.name}</strong>
                      <span>{formatNumber(item.live?.price, 2)}</span>
                      <em className={toneClass(item.changePercent)}>{formatPercent(item.changePercent)}</em>
                    </button>
                    <small>{item.theme}</small>
                    <button className="danger-button" onClick={() => removeWatchItem(item.symbol)} type="button">刪除</button>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activePage === "ai" ? (
          <section className="dashboard ai-grid">
            <Panel className="wide-panel" title="智能分析" eyebrow={analysisMeta ? `更新 ${formatTime(analysisMeta.generatedAt)}` : "OpenAI"}>
              <button className="primary-button inline" disabled={analysisLoading || !quote} onClick={() => void fetchAnalysis()} type="button">
                {analysisLoading ? "分析中" : "產生個股分析"}
              </button>
              {analysis ? (
                <div className="briefing">
                  <h3>{analysis.stance} / {analysis.conclusion}</h3>
                  <div>
                    <strong>核心依據</strong>
                    <ul>{analysis.facts.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div className="scenario-grid">
                    <Metric label="偏多情境" value={analysis.scenarios.bullish} tone="up" />
                    <Metric label="中性情境" value={analysis.scenarios.neutral} />
                    <Metric label="偏空情境" value={analysis.scenarios.bearish} tone="down" />
                  </div>
                  <div>
                    <strong>風險與觀察</strong>
                    <ul>{[...analysis.risks, ...analysis.nextChecks].map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              ) : (
                <div className="empty-state">先查詢股票，再產生 AI 分析。</div>
              )}
            </Panel>
          </section>
        ) : null}

        {activePage === "alerts" ? (
          <section className="dashboard settings-grid">
            <Panel title="漲跌警報" eyebrow={`${topAlerts.length} 檔觸發`}>
              <label className="setting-row">
                上漲警報 %
                <input type="number" value={alertSettings.upPercent} onChange={(event) => setAlertSettings((current) => ({ ...current, upPercent: Number(event.target.value) }))} />
              </label>
              <label className="setting-row">
                下跌警報 %
                <input type="number" value={alertSettings.downPercent} onChange={(event) => setAlertSettings((current) => ({ ...current, downPercent: Number(event.target.value) }))} />
              </label>
              <label className="setting-row">
                風險警戒分數
                <input type="number" value={alertSettings.riskScore} onChange={(event) => setAlertSettings((current) => ({ ...current, riskScore: Number(event.target.value) }))} />
              </label>
            </Panel>
            <Panel title="目前觸發" eyebrow="自選股">
              <div className="compact-list">
                {topAlerts.length ? topAlerts.map((item) => (
                  <button key={item.symbol} onClick={() => { void fetchQuote(item.symbol); setActivePage("quote"); }} type="button">
                    <b>{item.symbol} {item.live?.name ?? item.name}</b>
                    <span>{formatPercent(item.changePercent)}</span>
                  </button>
                )) : <div className="empty-state">目前沒有觸發警報。</div>}
              </div>
            </Panel>
          </section>
        ) : null}

        {activePage === "settings" ? (
          <section className="dashboard settings-grid">
            <Panel title="同步資料" eyebrow={statusMessage}>
              <div className="button-row">
                <button onClick={() => void pushCloudSnapshot()} type="button">上傳自選與警報</button>
                <button onClick={() => void pullCloudSnapshot()} type="button">讀取雲端資料</button>
                <button onClick={() => void runScan()} type="button">掃描自選股</button>
              </div>
              <Metric label="使用者" value={userId} detail="手機號簡易登入" />
            </Panel>
            <Panel title="資料來源" eyebrow="保持現有 API">
              <div className="source-list">
                <span>Fugle 即時報價</span>
                <span>TWSE / TPEx 市場資料</span>
                <span>Yahoo Finance 國際市場</span>
                <span>OpenAI 智能分析</span>
                <span>Postgres / JSON 同步備援</span>
              </div>
            </Panel>
          </section>
        ) : null}
      </section>

      <nav className="mobile-nav">
        {pages.slice(0, 5).map((item) => (
          <button className={activePage === item.key ? "active" : ""} key={item.key} onClick={() => setActivePage(item.key)} type="button">
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function StockList({ items, onPick }: { items: RankingItem[]; onPick: (symbol: string) => void }) {
  if (!items.length) return <div className="empty-state">資料同步後顯示。</div>;
  return (
    <div className="stock-list">
      {items.map((item) => (
        <button key={`${item.market}-${item.symbol}`} onClick={() => onPick(item.symbol)} type="button">
          <b>{item.symbol}</b>
          <span>{item.name}</span>
          <strong>{formatNumber(item.close, 2)}</strong>
          <em className={toneClass(item.changePercent)}>{formatPercent(item.changePercent)}</em>
        </button>
      ))}
    </div>
  );
}
