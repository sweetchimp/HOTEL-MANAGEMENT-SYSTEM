// ============================================================
// Password Utility — Unified hash/verify for mock and Oracle modes
// Mock mode: bcrypt (for in-memory mock data)
// Oracle mode: SHA-256 hex (matches DBMS_CRYPTO.HASH_SH256)
// ============================================================

import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

const isMock = () => process.env.DB_MODE === 'mock'

export async function hashPassword(password: string): Promise<string> {
  if (isMock()) {
    return bcrypt.hash(password, 10)
  }
  return createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase()
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isMock()) {
    return bcrypt.compare(password, hash)
  }
  return createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase() === hash.toUpperCase()
}
