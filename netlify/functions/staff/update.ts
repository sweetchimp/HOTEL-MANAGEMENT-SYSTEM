import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import type { UpdateStaffRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const url = new URL(req.url)
    const id = Number(url.pathname.split('/').pop())
    if (!id) throw new NotFoundError('Staff ID required')

    const body: UpdateStaffRequest = await req.json()

    await withConnection(async (conn) => {
      const existing = await conn.execute(
        'SELECT * FROM STAFF WHERE ID = :id',
        { id }
      )
      if (existing.rows.length === 0) throw new NotFoundError('Staff member not found')

      const updates: string[] = []
      const binds: Record<string, unknown> = { id }

      if (body.full_name) { updates.push('FULL_NAME = :full_name'); binds.full_name = body.full_name }
      if (body.email) { updates.push('EMAIL = :email'); binds.email = body.email }
      if (body.phone !== undefined) { updates.push('PHONE = :phone'); binds.phone = body.phone }
      if (body.department) { updates.push('DEPARTMENT = :department'); binds.department = body.department }
      if (body.position) { updates.push('POSITION = :position'); binds.position = body.position }
      if (body.salary !== undefined) { updates.push('SALARY = :salary'); binds.salary = body.salary }

      if (updates.length === 0) return

      await conn.execute(
        `UPDATE STAFF SET ${updates.join(', ')} WHERE ID = :id`,
        binds
      )
    })

    return successResponse(null, 'Staff member updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
