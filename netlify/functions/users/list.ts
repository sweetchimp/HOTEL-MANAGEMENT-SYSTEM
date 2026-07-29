import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAdmin(req)

    const result = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT u.USER_ID, u.USERNAME, u.FULL_NAME, u.EMAIL, u.ROLE_ID, u.IS_ACTIVE, u.LAST_LOGIN, u.CREATED_AT,
                r.ROLE_NAME
         FROM USERS u
         JOIN ROLES r ON u.ROLE_ID = r.ROLE_ID
         ORDER BY u.FULL_NAME`
      )

      return result.rows.map((row: unknown[]) => ({
        user_id: row[0],
        username: row[1],
        full_name: row[2],
        email: row[3],
        role_id: row[4],
        is_active: row[5],
        last_login: row[6],
        created_at: row[7],
        role_name: row[8],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
