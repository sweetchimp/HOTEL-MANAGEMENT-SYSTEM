import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const idIdx = segments.indexOf('staff') + 1
    const id = Number(segments[idIdx])
    if (!id) throw new NotFoundError('Staff ID required')

    await withConnection(async (conn) => {
      const existing = await conn.execute(
        'SELECT * FROM STAFF WHERE ID = :id',
        { id }
      )
      if (existing.rows.length === 0) throw new NotFoundError('Staff member not found')

      await conn.execute(
        "UPDATE STAFF SET IS_ACTIVE = 0 WHERE ID = :id",
        { id }
      )
    })

    return successResponse(null, 'Staff member deactivated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
