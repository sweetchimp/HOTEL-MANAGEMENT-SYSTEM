// ============================================================
// PUT /api/rooms/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import type { UpdateRoomRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN'])
    const url = new URL(req.url)
    const roomId = Number(url.pathname.split('/').pop())
    const body: UpdateRoomRequest = await req.json()

    await withConnection(async (conn) => {
      const sets: string[] = []
      const binds: Record<string, unknown> = { room_id: roomId }

      if (body.room_number !== undefined) { sets.push('ROOM_NUMBER = :room_number'); binds.room_number = body.room_number }
      if (body.type_id !== undefined) { sets.push('TYPE_ID = :type_id'); binds.type_id = body.type_id }
      if (body.floor !== undefined) { sets.push('FLOOR = :floor'); binds.floor = body.floor }
      if (body.description !== undefined) { sets.push('DESCRIPTION = :description'); binds.description = body.description }

      if (sets.length === 0) return

      sets.push('UPDATED_AT = CURRENT_TIMESTAMP')
      await conn.execute(`UPDATE ROOMS SET ${sets.join(', ')} WHERE ROOM_ID = :room_id`, binds)
    })

    return successResponse(null, 'Room updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
