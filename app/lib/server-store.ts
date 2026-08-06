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

type PgPool = import("pg").Pool;

type DbUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbSnapshotRow = {
  watchlist: unknown;
  notes: unknown;
  alert_settings: unknown;
  read_notification_ids: unknown;
};

type DbNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  detail: string;
  tone: CloudNotification["tone"];
  read: boolean;
  created_at: Date | string;
};

type DbQuoteRow = {
  symbol: string;
  quote: unknown;
  fetched_at: Date | string;
  expires_at: Date | string;
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

const globalStore = globalThis as typeof globalThis & {
  __la1ServerStore?: Store;
  __la1PostgresClient?: PgPool;
  __la1PostgresReady?: Promise<void>;
};

function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
}

function dataFilePath() {
  return process.env.LA1_DATA_FILE ?? ".data/la1-store.json";
}

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function arrayFromUnknown<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function snapshotDefaults() {
  return {
    watchlist: [],
    notes: [],
    alertSettings: defaultAlertSettings,
    readNotificationIds: [],
  };
}

async function readJsonStore(): Promise<Store> {
  if (globalStore.__la1ServerStore) return globalStore.__la1ServerStore;

  try {
    const fs = await import("node:fs/promises");
    const text = await fs.readFile(dataFilePath(), "utf8");
    globalStore.__la1ServerStore = { ...defaultStore, ...JSON.parse(text) };
  } catch {
    globalStore.__la1ServerStore = structuredClone(defaultStore);
  }

  return globalStore.__la1ServerStore;
}

