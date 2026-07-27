// ============================================================
// GET /api/auth/me
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRow, mapRows } from '../_shared/row-mapper'
import type { DbUser, DbRole } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const authUser = requireAuth(req)

    const result = await withConnection(async (conn) => {
      const userResult = await conn.execute(
        'SELECT * FROM USERS WHERE USER_ID = :user_id',
        { user_id: authUser.user_id }
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

      return {
        user: {
          user_id: user.USER_ID,
          username: user.USERNAME,
          full_name: user.FULL_NAME,
          email: user.EMAIL,
          role: roleName,
          is_active: user.IS_ACTIVE === 1,
          last_login: user.LAST_LOGIN,
          created_at: user.CREATED_AT,
        },
      }
    })

    if ('error' in result) {
      return errorResponse(result.error, 404)
    }

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
