import { Pool, type QueryResultRow } from 'pg';
import { getRuntimeEnv } from './jwt-secret';

const globalForDb = globalThis as typeof globalThis & { noblePgPool?: Pool };

function getPool(): Pool {
  if (globalForDb.noblePgPool) return globalForDb.noblePgPool;
  const databaseUrl = getRuntimeEnv('NETLIFY_DB_URL') || getRuntimeEnv('DATABASE_URL');
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Configure a PostgreSQL database for this deployment.');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? undefined
      : { rejectUnauthorized: false },
  });
  if (process.env.NODE_ENV !== 'production') globalForDb.noblePgPool = pool;
  return pool;
}

function postgresPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizeSql(sql: string): string {
  let normalized = sql
    .replace(/INSERT OR REPLACE INTO settings/gi, 'INSERT INTO settings')
    .replace(/INSERT OR IGNORE INTO merchants/gi, 'INSERT INTO merchants')
    .replace(/INSERT OR REPLACE INTO external_cache/gi, 'INSERT INTO external_cache')
    .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/strftime\('\%Y-\%m',\s*date\)/gi, "TO_CHAR(date::date, 'YYYY-MM')");

  if (/^\s*INSERT INTO settings\b/i.test(normalized) && !/ON CONFLICT/i.test(normalized)) {
    normalized = `${normalized.trim().replace(/;$/, '')} ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
  if (/^\s*INSERT INTO merchants\b/i.test(normalized) && !/ON CONFLICT/i.test(normalized)) {
    normalized = `${normalized.trim().replace(/;$/, '')} ON CONFLICT (name) DO NOTHING`;
  }
  if (/^\s*INSERT INTO external_cache\b/i.test(normalized) && !/ON CONFLICT/i.test(normalized)) {
    normalized = `${normalized.trim().replace(/;$/, '')} ON CONFLICT (provider, cache_key) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = EXCLUDED.fetched_at, expires_at = EXCLUDED.expires_at`;
  }
  return normalized;
}

class Statement {
  constructor(private readonly sql: string) {}

  async all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T[]> {
    const result = await getPool().query<T>(postgresPlaceholders(normalizeSql(this.sql)), params);
    return result.rows;
  }

  async get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]): Promise<T | undefined> {
    const rows = await this.all<T>(...params);
    return rows[0];
  }

  async run(...params: unknown[]): Promise<{ lastInsertRowid?: string | number; changes: number }> {
    let sql = normalizeSql(this.sql).trim().replace(/;\s*$/, '');
    if (/^INSERT\s+/i.test(sql) && !/\sRETURNING\s/i.test(sql)) sql += ' RETURNING *';
    const result = await getPool().query<Record<string, unknown>>(postgresPlaceholders(sql), params);
    const inserted = result.rows[0];
    return { lastInsertRowid: inserted?.id as string | number | undefined, changes: result.rowCount ?? 0 };
  }
}

export const db = {
  prepare(sql: string): Statement {
    return new Statement(sql);
  },
  async exec(sql: string): Promise<void> {
    await getPool().query(sql);
  },
};