async function writeJsonStore(store: Store) {
  globalStore.__la1ServerStore = store;

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = dataFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

async function updateStore<T>(updater: (store: Store) => T | Promise<T>) {
  const store = await readJsonStore();
  const result = await updater(store);
  await writeJsonStore(store);
  return result;
}

async function ensurePostgresSchema(pool: PgPool) {
  await pool.query(`
    create table if not exists la1_users (
      id text primary key,
      email text,
      name text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists la1_snapshots (
      user_id text primary key references la1_users(id) on delete cascade,
      watchlist jsonb not null default '[]'::jsonb,
      notes jsonb not null default '[]'::jsonb,
      alert_settings jsonb not null default '{}'::jsonb,
      read_notification_ids jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists la1_notifications (
      id text primary key,
      user_id text not null references la1_users(id) on delete cascade,
      title text not null,
      detail text not null,
      tone text not null,
      read boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists la1_notifications_user_created_idx on la1_notifications(user_id, created_at desc)");
  await pool.query(`
    create table if not exists la1_quote_cache (
      symbol text primary key,
      quote jsonb not null,
      fetched_at timestamptz not null,
      expires_at timestamptz not null
    )
  `);
  await pool.query(`
    create table if not exists la1_scan_runs (
      id text primary key,
      user_id text not null references la1_users(id) on delete cascade,
      symbols jsonb not null,
      triggered integer not null,
      result jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists la1_scan_runs_user_created_idx on la1_scan_runs(user_id, created_at desc)");
  await pool.query(`
    create table if not exists la1_scheduled_reports (
      id text primary key,
      report_type text not null,
      title text not null,
      detail text not null,
      payload jsonb not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists la1_scheduled_reports_created_idx on la1_scheduled_reports(created_at desc)");
}

async function getPostgres() {
  const url = databaseUrl();
  if (!url) return null;

  if (!globalStore.__la1PostgresClient) {
    const { Pool } = await import("pg");
    globalStore.__la1PostgresClient = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  globalStore.__la1PostgresReady ??= ensurePostgresSchema(globalStore.__la1PostgresClient);
  await globalStore.__la1PostgresReady;
  return globalStore.__la1PostgresClient;
}

function notificationFromRow(row: DbNotificationRow): CloudNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    detail: row.detail,
    tone: row.tone,
    read: row.read,
    createdAt: iso(row.created_at),
  };
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

function normalizeNotes(items: CloudInvestmentNote[]) {
  return items
    .map((item) => ({
      id: String(item.id || `note-${Date.now()}`).slice(0, 80),
      symbol: cleanSymbol(item.symbol),
      title: String(item.title || "投資筆記").slice(0, 80),
      thesis: String(item.thesis || "").slice(0, 2000),
      stop: String(item.stop || "").slice(0, 240),
      target: String(item.target || "").slice(0, 240),
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.symbol || item.thesis || item.title)
    .slice(0, 200);
}

export async function ensureUser(userId: string, input?: { email?: string | null; name?: string | null }) {
  const pool = await getPostgres();
  if (!pool) {
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
      store.snapshots[userId] ??= snapshotDefaults();
      return user;
    });
  }

  const now = new Date().toISOString();
  const existingResult = await pool.query<DbUserRow>(
    "select id, email, name, created_at, updated_at from la1_users where id = $1",
    [userId],
  );
  const existing = existingResult.rows[0];
  const user: CloudUser = {
    id: userId,
    email: input?.email ?? existing?.email ?? null,
    name: input?.name ?? existing?.name ?? "LA1 用戶",
    createdAt: existing ? iso(existing.created_at) : now,
    updatedAt: now,
  };

  await pool.query(
    `
    insert into la1_users (id, email, name, created_at, updated_at)
    values ($1, $2, $3, $4, $5)
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      updated_at = excluded.updated_at
    `,
    [user.id, user.email, user.name, user.createdAt, user.updatedAt],
  );
  await pool.query(
    `
    insert into la1_snapshots (user_id, watchlist, notes, alert_settings, read_notification_ids)
    values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb)
    on conflict (user_id) do nothing
    `,
    [user.id, "[]", "[]", JSON.stringify(defaultAlertSettings), "[]"],
  );

  return user;
}

export async function getSnapshot(userId: string): Promise<CloudSnapshot> {
  const user = await ensureUser(userId);
  const pool = await getPostgres();

  if (!pool) {
    const store = await readJsonStore();
    const snapshot = store.snapshots[userId] ?? snapshotDefaults();
    return {
      user,
      watchlist: snapshot.watchlist,
      notes: snapshot.notes,
      alertSettings: { ...defaultAlertSettings, ...snapshot.alertSettings },
      readNotificationIds: snapshot.readNotificationIds,
      notifications: store.notifications.filter((item) => item.userId === userId),
    };
  }

  const snapshotResult = await pool.query<DbSnapshotRow>(
    "select watchlist, notes, alert_settings, read_notification_ids from la1_snapshots where user_id = $1",
    [userId],
  );
  const row = snapshotResult.rows[0];
  const notifications = await pool.query<DbNotificationRow>(
    `
    select id, user_id, title, detail, tone, read, created_at
    from la1_notifications
    where user_id = $1
    order by created_at desc
    limit 250
    `,
    [userId],
  );

  return {
    user,
    watchlist: normalizeCloudWatchlist(arrayFromUnknown<CloudWatchItem>(row?.watchlist)),
    notes: normalizeNotes(arrayFromUnknown<CloudInvestmentNote>(row?.notes)),
    alertSettings: { ...defaultAlertSettings, ...(row?.alert_settings as Partial<AlertSettings> | undefined) },
    readNotificationIds: arrayFromUnknown<string>(row?.read_notification_ids),
    notifications: notifications.rows.map(notificationFromRow),
  };
}

export async function saveSnapshot(userId: string, input: Partial<Omit<CloudSnapshot, "user" | "notifications">>) {
  await ensureUser(userId);
  const pool = await getPostgres();

  if (!pool) {
    return updateStore((store) => {
      const current = store.snapshots[userId] ?? snapshotDefaults();
      store.snapshots[userId] = {
        watchlist: input.watchlist ? normalizeCloudWatchlist(input.watchlist) : current.watchlist,
        notes: input.notes ? normalizeNotes(input.notes) : current.notes,
        alertSettings: input.alertSettings
          ? { ...defaultAlertSettings, ...input.alertSettings }
          : current.alertSettings,
        readNotificationIds: input.readNotificationIds ?? current.readNotificationIds,
      };
      return store.snapshots[userId];
    });
  }

  const current = await getSnapshot(userId);
  const next = {
    watchlist: input.watchlist ? normalizeCloudWatchlist(input.watchlist) : current.watchlist,
    notes: input.notes ? normalizeNotes(input.notes) : current.notes,
    alertSettings: input.alertSettings
      ? { ...defaultAlertSettings, ...input.alertSettings }
      : current.alertSettings,
    readNotificationIds: input.readNotificationIds ?? current.readNotificationIds,
  };

  await pool.query(
    `
    insert into la1_snapshots (user_id, watchlist, notes, alert_settings, read_notification_ids, updated_at)
    values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, now())
    on conflict (user_id) do update set
      watchlist = excluded.watchlist,
      notes = excluded.notes,
      alert_settings = excluded.alert_settings,
      read_notification_ids = excluded.read_notification_ids,
      updated_at = excluded.updated_at
    `,
    [
      userId,
      JSON.stringify(next.watchlist),
      JSON.stringify(next.notes),
      JSON.stringify(next.alertSettings),
      JSON.stringify(next.readNotificationIds),
    ],
  );

  return next;
}

export async function getCachedQuote(symbol: string) {
  const pool = await getPostgres();
  if (!pool) {
    const store = await readJsonStore();
    const entry = store.quoteCache[symbol];
    if (!entry) return null;
    return new Date(entry.expiresAt).getTime() > Date.now() ? entry.quote : null;
  }

  const result = await pool.query<DbQuoteRow>(
    "select symbol, quote, fetched_at, expires_at from la1_quote_cache where symbol = $1",
    [symbol],
  );
  const entry = result.rows[0];
  if (!entry) return null;
  return new Date(entry.expires_at).getTime() > Date.now() ? (entry.quote as MarketQuote) : null;
}

export async function saveCachedQuote(symbol: string, quote: MarketQuote, ttlMs: number) {
  const pool = await getPostgres();
  const item = {
    symbol,
    quote,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttlMs).toISOString(),
  };

  if (!pool) {
    return updateStore((store) => {
      store.quoteCache[symbol] = item;
      return store.quoteCache[symbol];
    });
  }

  await pool.query(
    `
    insert into la1_quote_cache (symbol, quote, fetched_at, expires_at)
    values ($1, $2::jsonb, $3, $4)
    on conflict (symbol) do update set
      quote = excluded.quote,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
    `,
    [symbol, JSON.stringify(quote), item.fetchedAt, item.expiresAt],
  );
  return item;
}

export async function addNotification(notification: Omit<CloudNotification, "id" | "createdAt">) {
  await ensureUser(notification.userId);
  const pool = await getPostgres();

  if (!pool) {
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

  const item: CloudNotification = {
    ...notification,
    id: `${notification.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    "insert into la1_notifications (id, user_id, title, detail, tone, read, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
    [item.id, item.userId, item.title, item.detail, item.tone, item.read, item.createdAt],
  );
  await pool.query(
    `
    delete from la1_notifications
    where user_id = $1
      and id not in (
        select id from la1_notifications
        where user_id = $1
        order by created_at desc
        limit 250
      )
    `,
    [item.userId],
  );
  return item;
}

export async function addScanRun(run: Omit<ScanRun, "id" | "createdAt">) {
  await ensureUser(run.userId);
  const pool = await getPostgres();

  if (!pool) {
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

  const item: ScanRun = {
    ...run,
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `
    insert into la1_scan_runs (id, user_id, symbols, triggered, result, created_at)
    values ($1, $2, $3::jsonb, $4, $5::jsonb, $6)
    `,
    [item.id, item.userId, JSON.stringify(item.symbols), item.triggered, JSON.stringify(item.result), item.createdAt],
  );
  await pool.query(
    `
    delete from la1_scan_runs
    where user_id = $1
      and id not in (
        select id from la1_scan_runs
        where user_id = $1
        order by created_at desc
        limit 100
      )
    `,
    [item.userId],
  );
  return item;
}

export async function addScheduledReport(report: Omit<ScheduledReport, "id" | "createdAt">) {
  const pool = await getPostgres();

  if (!pool) {
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

  const item: ScheduledReport = {
    ...report,
    id: `${report.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `
    insert into la1_scheduled_reports (id, report_type, title, detail, payload, created_at)
    values ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [item.id, item.type, item.title, item.detail, JSON.stringify(item.payload), item.createdAt],
  );
  await pool.query(`
    delete from la1_scheduled_reports
    where id not in (
      select id from la1_scheduled_reports
      order by created_at desc
      limit 80
    )
  `);
  return item;
}
