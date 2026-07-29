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
      connectionString: process.env.ORACLE_SID
        ? `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}:${process.env.ORACLE_SID}`
        : `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_SERVICE_NAME || 'XEPDB1'}`,
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

    const result = await this.conn.execute(sql, binds, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_ARRAY,
    })

    const rows = (result.rows || []) as unknown[][]
    const rowsAffected = (result.rowsAffected || []).reduce((sum: number, n: number) => sum + n, 0)

    return { rows, rowsAffected, metaData: result.metaData }
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
