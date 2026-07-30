// ============================================================
// PATCH /api/rooms/:id/status
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { UpdateRoomStatusRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PATCH') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN'])
    const url = new URL(req.url)
    const roomId = Number(url.pathname.split('/').filter(Boolean).pop())
    const body: UpdateRoomStatusRequest = await req.json()

    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']
    if (!body.status || !validStatuses.includes(body.status)) {
      throw new BadRequestError(`Status must be one of: ${validStatuses.join(', ')}`)
    }

    await withConnection(async (conn) => {
      await conn.execute(
        'UPDATE ROOMS SET STATUS = :status, UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id',
        { status: body.status, room_id: roomId }
      )
    })

    return successResponse(null, 'Room status updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
