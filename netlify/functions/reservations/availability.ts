// ============================================================
// GET /api/reservations/availability
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const checkIn = url.searchParams.get('check_in')
    const checkOut = url.searchParams.get('check_out')
    const roomType = url.searchParams.get('room_type')

    if (!checkIn || !checkOut || !roomType) {
      throw new BadRequestError('check_in, check_out, and room_type are required')
    }

    const result = await withConnection(async (conn) => {
      const availResult = await conn.execute(
        `SELECT r.ROOM_ID, r.ROOM_NUMBER, r.FLOOR, rt.TYPE_NAME, rt.BASE_PRICE
         FROM ROOMS r
         JOIN ROOM_TYPES rt ON r.TYPE_ID = rt.TYPE_ID
         WHERE r.TYPE_ID = :type_id AND r.STATUS = 'AVAILABLE'
         AND r.ROOM_ID NOT IN (
           SELECT b.ROOM_ID FROM BOOKINGS b
           JOIN RESERVATIONS res ON b.RESERVATION_ID = res.RESERVATION_ID
           WHERE b.STATUS = 'ACTIVE' AND res.STATUS IN ('CONFIRMED', 'CHECKED_IN')
           AND b.CHECK_IN_DATE < :check_out AND b.CHECK_OUT_DATE > :check_in
         )
         ORDER BY r.ROOM_NUMBER`,
        { type_id: Number(roomType), check_in: checkIn, check_out: checkOut }
      )

      return {
        available: availResult.rows.length,
        rooms: availResult.rows.map((row: unknown[]) => ({
          room_id: row[0], room_number: row[1], floor: row[2],
          type_name: row[3], base_price: row[4],
        })),
      }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
