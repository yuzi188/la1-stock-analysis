export type MarketQuote = {
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

export type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
};

export type TechnicalContext = {
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  latestClose: number | null;
  latestDate: string | null;
  pattern: string;
  candles: Candle[];
  source: string;
};

export type RevenueContext = {
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

export type InstitutionalContext = {
  available: boolean;
  source: string;
  note: string;
};

export type NewsContext = {
  title: string;
  url: string;
  date: string;
  source: string;
};

export type MarketContext = {
  quote: MarketQuote;
  technical: TechnicalContext;
  revenue: RevenueContext;
  institutional: InstitutionalContext;
  news: NewsContext[];
  generatedAt: string;
};

export type MarketIndexContext = {
  name: string;
  value: number | null;
  change: number | null;
  changePercent: number | null;
  date: string | null;
  source: string;
};

export type MarketBreadthContext = {
  up: number;
  down: number;
  flat: number;
  total: number;
  score: number;
  source: string;
};

export type InstitutionalFlowContext = {
  foreign: number | null;
  investmentTrust: number | null;
  dealer: number | null;
  total: number | null;
  date: string | null;
  source: string;
};

export type RankingItem = {
  symbol: string;
  name: string;
  market: "TWSE" | "TPEx";
  close: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
};

export type MacroFactorContext = {
  name: string;
  value: number | null;
  unit: string;
  period: string | null;
  source: string;
};

export type OfficialMarketSummary = {
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
  generatedAt: string;
};

export type GeopoliticalEvent = {
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

export type GeopoliticalHotspot = {
  name: string;
  count: number;
  severity: "high" | "medium" | "low";
};

export type WorldMonitorStatus = {
  configured: boolean;
  status: "ready" | "needs_key";
  dashboardUrl: string;
  repositoryUrl: string;
  apiBaseUrl: string;
  mcpUrl: string;
  note: string;
};

export type GeopoliticalSituation = {
  riskScore: number;
  stance: string;
  events: GeopoliticalEvent[];
  hotspots: GeopoliticalHotspot[];
  worldMonitor: WorldMonitorStatus;
  generatedAt: string;
  source: string;
};

type FugleQuote = {
  symbol?: string;
  name?: string;
  lastPrice?: number;
  closePrice?: number;
  change?: number;
  changePercent?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  bids?: { price: number; size: number }[];
  asks?: { price: number; size: number }[];
  total?: { tradeVolume?: number };
  lastUpdated?: number;
};

type FugleCandlesResponse = {
  data?: Candle[];
};

type RevenueRow = Record<string, string>;

type NewsRow = {
  Title?: string;
  Url?: string;
  Date?: string;
};

type TwseStockDayRow = {
  Date?: string;
  Code?: string;
  Name?: string;
  ClosingPrice?: string;
  Change?: string;
  TradeVolume?: string;
};

type TpexCloseRow = {
  Date?: string;
  SecuritiesCompanyCode?: string;
  CompanyName?: string;
  Close?: string;
  Change?: string;
  TradingShares?: string;
};

type TpexIndexRow = {
  Date?: string;
  Close?: string;
  Change?: string;
};

type YahooChartResponse = {
  chart?: {
    result?: {
      meta?: {
        chartPreviousClose?: number;
        regularMarketPrice?: number;
        regularMarketTime?: number;
      };
    }[];
  };
};

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  tone?: number | string;
};

type GdeltDocResponse = {
  articles?: GdeltArticle[];
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = globalThis as typeof globalThis & {
  __stockAgentCache?: Map<string, CacheEntry<unknown>>;
};

const cache = cacheStore.__stockAgentCache ?? new Map<string, CacheEntry<unknown>>();
cacheStore.__stockAgentCache = cache;

async function cached<T>(
  key: string,
  ttlMilliseconds: number,
  loader: () => Promise<T>,
) {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) return existing.value;

  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ttlMilliseconds });
  return value;
}

export function cleanSymbol(value: string | null) {
  return (value ?? "").replace(/\D/g, "").slice(0, 6);
}

