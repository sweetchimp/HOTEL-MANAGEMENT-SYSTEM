// ============================================================
// DELETE /api/rooms/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'DELETE') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN'])
    const url = new URL(req.url)
    const roomId = Number(url.pathname.split('/').pop())

    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM ROOMS WHERE ROOM_ID = :room_id', { room_id: roomId })
    })

    return successResponse(null, 'Room deleted')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
