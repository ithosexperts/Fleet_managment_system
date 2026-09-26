import dotenv from 'dotenv';
import pg from 'pg';
import sql from 'mssql';
import path from 'path';
import fs from 'fs';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const driver = (process.env.DB_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'sqlite')) as 'postgres' | 'sqlserver' | 'sqlite';
export function getDatabaseDriver(): 'postgres' | 'sqlserver' | 'sqlite' { return driver; }
const poolMax = Number.parseInt(process.env.DB_POOL_MAX || '10', 10);
if (!Number.isInteger(poolMax) || poolMax < 1) throw new Error('DB_POOL_MAX must be a positive integer.');

const postgresUrl = process.env.DATABASE_URL;
const isRenderPostgres = Boolean(postgresUrl && (postgresUrl.includes('dpg-') || postgresUrl.includes('render.com')));
const useSsl = process.env.DB_SSL === 'true' || isRenderPostgres;
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

const postgresPool = driver === 'postgres' && postgresUrl ? new pg.Pool({
  connectionString: postgresUrl,
  max: poolMax,
  ssl: useSsl ? { rejectUnauthorized } : undefined
}) : null;

const sqlServerConfig: sql.config | null = driver === 'sqlserver' ? {
  server: process.env.DB_SERVER || '',
  port: Number.parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  pool: { max: poolMax, min: 0, idleTimeoutMillis: 30_000 },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false'
  }
} : null;

if (driver === 'postgres' && !postgresUrl) throw new Error('DATABASE_URL is required when DB_DRIVER=postgres.');
if (driver === 'sqlserver' && (!sqlServerConfig?.server || !sqlServerConfig.database || !sqlServerConfig.user || !sqlServerConfig.password)) {
  throw new Error('DB_SERVER, DB_NAME, DB_USER, and DB_PASSWORD are required when DB_DRIVER=sqlserver.');
}
if (driver !== 'postgres' && driver !== 'sqlserver' && driver !== 'sqlite') {
  throw new Error('DB_DRIVER must be sqlite, postgres or sqlserver.');
}

export const pool = driver === 'postgres' ? postgresPool : (driver === 'sqlserver' ? new sql.ConnectionPool(sqlServerConfig!) : null);
const poolReady = driver === 'postgres' ? Promise.resolve(postgresPool!) : (driver === 'sqlserver' ? (pool as sql.ConnectionPool).connect() : Promise.resolve(null));

type QueryRow = object;
export type QueryResult<T extends QueryRow = QueryRow> = { rows: T[]; recordset?: T[] };
export interface QueryExecutor {
  query<T extends QueryRow = QueryRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}

// -----------------------------------------------------------------------------
// SQLite Client Engine (Node 22+ Native DatabaseSync)
// -----------------------------------------------------------------------------
let sqliteInstance: any = null;

function getSqliteDb(): any {
  if (!sqliteInstance) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    let dbPath = process.env.SQLITE_DB_PATH;
    const serverDir = path.resolve(__dirname, '..');
    if (!dbPath) {
      dbPath = path.resolve(serverDir, 'data', 'truck_tracker.sqlite');
    } else if (!path.isAbsolute(dbPath)) {
      const candidateServerPath = path.resolve(serverDir, dbPath);
      if (fs.existsSync(candidateServerPath)) {
        dbPath = candidateServerPath;
      } else {
        dbPath = path.resolve(process.cwd(), dbPath);
      }
    }
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    db.function('now', () => new Date().toISOString());
    db.function('sysutcdatetime', () => new Date().toISOString());
    db.function('dateadd', (_interval: string, count: number, dateStr?: string) => {
      const d = dateStr ? new Date(dateStr) : new Date();
      d.setDate(d.getDate() + count);
      return d.toISOString();
    });
    sqliteInstance = db;
  }
  return sqliteInstance;
}

function normalizeSqliteText(sqlText: string): string {
  return sqlText
    .replace(/\bTIMESTAMPTZ\b/gi, 'DATETIME')
    .replace(/\bDOUBLE PRECISION\b/gi, 'REAL')
    .replace(/DEFAULT\s+NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/COUNT\(\*\)::text/gi, 'COUNT(*)')
    .replace(/::text/gi, '')
    .replace(/::int/gi, '')
    .replace(/CURRENT_DATE\s*-\s*\(\$(\d+)\s*\*\s*INTERVAL\s*'1 day'\)/gi, "DATE('now', '-' || $$1 || ' day')")
    .replace(/CURRENT_DATE/gi, "DATE('now')");
}

function bindSqliteParameters(text: string, values: unknown[]): { sql: string; params: unknown[] } {
  const normalized = normalizeSqliteText(text);
  const params: unknown[] = [];
  const sql = normalized.replace(/\$(\d+)/g, (_match, posStr: string) => {
    const idx = Number(posStr) - 1;
    if (idx >= 0 && idx < values.length) {
      params.push(values[idx]);
      return '?';
    }
    return '?';
  });
  return { sql, params };
}

export class SqliteClient implements QueryExecutor {
  async query<T extends QueryRow = QueryRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
    const db = getSqliteDb();
    const trimmed = text.trim();

