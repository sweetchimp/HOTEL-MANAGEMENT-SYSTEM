// ============================================================
// POST /api/auth/refresh
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError } from '../_shared/middleware'
import { verifyRefreshToken, generateAccessToken } from '../_shared/jwt'
import { mapRows, mapRow } from '../_shared/row-mapper'
import type { DbUser, DbRole, RefreshRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const body: RefreshRequest = await req.json()
    if (!body.refreshToken) {
      throw new BadRequestError('Refresh token is required')
    }

    const decoded = verifyRefreshToken(body.refreshToken)
    if (decoded.type !== 'refresh') {
      return errorResponse('Invalid token type', 401)
    }

    const result = await withConnection(async (conn) => {
      const userResult = await conn.execute(
        'SELECT * FROM USERS WHERE USER_ID = :user_id AND IS_ACTIVE = 1',
        { user_id: decoded.user_id }
      )

      if (userResult.rows.length === 0) {
        return { error: 'USER_NOT_FOUND' }
      }

      const user = mapRow<DbUser>(userResult.rows[0], 'USERS')

      const roleResult = await conn.execute(
        'SELECT * FROM ROLES WHERE ROLE_ID = :role_id',
        { role_id: user.ROLE_ID }
      )
      const roles = mapRows<DbRole>(roleResult.rows, 'ROLES')
      const roleName = roles.length > 0 ? roles[0].ROLE_NAME : 'RECEPTIONIST'

      const accessToken = generateAccessToken(user, roleName)
      return { accessToken }
    })

    if ('error' in result) {
      return errorResponse(result.error, 401)
    }

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return errorResponse('Invalid refresh token', 401)
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return errorResponse('Refresh token expired', 401)
    }
    return errorResponse('Internal server error')
  }
}
