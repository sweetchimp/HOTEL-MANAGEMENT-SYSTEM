// ============================================================
// PUT /api/reservations/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import type { UpdateReservationRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const resId = Number(url.pathname.split('/').pop())
    const body: UpdateReservationRequest = await req.json()

    await withConnection(async (conn) => {
      const sets: string[] = []
      const binds: Record<string, unknown> = { id: resId }

      if (body.check_in_date !== undefined) { sets.push('CHECK_IN_DATE = :check_in'); binds.check_in = body.check_in_date }
      if (body.check_out_date !== undefined) { sets.push('CHECK_OUT_DATE = :check_out'); binds.check_out = body.check_out_date }
      if (body.room_type_id !== undefined) { sets.push('ROOM_TYPE_ID = :type_id'); binds.type_id = body.room_type_id }
      if (body.special_requests !== undefined) { sets.push('SPECIAL_REQUESTS = :requests'); binds.requests = body.special_requests }

      if (sets.length === 0) return
      sets.push('UPDATED_AT = CURRENT_TIMESTAMP')
      await conn.execute(`UPDATE RESERVATIONS SET ${sets.join(', ')} WHERE RESERVATION_ID = :id`, binds)
    })

    return successResponse(null, 'Reservation updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
