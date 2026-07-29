import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin, NotFoundError } from '../_shared/middleware'
import type { UpdateUserRoleRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    const user = requireAdmin(req)
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const userId = Number(pathParts[pathParts.indexOf('users') + 1])

    if (!userId) {
      return errorResponse('Invalid user ID', 400)
    }

    const body: UpdateUserRoleRequest = await req.json()
    if (!body.role_id) {
      return errorResponse('role_id is required', 400)
    }

    await withConnection(async (conn) => {
      const result = await conn.execute(
        'UPDATE USERS SET ROLE_ID = :role_id, UPDATED_AT = CURRENT_TIMESTAMP WHERE USER_ID = :p_user_id',
        { role_id: body.role_id, p_user_id: userId }
      )

      if (result.rowsAffected === 0) {
        throw new NotFoundError('User not found')
      }

      await conn.execute(
        `INSERT INTO AUDIT_LOG (ACTION, ENTITY_TYPE, ENTITY_ID, PERFORMED_BY, DETAILS)
         VALUES ('UPDATE', 'USER', :entity_id, :performed_by, :details)`,
        { entity_id: userId, performed_by: user.user_id, details: `Updated user ${userId} role to role_id ${body.role_id}` }
      )
    })

    return successResponse({ message: 'User role updated successfully' })
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
