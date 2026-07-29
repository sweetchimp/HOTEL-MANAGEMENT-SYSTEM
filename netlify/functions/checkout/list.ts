// ============================================================
// GET /api/checkout/list
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT co.CHECKOUT_ID, co.CHECKIN_ID, co.ACTUAL_CHECK_OUT, co.CHECKED_OUT_BY, co.NOTES,
                c.BOOKING_ID, c.ACTUAL_CHECK_IN,
                b.ROOM_ID, b.CHECK_IN_DATE, b.CHECK_OUT_DATE, b.RATE_PER_NIGHT,
                r.RESERVATION_ID, r.GUEST_ID, r.ROOM_TYPE_ID,
                g.FIRST_NAME, g.LAST_NAME, g.EMAIL, g.PHONE,
                rm.ROOM_NUMBER, rm.FLOOR
         FROM CHECKOUTS co
         JOIN CHECKINS c ON co.CHECKIN_ID = c.CHECKIN_ID
         JOIN BOOKINGS b ON c.BOOKING_ID = b.BOOKING_ID
         JOIN RESERVATIONS r ON b.RESERVATION_ID = r.RESERVATION_ID
         JOIN GUESTS g ON r.GUEST_ID = g.GUEST_ID
         JOIN ROOMS rm ON b.ROOM_ID = rm.ROOM_ID
         ORDER BY co.ACTUAL_CHECK_OUT DESC`
      )

      const checkouts = result.rows.map(row => ({
        CHECKOUT_ID: row[0],
        CHECKIN_ID: row[1],
        ACTUAL_CHECK_OUT: row[2],
        CHECKED_OUT_BY: row[3],
        NOTES: row[4],
        BOOKING_ID: row[5],
        ACTUAL_CHECK_IN: row[6],
        ROOM_ID: row[7],
        CHECK_IN_DATE: row[8],
        CHECK_OUT_DATE: row[9],
        RATE_PER_NIGHT: row[10],
        RESERVATION_ID: row[11],
        GUEST_ID: row[12],
        ROOM_TYPE_ID: row[13],
        FIRST_NAME: row[14],
        LAST_NAME: row[15],
        EMAIL: row[16],
        PHONE: row[17],
        ROOM_NUMBER: row[18],
        FLOOR: row[19],
      }))

      return checkouts
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
