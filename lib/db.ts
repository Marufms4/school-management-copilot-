import sql from 'mssql';

// ---------------------------------------------------------------------------
// SQL Server connection config
// ---------------------------------------------------------------------------
const config: sql.config = {
  server:   process.env.DB_SERVER   || 'localhost',
  database: process.env.DB_NAME     || 'EduCoreSaaS',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt:               process.env.DB_ENCRYPT      !== 'false',
    trustServerCertificate: process.env.DB_TRUST_CERT  !== 'false',
  },
  pool: {
    max:                10,
    min:                0,
    idleTimeoutMillis:  30_000,
  },
  connectionTimeout: 15_000,
  requestTimeout:    30_000,
};

// ---------------------------------------------------------------------------
// Connection pool (singleton promise)
// ---------------------------------------------------------------------------
let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((err: Error) => {
        console.error('[DB] Connection pool error:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

// ---------------------------------------------------------------------------
// Raw parameterised query
// params is a key→value map of named input parameters  (@key in the SQL)
// ---------------------------------------------------------------------------
export async function query<T = Record<string, unknown>>(
  sqlText: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const pool    = await getPool();
  const request = pool.request();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value ?? null);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset as T[];
}

// ---------------------------------------------------------------------------
// Stored-procedure caller
//
// All stored procedures accept named parameters.
// Usage:
//   const rows = await callProc<Staff>('sp_get_staff', {
//     p_tenant_id: tenantId,
//     p_status: null,
//   });
// ---------------------------------------------------------------------------
export async function callProc<T = Record<string, unknown>>(
  procName: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const pool    = await getPool();
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value ?? null);
  }
  const result = await request.execute(procName);
  return result.recordset as T[];
}

// ---------------------------------------------------------------------------
// callProcOne: convenience wrapper – returns first row or null
// ---------------------------------------------------------------------------
export async function callProcOne<T = Record<string, unknown>>(
  procName: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  const rows = await callProc<T>(procName, params);
  return rows.length > 0 ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// callProcVoid: call a stored procedure that returns no result set
// ---------------------------------------------------------------------------
export async function callProcVoid(
  procName: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  const pool    = await getPool();
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value ?? null);
  }
  await request.execute(procName);
}

// ---------------------------------------------------------------------------
// Transaction helper
// ---------------------------------------------------------------------------
export async function withTransaction<T>(
  fn: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool        = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await fn(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ---------------------------------------------------------------------------
// In-transaction stored-procedure caller
// ---------------------------------------------------------------------------
export async function callProcInTx<T = Record<string, unknown>>(
  transaction: sql.Transaction,
  procName: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const request = new sql.Request(transaction);
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value ?? null);
  }
  const result = await request.execute(procName);
  return result.recordset as T[];
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

/**
 * Safely convert a date/datetime value returned by mssql into an ISO date
 * string (YYYY-MM-DD).
 */
export function dateToString(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