    // Check if query contains multiple statements (semicolon-separated) without parameters
    if (trimmed.includes(';') && values.length === 0) {
      const normalized = normalizeSqliteText(trimmed);
      const statements = normalized.split(';').map(s => s.trim()).filter(Boolean);
      for (const statement of statements) {
        const alterMatch = statement.match(/^ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+([\s\S]+)$/i);
        if (alterMatch) {
          const table = alterMatch[1];
          const column = alterMatch[2];
          const typeDef = alterMatch[3];
          const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((r: any) => r.name);
          if (!cols.includes(column)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
          }
          continue;
        }
        db.exec(statement);
      }
      return { rows: [] };
    }

    // Check single ALTER TABLE ... ADD COLUMN IF NOT EXISTS
    const singleAlterMatch = trimmed.match(/^ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+([\s\S]+)$/i);
    if (singleAlterMatch) {
      const table = singleAlterMatch[1];
      const column = singleAlterMatch[2];
      const typeDef = singleAlterMatch[3];
      const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((r: any) => r.name);
      if (!cols.includes(column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
      }
      return { rows: [] };
    }

    const { sql: boundSql, params } = bindSqliteParameters(trimmed, values);
    const upper = boundSql.trim().toUpperCase();
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.includes('RETURNING');

    try {
      const stmt = db.prepare(boundSql);
      if (isSelect) {
        const rows = stmt.all(...params) as T[];
        return { rows, recordset: rows };
      } else {
        stmt.run(...params);
        return { rows: [], recordset: [] };
      }
    } catch (err: any) {
      // Gracefully ignore duplicate column errors if an ALTER TABLE races
      if (err.message && err.message.includes('duplicate column name')) {
        return { rows: [] };
      }
      throw err;
    }
  }
}

// -----------------------------------------------------------------------------
// SQL Server Translator & Client
// -----------------------------------------------------------------------------
function sqlServerBatch(text: string): string {
  const tablePrefix = process.env.DB_TABLE_PREFIX || (driver === 'sqlserver' ? 'FL_' : '');
  let normalized = text
    .replace(/\bTIMESTAMPTZ\b/g, 'datetime2')
    .replace(/\bDOUBLE PRECISION\b/g, 'float')
    .replace(/\bNOW\(\)/g, 'SYSUTCDATETIME()')
    .replace(/CURRENT_DATE\s*-\s*\(\$(\d+)\s*\*\s*INTERVAL\s*'1 day'\)/gi, 'DATEADD(day, -$$1, CAST(SYSUTCDATETIME() AS date))')
    .replace(/CURRENT_DATE/g, 'CAST(SYSUTCDATETIME() AS date)')
    .replace(/COUNT\(\*\)::text/gi, 'COUNT(*)')
    .replace(/\bTEXT\s+PRIMARY KEY\b/gi, 'nvarchar(255) PRIMARY KEY')
    .replace(/\bTEXT\s+UNIQUE\b/gi, 'nvarchar(255) UNIQUE')
    .replace(/\bTEXT\s+NOT NULL\b/gi, 'nvarchar(255) NOT NULL')
    .replace(/\bTEXT\s+CHECK\b/gi, 'nvarchar(255) CHECK')
    .replace(/\bTEXT\b/gi, 'nvarchar(max)');

  if (tablePrefix) {
    const tableMap: Record<string, string> = {
      'users': `${tablePrefix}Users`,
      'vehicles': `${tablePrefix}Vehicles`,
      'drivers': `${tablePrefix}Drivers`,
      'destinations': `${tablePrefix}Destinations`,
      'trips': `${tablePrefix}Trips`,
      'trip_stops': `${tablePrefix}Trip_Stops`,
      'activities': `${tablePrefix}Activities`,
      'delays': `${tablePrefix}Delays`,
      'photos': `${tablePrefix}Photos`,
      'trip_events': `${tablePrefix}Trip_Events`,
      'audit_logs': `${tablePrefix}Audit_Logs`,
      'vehicle_documents': `${tablePrefix}Vehicle_Documents`,
      'driver_documents': `${tablePrefix}Driver_Documents`,
      'maintenance_records': `${tablePrefix}Maintenance_Records`,
      'fuel_transactions': `${tablePrefix}Fuel_Transactions`,
      'vehicle_challans': `${tablePrefix}Vehicle_Challans`,
      'operational_exceptions': `${tablePrefix}Operational_Exceptions`,
      '_schema_migrations': `${tablePrefix}Schema_Migrations`
    };

    for (const [canonical, target] of Object.entries(tableMap)) {
      normalized = normalized.replace(new RegExp(`\\b${canonical}\\b`, 'gi'), target);
    }
  }

  let translated = translateSqlServerLimits(normalized);
  return translated.split(';').map((rawStatement) => {
    const statement = rawStatement.trim();
    if (!statement) return '';

    let match = statement.match(/^CREATE TABLE IF NOT EXISTS (\w+)([\s\S]*)$/i);
    if (match) return `IF OBJECT_ID(N'${match[1]}', N'U') IS NULL BEGIN CREATE TABLE ${match[1]}${match[2]} END`;

    match = statement.match(/^CREATE UNIQUE INDEX IF NOT EXISTS (\w+) ON (\w+)([\s\S]*)$/i);
    if (match) return `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = '${match[1]}' AND object_id = OBJECT_ID('${match[2]}')) BEGIN CREATE UNIQUE INDEX ${match[1]} ON ${match[2]}${match[3]} END`;

    match = statement.match(/^CREATE INDEX IF NOT EXISTS (\w+) ON (\w+)([\s\S]*)$/i);
    if (match) return `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = '${match[1]}' AND object_id = OBJECT_ID('${match[2]}')) BEGIN CREATE INDEX ${match[1]} ON ${match[2]}${match[3]} END`;

    match = statement.match(/^ALTER TABLE (\w+) ADD COLUMN IF NOT EXISTS (\w+) ([\s\S]*)$/i);
    if (match) return `IF COL_LENGTH('${match[1]}', '${match[2]}') IS NULL ALTER TABLE ${match[1]} ADD ${match[2]} ${match[3]}`;

    return statement;
  }).filter(Boolean).join(';\n');
}

