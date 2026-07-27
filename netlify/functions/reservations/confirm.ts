// ============================================================
// POST /api/reservations/:id/confirm
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
        "UPDATE RESERVATIONS SET STATUS = 'CONFIRMED', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = :id AND STATUS = 'PENDING'",
        { id: resId }
      )
      return { confirmed: updateResult.rowsAffected > 0 }
    })

    if (!result.confirmed) {
      return errorResponse('Reservation not found or not in PENDING status', 400)
    }

    return successResponse(null, 'Reservation confirmed')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
