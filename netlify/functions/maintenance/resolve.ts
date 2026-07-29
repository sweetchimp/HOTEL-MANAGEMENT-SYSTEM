import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import type { ResolveMaintenanceRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const idIdx = segments.indexOf('maintenance') + 1
    const id = Number(segments[idIdx])
    if (!id) throw new NotFoundError('Maintenance ID required')

    const body: ResolveMaintenanceRequest = await req.json()
    if (!body.notes) throw new BadRequestError('notes are required')

    await withConnection(async (conn) => {
      const existing = await conn.execute(
        'SELECT * FROM MAINTENANCE WHERE ID = :id',
        { id }
      )
      if (existing.rows.length === 0) throw new NotFoundError('Maintenance record not found')

      await conn.execute(
        "UPDATE MAINTENANCE SET STATUS = 'RESOLVED', NOTES = :notes, RESOLVED_DATE = :resolved_date WHERE ID = :id",
        {
          notes: body.notes,
          resolved_date: body.resolved_date || new Date().toISOString().split('T')[0],
          id,
        }
      )
    })

    return successResponse(null, 'Maintenance issue resolved')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