function normalizeTime(value?: number) {
  if (!value) return null;
  const milliseconds =
    value > 10_000_000_000_000 ? Math.floor(value / 1000) : value;
  return new Date(milliseconds).toISOString();
}

function formatMinguoMonth(value: string | null) {
  if (!value || value.length < 5) return value;
  const year = Number(value.slice(0, 3)) + 1911;
  const month = value.slice(3).padStart(2, "0");
  return `${year}-${month}`;
}

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function signedChange(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/X|除權|除息|除權息/g, "")
    .trim();
  if (!normalized || normalized === "--") return null;
  const number = Number(normalized.replace(/^\+/, ""));
  return Number.isFinite(number) ? number : null;
}

function percentFromCloseAndChange(close: number | null, change: number | null) {
  if (close === null || change === null) return null;
  const previous = close - change;
  if (!Number.isFinite(previous) || previous === 0) return null;
  return (change / previous) * 100;
}

function isCommonStock(symbol: string) {
  return /^\d{4}$/.test(symbol);
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw Object.assign(new Error(`官方資料暫時無法回應，狀態碼 ${response.status}。`), {
      code: "official_market_error",
      status: response.status,
    });
  }
  return (await response.json()) as T;
}

async function fetchYahooChart(symbol: string, name: string): Promise<MarketIndexContext> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
    {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  if (!response.ok) return emptyIndex(name, "Yahoo Finance chart");

  const payload = (await response.json()) as YahooChartResponse;
  const meta = payload.chart?.result?.[0]?.meta;
  const value = meta?.regularMarketPrice ?? null;
  const previous = meta?.chartPreviousClose ?? null;
  const change = value !== null && previous !== null ? value - previous : null;

  return {
    name,
    value,
    change,
    changePercent: percentFromCloseAndChange(value, change),
    date: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    source: "Yahoo Finance chart endpoint",
  };
}

function normalizeTwseStockRows(rows: TwseStockDayRow[]): RankingItem[] {
  return rows
    .map((row) => {
      const symbol = row.Code ?? "";
      const close = parseNumber(row.ClosingPrice);
      const change = signedChange(row.Change);
      return {
        symbol,
        name: row.Name ?? symbol,
        market: "TWSE" as const,
        close,
        change,
        changePercent: percentFromCloseAndChange(close, change),
        volume: parseNumber(row.TradeVolume),
      };
    })
    .filter((item) => isCommonStock(item.symbol) && item.close !== null);
}

function normalizeTpexCloseRows(rows: TpexCloseRow[]): RankingItem[] {
  return rows
    .map((row) => {
      const symbol = row.SecuritiesCompanyCode ?? "";
      const close = parseNumber(row.Close);
      const change = signedChange(row.Change);
      return {
        symbol,
        name: row.CompanyName ?? symbol,
        market: "TPEx" as const,
        close,
        change,
        changePercent: percentFromCloseAndChange(close, change),
        volume: parseNumber(row.TradingShares),
      };
    })
    .filter((item) => isCommonStock(item.symbol) && item.close !== null);
}

function buildBreadth(items: RankingItem[]): MarketBreadthContext {
  const up = items.filter((item) => (item.change ?? 0) > 0).length;
  const down = items.filter((item) => (item.change ?? 0) < 0).length;
  const flat = items.filter((item) => (item.change ?? 0) === 0).length;
  const total = up + down + flat;
  const score = total ? Math.round((up / total) * 100) : 0;

  return {
    up,
    down,
    flat,
    total,
    score,
    source: "TWSE STOCK_DAY_ALL + TPEx daily close quotes",
  };
}

function emptyIndex(name: string, source: string): MarketIndexContext {
  return {
    name,
    value: null,
    change: null,
    changePercent: null,
    date: null,
    source,
  };
}

function valueByKey(row: Record<string, unknown>, pattern: RegExp) {
  const entry = Object.entries(row).find(([key]) => pattern.test(key));
  return entry?.[1];
}