function translateSqlServerLimits(text: string): string {
  let result = text;
  const pagination = /LIMIT\s+(\$\d+|\d+)\s+OFFSET\s+(\$\d+|\d+)/i;
  result = result.replace(pagination, 'OFFSET $2 ROWS FETCH NEXT $1 ROWS ONLY');

  const limitPattern = /LIMIT\s+(\$\d+|\d+)/i;
  while (limitPattern.test(result)) {
    const match = limitPattern.exec(result);
    if (!match || match.index === undefined) break;
    const limitStart = match.index;
    let depth = 0;
    let selectStart = -1;
    for (let index = limitStart - 1; index >= 0; index--) {
      if (result[index] === ')') depth++;
      else if (result[index] === '(') depth--;
      else if (depth === 0 && result.slice(Math.max(0, index - 5), index + 1).toUpperCase() === 'SELECT') {
        selectStart = index - 5;
        break;
      }
    }
    if (selectStart < 0) break;
    result = `${result.slice(0, selectStart + 6)} TOP (${match[1]})${result.slice(selectStart + 6, limitStart)}${result.slice(limitStart + match[0].length)}`;
  }
  return result;
}

function bindSqlServerParameters(request: sql.Request, text: string, values: unknown[]): string {
  return text.replace(/\$(\d+)/g, (_match, position: string) => {
    const index = Number(position) - 1;
    if (index < 0 || index >= values.length) throw new Error(`Missing SQL parameter value for $${position}.`);
    request.input(`p${position}`, values[index] as any);
    return `@p${position}`;
  });
}

export class SqlClient {
  constructor(private readonly transaction?: sql.Transaction) { }
  async query<T extends QueryRow = QueryRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
    const request = this.transaction ? new sql.Request(this.transaction) : new sql.Request(await poolReady as sql.ConnectionPool);
    const result = await request.query<T>(bindSqlServerParameters(request, sqlServerBatch(text), values));
    return { rows: result.recordset as T[] };
  }
}

// -----------------------------------------------------------------------------
// Unified Query & Transaction API
// -----------------------------------------------------------------------------
export async function query<T extends QueryRow = QueryRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
  if (driver === 'postgres') return (await (await poolReady as pg.Pool).query<T>(text, values)) as QueryResult<T>;
  if (driver === 'sqlite') return new SqliteClient().query<T>(text, values);
  return new SqlClient().query<T>(text, values);
}

export async function withTransaction<T>(callback: (client: QueryExecutor) => Promise<T>): Promise<T> {
  if (driver === 'postgres') {
    const client = await (await poolReady as pg.Pool).connect();
    const executor: QueryExecutor = { query: (text, values = []) => client.query(text, values) as unknown as Promise<QueryResult<any>> };
    try { await client.query('BEGIN'); const result = await callback(executor); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (driver === 'sqlite') {
    const db = getSqliteDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const client = new SqliteClient();
      const result = await callback(client);
      db.exec('COMMIT;');
      return result;
    } catch (error) {
      try { db.exec('ROLLBACK;'); } catch {}
      throw error;
    }
  }
  const transaction = new sql.Transaction(await poolReady as sql.ConnectionPool);
  await transaction.begin();
  try { const result = await callback(new SqlClient(transaction)); await transaction.commit(); return result; }
  catch (error) { await transaction.rollback(); throw error; }
}

export async function checkDatabaseConnection(): Promise<void> { await query('SELECT 1 AS connected'); }
export async function closeDatabase(): Promise<void> {
  if (driver === 'postgres') await (await poolReady as pg.Pool).end();
  else if (driver === 'sqlserver') await (await poolReady as sql.ConnectionPool).close();
  else if (sqliteInstance) { sqliteInstance.close(); sqliteInstance = null; }
}
export async function initDatabase() { const { runMigrations } = await import('./migrations/runner'); return runMigrations(); }
