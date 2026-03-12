import { Pool, PoolClient } from 'pg';

// ---------------------------------------------------------------------------
// Connection pool (singleton)
// ---------------------------------------------------------------------------
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Raw parameterised query (for ad-hoc SELECT / DDL in migrations)
// ---------------------------------------------------------------------------
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

// ---------------------------------------------------------------------------
// Stored-procedure / function caller
//
// All stored procedures in this project are PostgreSQL functions that return
// a set of rows (RETURNS TABLE or RETURNS SETOF).  They are invoked via:
//
//   SELECT * FROM sp_name($1, $2, ...)
//
// Usage:
//   const rows = await callProc<Staff>('sp_get_staff', [tenantId, null]);
// ---------------------------------------------------------------------------
export async function callProc<T = Record<string, unknown>>(
  procName: string,
  params: unknown[] = []
): Promise<T[]> {
  // Build positional placeholder list: $1, $2, ...
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT * FROM ${procName}(${placeholders})`;
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

// ---------------------------------------------------------------------------
// callProcOne: convenience wrapper that returns the first row or null.
// Useful for SPs that always return exactly one row (e.g. sp_create_staff).
// ---------------------------------------------------------------------------
export async function callProcOne<T = Record<string, unknown>>(
  procName: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await callProc<T>(procName, params);
  return rows.length > 0 ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// callProcVoid: call a stored procedure that returns VOID (e.g. status updates)
// ---------------------------------------------------------------------------
export async function callProcVoid(
  procName: string,
  params: unknown[] = []
): Promise<void> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT ${procName}(${placeholders})`;
  await getPool().query(sql, params);
}

// ---------------------------------------------------------------------------
// Transaction helper
// Wraps multiple SP/query calls in a BEGIN … COMMIT block.
// Automatically rolls back on any thrown error.
//
// Usage:
//   await withTransaction(async (client) => {
//     await callProcInTx(client, 'sp_process_payroll', [...]);
//     await callProcVoidInTx(client, 'sp_mark_payroll_paid', [...]);
//   });
// ---------------------------------------------------------------------------
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// In-transaction variants of callProc / callProcVoid
// ---------------------------------------------------------------------------
export async function callProcInTx<T = Record<string, unknown>>(
  client: PoolClient,
  procName: string,
  params: unknown[] = []
): Promise<T[]> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT * FROM ${procName}(${placeholders})`;
  const result = await client.query(sql, params);
  return result.rows as T[];
}

export async function callProcVoidInTx(
  client: PoolClient,
  procName: string,
  params: unknown[] = []
): Promise<void> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT ${procName}(${placeholders})`;
  await client.query(sql, params);
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

/**
 * Safely slice a date/timestamp value returned by pg into an ISO date string
 * (YYYY-MM-DD).  Centralises the repeated `.slice(0,10)` pattern used across
 * API route mappers.
 */
export function pgDateToString(value: unknown): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}
