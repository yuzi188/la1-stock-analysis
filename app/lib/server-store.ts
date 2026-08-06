import { cleanSymbol, type MarketQuote } from "./market";

export type AlertSettings = {
  upPercent: number;
  downPercent: number;
  riskScore: number;
  breakoutBuffer: number;
  supportBuffer: number;
};

export type CloudUser = {
  id: string;
  email: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudWatchItem = {
  symbol: string;
  name: string;
  theme: string;
};

export type CloudInvestmentNote = {
  id: string;
  symbol: string;
  title: string;
  thesis: string;
  stop: string;
  target: string;
  createdAt: string;
};

export type CloudNotification = {
  id: string;
  userId: string;
  title: string;
  detail: string;
  tone: "up" | "down" | "neutral" | "warn";
  read: boolean;
  createdAt: string;
};

export type CloudSnapshot = {
  user: CloudUser;
  watchlist: CloudWatchItem[];
  notes: CloudInvestmentNote[];
  alertSettings: AlertSettings;
  readNotificationIds: string[];
  notifications: CloudNotification[];
};

type QuoteCacheEntry = {
  symbol: string;
  quote: MarketQuote;
  fetchedAt: string;
  expiresAt: string;
};

type ScanRun = {
  id: string;
  userId: string;
  symbols: string[];
  triggered: number;
  createdAt: string;
  result: unknown;
};

type ScheduledReport = {
  id: string;
  type: "morning" | "review";
  title: string;
  detail: string;
  createdAt: string;
  payload: unknown;
};

type Store = {
  users: Record<string, CloudUser>;
  snapshots: Record<string, Omit<CloudSnapshot, "user" | "notifications">>;
  notifications: CloudNotification[];
  quoteCache: Record<string, QuoteCacheEntry>;
  scanRuns: ScanRun[];
  reports: ScheduledReport[];
};

export const defaultAlertSettings: AlertSettings = {
  upPercent: 3,
  downPercent: 3,
  riskScore: 65,
  breakoutBuffer: 0.5,
  supportBuffer: 1,
};

const defaultStore: Store = {
  users: {},
  snapshots: {},
  notifications: [],
  quoteCache: {},
  scanRuns: [],
  reports: [],
};

const memoryStore = globalThis as typeof globalThis & {
  __la1ServerStore?: Store;
};

function dataFilePath() {
  return process.env.LA1_DATA_FILE ?? ".data/la1-store.json";
}

async function readJsonStore(): Promise<Store> {
  if (memoryStore.__la1ServerStore) return memoryStore.__la1ServerStore;

  try {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile(dataFilePath(), "utf8");
    memoryStore.__la1ServerStore = { ...defaultStore, ...JSON.parse(text) };
  } catch {
    memoryStore.__la1ServerStore = structuredClone(defaultStore);
  }

  return memoryStore.__la1ServerStore;
}

async function writeJsonStore(store: Store) {
  memoryStore.__la1ServerStore = store;

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = dataFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function updateStore<T>(updater: (store: Store) => T | Promise<T>) {
  const store = await readJsonStore();
  const result = await updater(store);
  await writeJsonStore(store);
  return result;
}

export function requestUserId(request: Request) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("userId");
  const fromHeader = request.headers.get("x-la1-user-id");
  return normalizeUserId(fromHeader ?? fromQuery ?? "demo-user");
}

export function normalizeUserId(value: string) {
  return value.replace(/[^\w.-]/g, "").slice(0, 80) || "demo-user";
}

export function normalizeCloudWatchlist(items: CloudWatchItem[]) {
  return items
    .map((item) => ({
      symbol: cleanSymbol(item.symbol),
      name: String(item.name || "自選股").slice(0, 32),
      theme: String(item.theme || "手動新增觀察").slice(0, 80),
    }))
    .filter((item) => item.symbol);
}

export async function ensureUser(userId: string, input?: { email?: string | null; name?: string | null }) {
  return updateStore((store) => {
    const now = new Date().toISOString();
    const existing = store.users[userId];
    const user: CloudUser = {
      id: userId,
      email: input?.email ?? existing?.email ?? null,
      name: input?.name ?? existing?.name ?? "LA1 用戶",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    store.users[userId] = user;
    store.snapshots[userId] ??= {
      watchlist: [],
      notes: [],
      alertSettings: defaultAlertSettings,
      readNotificationIds: [],
    };
    return user;
  });
}

export async function getSnapshot(userId: string): Promise<CloudSnapshot> {
  const user = await ensureUser(userId);
  const store = await readJsonStore();
  const snapshot = store.snapshots[userId] ?? {
    watchlist: [],
    notes: [],
    alertSettings: defaultAlertSettings,
    readNotificationIds: [],
  };
  return {
    user,
    watchlist: snapshot.watchlist,
    notes: snapshot.notes,
    alertSettings: { ...defaultAlertSettings, ...snapshot.alertSettings },
    readNotificationIds: snapshot.readNotificationIds,
    notifications: store.notifications.filter((item) => item.userId === userId),
  };
}

export async function saveSnapshot(userId: string, input: Partial<Omit<CloudSnapshot, "user" | "notifications">>) {
  await ensureUser(userId);
  return updateStore((store) => {
    const current = store.snapshots[userId] ?? {
      watchlist: [],
      notes: [],
      alertSettings: defaultAlertSettings,
      readNotificationIds: [],
    };
    store.snapshots[userId] = {
      watchlist: input.watchlist ? normalizeCloudWatchlist(input.watchlist) : current.watchlist,
      notes: input.notes ?? current.notes,
      alertSettings: input.alertSettings
        ? { ...defaultAlertSettings, ...input.alertSettings }
        : current.alertSettings,
      readNotificationIds: input.readNotificationIds ?? current.readNotificationIds,
    };
    return store.snapshots[userId];
  });
}

export async function getCachedQuote(symbol: string) {
  const store = await readJsonStore();
  const entry = store.quoteCache[symbol];
  if (!entry) return null;
  return new Date(entry.expiresAt).getTime() > Date.now() ? entry.quote : null;
}

export async function saveCachedQuote(symbol: string, quote: MarketQuote, ttlMs: number) {
  return updateStore((store) => {
    store.quoteCache[symbol] = {
      symbol,
      quote,
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    };
    return store.quoteCache[symbol];
  });
}

export async function addNotification(notification: Omit<CloudNotification, "id" | "createdAt">) {
  return updateStore((store) => {
    const item: CloudNotification = {
      ...notification,
      id: `${notification.userId}-${Date.now()}-${store.notifications.length}`,
      createdAt: new Date().toISOString(),
    };
    store.notifications.unshift(item);
    store.notifications = store.notifications.slice(0, 250);
    return item;
  });
}

export async function addScanRun(run: Omit<ScanRun, "id" | "createdAt">) {
  return updateStore((store) => {
    const item: ScanRun = {
      ...run,
      id: `scan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.scanRuns.unshift(item);
    store.scanRuns = store.scanRuns.slice(0, 100);
    return item;
  });
}

export async function addScheduledReport(report: Omit<ScheduledReport, "id" | "createdAt">) {
  return updateStore((store) => {
    const item: ScheduledReport = {
      ...report,
      id: `${report.type}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.reports.unshift(item);
    store.reports = store.reports.slice(0, 80);
    return item;
  });
}
