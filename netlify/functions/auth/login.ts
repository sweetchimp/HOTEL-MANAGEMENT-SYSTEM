// ============================================================
// POST /api/auth/login
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError } from '../_shared/middleware'
import { generateAccessToken, generateRefreshToken } from '../_shared/jwt'
import { mapRows, mapRow } from '../_shared/row-mapper'
import { verifyPassword } from '../_shared/password'
import type { DbUser, DbRole, LoginRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const body: LoginRequest = await req.json()
    if (!body.username || !body.password) {
      throw new BadRequestError('Username and password are required')
    }

    const result = await withConnection(async (conn) => {
      const userResult = await conn.execute(
        'SELECT * FROM USERS WHERE USERNAME = :username',
        { username: body.username }
      )

      if (userResult.rows.length === 0) {
        return { error: 'USER_NOT_FOUND' }
      }

      const user = mapRow<DbUser>(userResult.rows[0], 'USERS')

      if (user.IS_ACTIVE !== 1) {
        return { error: 'ACCOUNT_DISABLED' }
      }

      if (user.FAILED_LOGIN_ATTEMPTS >= 5) {
        return { error: 'ACCOUNT_LOCKED' }
      }

      const passwordMatch = await verifyPassword(body.password, user.PASSWORD_HASH)
      if (!passwordMatch) {
        await conn.execute(
          'UPDATE USERS SET FAILED_LOGIN_ATTEMPTS = FAILED_LOGIN_ATTEMPTS + 1, UPDATED_AT = CURRENT_TIMESTAMP WHERE USERNAME = :username',
          { username: body.username }
        )
        return { error: 'INVALID_PASSWORD' }
      }

      // Get role name
      const roleResult = await conn.execute(
        'SELECT * FROM ROLES WHERE ROLE_ID = :role_id',
        { role_id: user.ROLE_ID }
      )
      const roles = mapRows<DbRole>(roleResult.rows, 'ROLES')
      const roleName = roles.length > 0 ? roles[0].ROLE_NAME : 'RECEPTIONIST'

      // Reset failed attempts, update last login
      await conn.execute(
        'UPDATE USERS SET FAILED_LOGIN_ATTEMPTS = 0, LAST_LOGIN = CURRENT_TIMESTAMP, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :user_id',
        { user_id: user.USER_ID }
      )

      const accessToken = generateAccessToken(user, roleName)
      const refreshToken = generateRefreshToken(user)

      return {
        user: {
          user_id: user.USER_ID,
          username: user.USERNAME,
          full_name: user.FULL_NAME,
          email: user.EMAIL,
          role: roleName,
          is_active: user.IS_ACTIVE === 1,
        },
        accessToken,
        refreshToken,
      }
    })

    if ('error' in result) {
      return errorResponse(result.error, result.error === 'USER_NOT_FOUND' ? 401 : 403)
    }

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
