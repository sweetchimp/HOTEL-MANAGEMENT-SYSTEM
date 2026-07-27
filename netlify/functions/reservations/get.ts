// ============================================================
// GET /api/reservations/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireAuth } from '../_shared/middleware'
import { mapRow } from '../_shared/row-mapper'
import type { DbReservation } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const resId = Number(url.pathname.split('/').pop())
    if (!resId) throw new NotFoundError('Reservation ID required')

    const reservation = await withConnection(async (conn) => {
      const result = await conn.execute(
        'SELECT * FROM RESERVATIONS WHERE RESERVATION_ID = :id', { id: resId }
      )
      if (result.rows.length === 0) return null
      return mapRow<DbReservation>(result.rows[0], 'RESERVATIONS')
    })

    if (!reservation) throw new NotFoundError('Reservation not found')
    return successResponse(reservation)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