function parseTwseIndex(rows: Record<string, unknown>[]): MarketIndexContext {
  const row =
    rows.find((item) => Object.values(item).some((value) => String(value).includes("發行量加權股價指數"))) ??
    rows.find((item) => Object.values(item).some((value) => String(value).includes("加權")));

  if (!row) return emptyIndex("加權指數", "TWSE MI_INDEX");

  const value = parseNumber(valueByKey(row, /收盤/));
  const direction = String(valueByKey(row, /漲跌$/) ?? "");
  const rawChange = parseNumber(valueByKey(row, /點數/));
  const change = rawChange === null ? null : direction.includes("-") ? -Math.abs(rawChange) : rawChange;

  return {
    name: "加權指數",
    value,
    change,
    changePercent: parseNumber(valueByKey(row, /百分比/)),
    date: String(valueByKey(row, /日期/) ?? "") || null,
    source: "TWSE MI_INDEX",
  };
}

function parseTpexIndex(rows: TpexIndexRow[]): MarketIndexContext {
  const row = rows.at(-1);
  if (!row) return emptyIndex("櫃買指數", "TPEx tpex_index");
  const value = parseNumber(row.Close);
  const change = signedChange(row.Change);

  return {
    name: "櫃買指數",
    value,
    change,
    changePercent: percentFromCloseAndChange(value, change),
    date: row.Date ?? null,
    source: "TPEx tpex_index",
  };
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function getStatPointItem(url: string, titlePattern: RegExp): Promise<MacroFactorContext | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;

  const html = await response.text();
  const match = html.match(/id="ContentPlaceHolder1_hidData"[^>]*value="([^"]+)"/);
  if (!match) return null;

  const items = JSON.parse(decodeHtmlEntities(match[1])) as {
    Title?: string;
    Value?: string;
    Remark?: string;
  }[];
  const item = items.find((entry) => titlePattern.test(entry.Title ?? ""));
  if (!item) return null;

  return {
    name: item.Title?.replace(/\(.+\)/, "") ?? "總體指標",
    value: parseNumber(item.Value),
    unit: item.Title?.match(/\(([^)]+)\)/)?.[1] ?? "",
    period: item.Remark ?? null,
    source: "中華民國統計資訊網",
  };
}

function parseTreasuryYield(xml: string): MacroFactorContext | null {
  const entries = [...xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map((match) => match[0]);
  const latest = entries
    .map((entry) => {
      const date = entry.match(/<d:NEW_DATE[^>]*>([^<]+)<\/d:NEW_DATE>/)?.[1] ?? null;
      const value = parseNumber(entry.match(/<d:BC_10YEAR[^>]*>([^<]+)<\/d:BC_10YEAR>/)?.[1]);
      return { date, value };
    })
    .filter((item) => item.value !== null)
    .at(-1);

  if (!latest) return null;

  return {
    name: "美債10年殖利率",
    value: latest.value,
    unit: "%",
    period: latest.date?.slice(0, 10) ?? null,
    source: "U.S. Treasury Daily Treasury Yield Curve Rates",
  };
}

function sumNumberRows(rows: unknown[][], index: number) {
  return rows.reduce((sum, row) => sum + (parseNumber(row[index] as string) ?? 0), 0);
}

function pickTpexInstitutionalValue(row: Record<string, unknown>, patterns: RegExp[]) {
  const entry = Object.entries(row).find(([key]) => patterns.every((pattern) => pattern.test(key)));
  return parseNumber(entry?.[1] as string | undefined);
}

async function getInstitutionalFlow(): Promise<InstitutionalFlowContext> {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index - 1);
    return date.toISOString().slice(0, 10).replace(/-/g, "");
  });

  let twseRows: unknown[][] = [];
  let twseDate: string | null = null;
  for (const date of dates) {
    const params = new URLSearchParams({
      date,
      selectType: "ALLBUT0999",
      response: "json",
    });
    const payload = await fetchJson<{ stat?: string; data?: unknown[][] }>(
      `https://www.twse.com.tw/rwd/zh/fund/T86?${params}`,
    );
    if (payload.stat === "OK" && payload.data?.length) {
      twseRows = payload.data;
      twseDate = date;
      break;
    }
  }

  const tpexRows = await fetchJson<Record<string, unknown>[]>(
    "https://www.tpex.org.tw/openapi/v1/tpex_3insti_daily_trading",
  );
  const tpexDate = String(tpexRows[0]?.Date ?? "") || null;

  const twseTrust = sumNumberRows(twseRows, 10);
  const twseDealer = sumNumberRows(twseRows, 11);
  const twseTotal = sumNumberRows(twseRows, 18);
  const twseForeign = twseTotal - twseTrust - twseDealer;

  const tpexTrust = tpexRows.reduce(
    (sum, row) => sum + (pickTpexInstitutionalValue(row, [/SecuritiesInvestmentTrust/i, /Difference/i]) ?? 0),
    0,
  );
  const tpexDealer = tpexRows.reduce(
    (sum, row) => sum + (pickTpexInstitutionalValue(row, [/Dealers/i, /Difference/i]) ?? 0),
    0,
  );
  const tpexTotal = tpexRows.reduce((sum, row) => sum + (parseNumber(row.TotalDifference as string) ?? 0), 0);
  const tpexForeign = tpexTotal - tpexTrust - tpexDealer;

  return {
    foreign: twseForeign + tpexForeign,
    investmentTrust: twseTrust + tpexTrust,
    dealer: twseDealer + tpexDealer,
    total: twseTotal + tpexTotal,
    date: twseDate ?? tpexDate,
    source: "TWSE T86 + TPEx 3insti daily trading",
  };
}

