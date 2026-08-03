// ============================================================
// Oracle Database Connection Layer
// Supports both real Oracle (thin mode) and mock mode
// ============================================================

import type oracledb from 'oracledb'

let pool: oracledb.Pool | null = null

export interface QueryResult {
  rows: unknown[][]
  rowsAffected: number
  metaData?: unknown[]
  outBinds?: unknown
}

export interface DBConnection {
  execute(sql: string, binds?: Record<string, unknown>): Promise<QueryResult>
  close(): Promise<void>
}

async function createOraclePool() {
  const oracledbMod = await import('oracledb')
  const oracledb = oracledbMod.default || oracledbMod

  if (!pool) {
    pool = await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectionString: process.env.ORACLE_SERVICE_NAME
        ? `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_SERVICE_NAME}`
        : `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}:${process.env.ORACLE_SID || 'XE'}`,
      poolMin: Number(process.env.ORACLE_POOL_MIN) || 1,
      poolMax: Number(process.env.ORACLE_POOL_MAX) || 5,
      poolIncrement: 1,
    })
  }
  return pool
}

class OracleConnection implements DBConnection {
  private conn: oracledb.Connection

  constructor(conn: oracledb.Connection) {
    this.conn = conn
  }

  async execute(sql: string, binds: Record<string, unknown> = {}): Promise<QueryResult> {
    const oracledbMod = await import('oracledb')
    const oracledb = oracledbMod.default || oracledbMod

    // Normalize legacy bind definitions ({ dir: 3001, type: 2010 }) that the
    // handlers were written against for mock mode. oracledb 6.x uses different
    // constants (BIND_OUT = 3003, NUMBER = DbType object), and `dir: 3001`
    // actually means BIND_IN, so remap to a true OUT bind.
    const normalized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(binds)) {
      if (value && typeof value === 'object' && 'dir' in value && typeof (value as Record<string, unknown>).dir === 'number') {
        normalized[key] = {
          ...(value as Record<string, unknown>),
          dir: (value as Record<string, unknown>).dir === 3001 ? oracledb.BIND_OUT : (value as Record<string, unknown>).dir,
          type: (value as Record<string, unknown>).type === 2010 ? oracledb.NUMBER : (value as Record<string, unknown>).type,
        }
      } else {
        normalized[key] = value
      }
    }

    const result = await this.conn.execute(sql, normalized, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_ARRAY,
    })

    let rows = (result.rows || []) as unknown[][]
    if (result.outBinds) {
      const ob = result.outBinds as unknown
      const values = Array.isArray(ob) ? ob : Object.values(ob as Record<string, unknown>)
      const first = values[0]
      if (Array.isArray(first)) {
        rows = first.map((v: unknown) => [v])
      }
    }
    const affected = result.rowsAffected
    const rowsAffected = typeof affected === 'number'
      ? affected
      : (affected || []).reduce((sum: number, n: number) => sum + n, 0)

    return { rows, rowsAffected, metaData: result.metaData, outBinds: result.outBinds }
  }

  async close() {
    try {
      await this.conn.close()
    } catch {
      // Silently handle close errors
    }
  }
}

export async function getConnection(): Promise<DBConnection> {
  if (process.env.DB_MODE === 'mock') {
    const { getMockPool } = await import('./db-mock')
    const mockPool = getMockPool()
    return mockPool.getConnection() as Promise<DBConnection>
  }

  const oraclePool = await createOraclePool()
  const conn = await oraclePool.getConnection()
  // The app sends ISO dates ('YYYY-MM-DD'). Without matching NLS formats,
  // Oracle rejects string-to-DATE/TIMESTAMP conversions with ORA-01861 and
  // date comparisons silently misbehave.
  await conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'")
  await conn.execute("ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD'")
  return new OracleConnection(conn)
}

export async function withConnection<T>(fn: (conn: DBConnection) => Promise<T>): Promise<T> {
  const conn = await getConnection()
  try {
    const result = await fn(conn)
    return result
  } finally {
    await conn.close()
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    return await withConnection(async (conn) => {
      await conn.execute('SELECT 1 FROM DUAL')
      return true
    })
  } catch {
    return false
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
