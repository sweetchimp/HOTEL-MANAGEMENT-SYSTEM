import type { Context } from '@netlify/functions'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  user_id: number
  username: string
  role: string
  full_name: string
}

export function verifyToken(event: Request): AuthUser | null {
  const authHeader = event.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }

  try {
    return jwt.verify(token, secret) as AuthUser
  } catch {
    return null
  }
}

export function requireAuth(event: Request): AuthUser {
  const user = verifyToken(event)
  if (!user) {
    throw new UnauthorizedError('Authentication required')
  }
  return user
}

export function requireAdmin(event: Request): AuthUser {
  return requireRole(event, ['ADMIN'])
}

export function requireRole(event: Request, roles: string[]): AuthUser {
  const user = requireAuth(event)
  if (!roles.includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions')
  }
  return user
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.APP_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  }
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message)
    this.name = 'BadRequestError'
  }
}
