// ============================================================
// POST /api/reservations/:id/cancel
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const resId = Number(url.pathname.split('/').filter(Boolean).slice(-2, -1)[0])

    const result = await withConnection(async (conn) => {
      const updateResult = await conn.execute(
        "UPDATE RESERVATIONS SET STATUS = 'CANCELLED', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = :id AND STATUS IN ('PENDING', 'CONFIRMED')",
        { id: resId }
      )

      if (updateResult.rowsAffected > 0) {
        await conn.execute(
          "UPDATE BOOKINGS SET STATUS = 'CANCELLED' WHERE RESERVATION_ID = :id AND STATUS = 'ACTIVE'",
          { id: resId }
        )
        return { cancelled: true }
      }
      return { cancelled: false }
    })

    if (!result.cancelled) {
      return errorResponse('Reservation cannot be cancelled', 400)
    }

    return successResponse(null, 'Reservation cancelled')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
