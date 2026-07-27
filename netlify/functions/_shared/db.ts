import oracledb from 'oracledb'

let pool: oracledb.Pool | null = null

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    pool = await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectionString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    })
  }
  return pool.getConnection()
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