async function getGlobalMarkets(): Promise<MarketIndexContext[]> {
  const targets = [
    ["^DJI", "Dow Jones"],
    ["^GSPC", "S&P 500"],
    ["^IXIC", "Nasdaq"],
    ["^VIX", "VIX"],
    ["TWD=X", "美元/新台幣"],
    ["^N225", "日經 225"],
    ["^SOX", "費半指數"],
  ] as const;

  return Promise.all(targets.map(([symbol, name]) => fetchYahooChart(symbol, name)));
}

async function getMacroFactors(): Promise<MacroFactorContext[]> {
  const today = new Date();
  const treasuryMonth = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, "0")}`;

  const [unemployment, cpi, treasuryResponse] = await Promise.all([
    getStatPointItem("https://www.stat.gov.tw/Point.aspx?n=3582&sid=t.3&sms=11480", /^失業率\(%\)$/),
    getStatPointItem("https://www.stat.gov.tw/Point.aspx?n=3581&sid=t.2&sms=11480", /^消費者物價指數年增率/),
    fetch(
      `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=${treasuryMonth}`,
      { cache: "no-store" },
    ).catch(() => null),
  ]);

  const treasury =
    treasuryResponse && treasuryResponse.ok ? parseTreasuryYield(await treasuryResponse.text()) : null;

  return [
    unemployment
      ? { ...unemployment, name: "台灣失業率" }
      : { name: "台灣失業率", value: null, unit: "%", period: null, source: "中華民國統計資訊網" },
    cpi
      ? { ...cpi, name: "消費者物價指數年增率" }
      : { name: "消費者物價指數年增率", value: null, unit: "%", period: null, source: "中華民國統計資訊網" },
    treasury ?? {
      name: "美債10年殖利率",
      value: null,
      unit: "%",
      period: null,
      source: "U.S. Treasury Daily Treasury Yield Curve Rates",
    },
  ];
}

const geopoliticalQuery = "war";

function parseGdeltDate(value: string | undefined) {
  if (!value) return null;
  if (/^\d{14}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    const hour = value.slice(8, 10);
    const minute = value.slice(10, 12);
    const second = value.slice(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function classifyGeopoliticalEvent(title: string, tone: number | null) {
  const normalized = title.toLowerCase();
  const hasHighRiskWord = /missile|strike|attack|war|invasion|sanction|explosion|blockade|drone/.test(normalized);
  const hasSupplyChainWord = /taiwan|semiconductor|chip|shipping|red sea|south china sea|hormuz|oil|energy/.test(normalized);
  const severity =
    hasHighRiskWord || (tone !== null && tone <= -6)
      ? "high"
      : hasSupplyChainWord || (tone !== null && tone <= -3)
        ? "medium"
        : "low";
  const theme = hasSupplyChainWord
    ? "\u4f9b\u61c9\u93c8 / \u80fd\u6e90"
    : hasHighRiskWord
      ? "\u5730\u7de3\u885d\u7a81"
      : "\u570b\u969b\u65b0\u805e";
  const marketImpact = hasSupplyChainWord
    ? "\u7559\u610f\u822a\u904b\u3001\u80fd\u6e90\u3001AI \u4f9b\u61c9\u93c8\u8207\u53f0\u80a1\u6b0a\u503c\u80a1\u58d3\u529b"
    : severity === "high"
      ? "\u98a8\u96aa\u5347\u6eab\uff0c\u77ed\u7dda\u9700\u89c0\u5bdf VIX\u3001\u7f8e\u5035\u8207\u7f8e\u5143"
      : "\u8ffd\u8e64\u65b0\u805e\u91cf\u662f\u5426\u653e\u5927\uff0c\u6682\u5217\u89c0\u5bdf";

  return { severity, theme, marketImpact };
}

function inferHotspot(title: string, sourceCountry: string) {
  const text = `${title} ${sourceCountry}`.toLowerCase();
  if (/taiwan|taiwan strait|china|south china sea/.test(text)) return "\u53f0\u6d77 / \u5357\u6d77";
  if (/israel|gaza|iran|red sea|hormuz|yemen/.test(text)) return "\u4e2d\u6771 / \u7d05\u6d77";
  if (/russia|ukraine|nato|europe/.test(text)) return "\u6b50\u6d32 / \u4fc4\u70cf";
  if (/oil|energy|opec/.test(text)) return "\u80fd\u6e90";
  if (/shipping|port|vessel|freight/.test(text)) return "\u822a\u904b";
  if (/semiconductor|chip|ai|nvidia/.test(text)) return "AI / \u534a\u5c0e\u9ad4";
  return sourceCountry || "\u5168\u7403";
}

function buildGeopoliticalHotspots(events: GeopoliticalEvent[]) {
  const counts = new Map<string, { count: number; high: number; medium: number }>();
  for (const event of events) {
    const name = inferHotspot(event.title, event.sourceCountry);
    const existing = counts.get(name) ?? { count: 0, high: 0, medium: 0 };
    existing.count += 1;
    if (event.severity === "high") existing.high += 1;
    if (event.severity === "medium") existing.medium += 1;
    counts.set(name, existing);
  }

  return [...counts.entries()]
    .map(([name, item]) => ({
      name,
      count: item.count,
      severity: item.high ? "high" as const : item.medium ? "medium" as const : "low" as const,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function getWorldMonitorStatus(): WorldMonitorStatus {
  const configured = Boolean(process.env.WORLDMONITOR_API_KEY || process.env.WM_API_KEY);
  return {
    configured,
    status: configured ? "ready" : "needs_key",
    dashboardUrl: "https://www.worldmonitor.app/",
    repositoryUrl: "https://github.com/tncsharetool/worldmonitor",
    apiBaseUrl: "https://api.worldmonitor.app",
    mcpUrl: "https://worldmonitor.app/mcp",
    note: configured
      ? "World Monitor key configured; ready for API/MCP expansion."
      : "World Monitor dashboard linked; API/MCP calls need WORLDMONITOR_API_KEY or WM_API_KEY.",
  };
}

export async function getGeopoliticalSituation(): Promise<GeopoliticalSituation> {
  return cached("geopolitical-situation:v1", 15 * 60_000, async () => {
    const params = new URLSearchParams({
      query: geopoliticalQuery,
      mode: "ArtList",
      format: "json",
      maxrecords: "16",
      timespan: "24h",
      sort: "hybridrel",
    });
    const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, {
      cache: "no-store",
      headers: { "User-Agent": "LA1-Stock-Analysis/1.0" },
    }).catch(() => null);

    const payload = response?.ok ? (await response.json().catch(() => ({ articles: [] }))) as GdeltDocResponse : { articles: [] };
    const events = (payload.articles ?? []).slice(0, 12).map((article, index) => {
      const title = article.title ?? "Global situation update";
      const tone = parseNumber(article.tone);
      const classification = classifyGeopoliticalEvent(title, tone);
      return {
        id: `${article.seendate ?? "gdelt"}-${index}`,
        title,
        url: article.url ?? "",
        domain: article.domain ?? "",
        sourceCountry: article.sourcecountry ?? "",
        publishedAt: parseGdeltDate(article.seendate),
        tone,
        severity: classification.severity,
        theme: classification.theme,
        marketImpact: classification.marketImpact,
        source: "GDELT DOC 2.0",
      };
    });
    const highCount = events.filter((event) => event.severity === "high").length;
    const mediumCount = events.filter((event) => event.severity === "medium").length;
    const averageTone = average(events.map((event) => event.tone).filter((tone): tone is number => tone !== null)) ?? 0;
    const riskScore = Math.round(clamp(38 + highCount * 7 + mediumCount * 4 + Math.max(0, -averageTone) * 2.5, 0, 100));

    return {
      riskScore,
      stance:
        riskScore >= 70
          ? "\u98a8\u96aa\u5347\u6eab"
          : riskScore >= 52
            ? "\u4e2d\u6027\u504f\u8b39\u614e"
            : "\u4f4e\u5ea6\u76e3\u63a7",
      events,
      hotspots: buildGeopoliticalHotspots(events),
      worldMonitor: getWorldMonitorStatus(),
      generatedAt: new Date().toISOString(),
      source: response?.ok
        ? "GDELT DOC 2.0 + World Monitor integration metadata"
        : `GDELT unavailable${response ? ` (${response.status})` : ""} + World Monitor integration metadata`,
    };
  });
}

function inferPattern(candles: Candle[], ma5: number | null, ma20: number | null, ma60: number | null) {
  const latest = candles[0];
  if (!latest || ma5 === null || ma20 === null || ma60 === null) {
    return "歷史資料不足，暫不判斷技術型態。";
  }

  if (latest.close > ma5 && ma5 > ma20 && ma20 > ma60) {
    return "價格站上 5 日線，且 5/20/60 日均線呈多頭排列。";
  }

  if (latest.close < ma5 && ma5 < ma20 && ma20 < ma60) {
    return "價格跌破 5 日線，且 5/20/60 日均線呈空頭排列。";
  }

  if (latest.close > ma20 && ma5 > ma20) {
    return "短線轉強，但 60 日線仍需一起觀察。";
  }

  if (latest.close < ma20 && ma5 < ma20) {
    return "短線偏弱，需觀察是否回到 20 日線之上。";
  }

  return "均線結構尚未形成明確方向，偏向震盪觀察。";
}

export async function getFugleQuote(symbol: string): Promise<MarketQuote> {
  return cached(`quote:${symbol}`, 3_000, () => loadFugleQuote(symbol));
}

async function loadFugleQuote(symbol: string): Promise<MarketQuote> {
  const apiKey = process.env.FUGLE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("尚未設定 FUGLE_API_KEY。"), {
      code: "missing_fugle_key",
      status: 503,
    });
  }

  const response = await fetch(
    `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`,
    {
      headers: { "X-API-KEY": apiKey },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw Object.assign(
      new Error(`Fugle 報價服務暫時無法回應，狀態碼 ${response.status}。`),
      {
        code: "fugle_error",
        status: response.status,
      },
    );
  }

  const data = (await response.json()) as FugleQuote;

  return {
    symbol: data.symbol ?? symbol,
    name: data.name ?? symbol,
    price: data.lastPrice ?? data.closePrice ?? null,
    change: data.change ?? null,
    changePercent: data.changePercent ?? null,
    openPrice: data.openPrice ?? null,
    highPrice: data.highPrice ?? null,
    lowPrice: data.lowPrice ?? null,
    volume: data.total?.tradeVolume ?? null,
    bids: data.bids ?? [],
    asks: data.asks ?? [],
    updatedAt: normalizeTime(data.lastUpdated),
    source: "Fugle",
  };
}

export async function getTechnicalContext(symbol: string): Promise<TechnicalContext> {
  return cached(`technical:${symbol}`, 10 * 60_000, async () => {
    const apiKey = process.env.FUGLE_API_KEY;
    if (!apiKey) {
      throw Object.assign(new Error("尚未設定 FUGLE_API_KEY。"), {
        code: "missing_fugle_key",
        status: 503,
      });
    }

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 150);

    const params = new URLSearchParams({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      fields: "open,high,low,close,volume,change",
    });

    const response = await fetch(
      `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol}?${params}`,
      {
        headers: { "X-API-KEY": apiKey },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw Object.assign(
        new Error(`Fugle 歷史 K 線服務暫時無法回應，狀態碼 ${response.status}。`),
        { code: "fugle_candles_error", status: response.status },
      );
    }

    const payload = (await response.json()) as FugleCandlesResponse;
    const candles = (payload.data ?? []).slice(0, 80);
    const closes = candles.map((candle) => candle.close).filter(Number.isFinite);
    const ma5 = average(closes.slice(0, 5));
    const ma20 = average(closes.slice(0, 20));
    const ma60 = average(closes.slice(0, 60));

    return {
      ma5,
      ma20,
      ma60,
      latestClose: candles[0]?.close ?? null,
      latestDate: candles[0]?.date ?? null,
      pattern: inferPattern(candles, ma5, ma20, ma60),
      candles: candles.slice(0, 20),
      source: "Fugle historical candles",
    };
  });
}

export async function getRevenueContext(symbol: string): Promise<RevenueContext> {
  return cached(`revenue:${symbol}`, 24 * 60 * 60_000, async () => {
    const response = await fetch(
      "https://openapi.twse.com.tw/v1/opendata/t187ap05_L",
      { cache: "no-store" },
    );

    if (!response.ok) {
      return {
        available: false,
        companyName: null,
        dataMonth: null,
        monthlyRevenue: null,
        momChangePercent: null,
        yoyChangePercent: null,
        cumulativeRevenue: null,
        cumulativeYoyChangePercent: null,
        source: "TWSE OpenAPI",
        note: `月營收服務暫時無法回應，狀態碼 ${response.status}。`,
      };
    }

    const rows = (await response.json()) as RevenueRow[];
    const row = rows.find((item) => item["公司代號"] === symbol);

    if (!row) {
      return {
        available: false,
        companyName: null,
        dataMonth: null,
        monthlyRevenue: null,
        momChangePercent: null,
        yoyChangePercent: null,
        cumulativeRevenue: null,
        cumulativeYoyChangePercent: null,
        source: "TWSE OpenAPI",
        note: "此代號未在上市公司月營收資料中找到，可能是上櫃公司或資料尚未發布。",
      };
    }

    return {
      available: true,
      companyName: row["公司名稱"] ?? null,
      dataMonth: formatMinguoMonth(row["資料年月"] ?? null),
      monthlyRevenue: parseNumber(row["營業收入-當月營收"]),
      momChangePercent: parseNumber(row["營業收入-上月比較增減(%)"]),
      yoyChangePercent: parseNumber(row["營業收入-去年同月增減(%)"]),
      cumulativeRevenue: parseNumber(row["累計營業收入-當月累計營收"]),
      cumulativeYoyChangePercent: parseNumber(
        row["累計營業收入-前期比較增減(%)"],
      ),
      source: "TWSE OpenAPI",
    };
  });
}

export async function getNewsContext(symbol: string, name: string): Promise<NewsContext[]> {
  return cached(`news:${symbol}:${name}`, 60 * 60_000, async () => {
    const response = await fetch("https://openapi.twse.com.tw/v1/news/newsList", {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const rows = (await response.json()) as NewsRow[];
    const directMatches = rows.filter((item) => {
      const title = item.Title ?? "";
      return title.includes(symbol) || (!!name && title.includes(name));
    });

    const selected = directMatches.length ? directMatches : rows.slice(0, 3);

    return selected.slice(0, 5).map((item) => ({
      title: item.Title ?? "未命名新聞",
      url: item.Url ?? "",
      date: item.Date ?? "",
      source: directMatches.length ? "TWSE OpenAPI company match" : "TWSE OpenAPI market news",
    }));
  });
}

export function getInstitutionalContext(): InstitutionalContext {
  return {
    available: false,
    source: "pending licensed source",
    note:
      "三大法人個股買賣超需要確認可公開展示的授權來源；目前先標示為待接資料，不讓 AI 編造籌碼結論。",
  };
}

export async function getOfficialMarketSummary(): Promise<OfficialMarketSummary> {
  return cached("official-market-summary:v4", 10 * 60_000, async () => {
    const [
      twseStockResult,
      tpexCloseResult,
      twseIndexResult,
      tpexIndexResult,
      institutionalResult,
      globalMarketsResult,
      macroFactorsResult,
    ] = await Promise.allSettled([
      fetchJson<TwseStockDayRow[]>("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL"),
      fetchJson<TpexCloseRow[]>("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes"),
      fetchJson<Record<string, unknown>[]>("https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX"),
      fetchJson<TpexIndexRow[]>("https://www.tpex.org.tw/openapi/v1/tpex_index"),
      getInstitutionalFlow(),
      getGlobalMarkets(),
      getMacroFactors(),
    ]);

    const twseStockRows = twseStockResult.status === "fulfilled" ? twseStockResult.value : [];
    const tpexCloseRows = tpexCloseResult.status === "fulfilled" ? tpexCloseResult.value : [];
    const twseIndexRows = twseIndexResult.status === "fulfilled" ? twseIndexResult.value : [];
    const tpexIndexRows = tpexIndexResult.status === "fulfilled" ? tpexIndexResult.value : [];
    const institutional =
      institutionalResult.status === "fulfilled"
        ? institutionalResult.value
        : {
            foreign: null,
            investmentTrust: null,
            dealer: null,
            total: null,
            date: null,
            source: "TWSE T86 + TPEx 3insti daily trading",
          };
    const globalMarkets = globalMarketsResult.status === "fulfilled" ? globalMarketsResult.value : [];
    const macroFactors = macroFactorsResult.status === "fulfilled" ? macroFactorsResult.value : [];

    const items = [
      ...normalizeTwseStockRows(twseStockRows),
      ...normalizeTpexCloseRows(tpexCloseRows),
    ];
    const withChangePercent = items.filter((item) => item.changePercent !== null);

    return {
      indices: {
        twse: parseTwseIndex(twseIndexRows),
        tpex: parseTpexIndex(tpexIndexRows),
      },
      globalMarkets,
      macroFactors,
      breadth: buildBreadth(items),
      institutional,
      rankings: {
        gainers: [...withChangePercent]
          .sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity))
          .slice(0, 8),
        losers: [...withChangePercent]
          .sort((a, b) => (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity))
          .slice(0, 8),
        volume: [...items]
          .sort((a, b) => (b.volume ?? -Infinity) - (a.volume ?? -Infinity))
          .slice(0, 8),
      },
      generatedAt: new Date().toISOString(),
    };
  });
}

export async function getMarketContext(symbol: string): Promise<MarketContext> {
  const quote = await getFugleQuote(symbol);
  const [technical, revenue, news] = await Promise.all([
    getTechnicalContext(symbol),
    getRevenueContext(symbol),
    getNewsContext(symbol, quote.name),
  ]);

  return {
    quote,
    technical,
    revenue,
    institutional: getInstitutionalContext(),
    news,
    generatedAt: new Date().toISOString(),
  };
}
