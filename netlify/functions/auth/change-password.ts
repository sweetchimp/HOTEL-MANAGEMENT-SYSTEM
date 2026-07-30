// ============================================================
// POST /api/auth/change-password
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireAuth } from '../_shared/middleware'
import { mapRow } from '../_shared/row-mapper'
import { verifyPassword, hashPassword } from '../_shared/password'
import type { DbUser, ChangePasswordRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const authUser = requireAuth(req)
    const body: ChangePasswordRequest = await req.json()

    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestError('Old password and new password are required')
    }

    if (body.newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters')
    }

    const result = await withConnection(async (conn) => {
      const userResult = await conn.execute(
        'SELECT * FROM USERS WHERE USER_ID = :user_id',
        { user_id: authUser.user_id }
      )

      if (userResult.rows.length === 0) {
        return { error: 'USER_NOT_FOUND' }
      }

      const user = mapRow<DbUser>(userResult.rows[0], 'USERS')

      const match = await verifyPassword(body.oldPassword, user.PASSWORD_HASH)
      if (!match) {
        return { error: 'INVALID_OLD_PASSWORD' }
      }

      const newHash = await hashPassword(body.newPassword)
      await conn.execute(
        'UPDATE USERS SET PASSWORD_HASH = :hash, FAILED_LOGIN_ATTEMPTS = 0, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :user_id',
        { hash: newHash, user_id: authUser.user_id }
      )

      return { success: true }
    })

    if ('error' in result) {
      return errorResponse(result.error, 400)
    }

    return successResponse(null, 'Password changed successfully')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
