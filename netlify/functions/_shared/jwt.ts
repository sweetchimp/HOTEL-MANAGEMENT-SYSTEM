// ============================================================
// JWT Token Utilities
// ============================================================

import jwt from 'jsonwebtoken'
import type { DbUser } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change'
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m'
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'

export interface TokenPayload {
  user_id: number
  username: string
  full_name: string
  email: string
  role: string
}

export function generateAccessToken(user: DbUser, roleName: string): string {
  const payload: TokenPayload = {
    user_id: user.USER_ID,
    username: user.USERNAME,
    full_name: user.FULL_NAME,
    email: user.EMAIL,
    role: roleName,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function generateRefreshToken(user: DbUser): string {
  return jwt.sign(
    { user_id: user.USER_ID, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  )
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): { user_id: number; type: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { user_id: number; type: string }
}
