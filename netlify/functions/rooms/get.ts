// ============================================================
// GET /api/rooms/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireAuth } from '../_shared/middleware'
import { mapRow } from '../_shared/row-mapper'
import type { DbRoom } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const idStr = url.pathname.split('/').pop()
    const roomId = Number(idStr)

    if (!roomId) throw new NotFoundError('Room ID required')

    const room = await withConnection(async (conn) => {
      const result = await conn.execute(
        'SELECT * FROM ROOMS WHERE ROOM_ID = :room_id',
        { room_id: roomId }
      )
      if (result.rows.length === 0) return null
      return mapRow<DbRoom>(result.rows[0], 'ROOMS')
    })

    if (!room) throw new NotFoundError('Room not found')
    return successResponse(room)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
