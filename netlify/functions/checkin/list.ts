// ============================================================
// GET /api/checkin/list
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbCheckin } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT c.CHECKIN_ID, c.BOOKING_ID, c.ACTUAL_CHECK_IN, c.CHECKED_IN_BY, c.NOTES,
                b.ROOM_ID, b.CHECK_IN_DATE, b.CHECK_OUT_DATE, b.RATE_PER_NIGHT,
                r.RESERVATION_ID, r.GUEST_ID, r.ROOM_TYPE_ID, r.STATUS as RESERVATION_STATUS,
                g.FIRST_NAME, g.LAST_NAME, g.EMAIL, g.PHONE,
                rm.ROOM_NUMBER, rm.FLOOR, rm.STATUS as ROOM_STATUS
         FROM CHECKINS c
         JOIN BOOKINGS b ON c.BOOKING_ID = b.BOOKING_ID
         JOIN RESERVATIONS r ON b.RESERVATION_ID = r.RESERVATION_ID
         JOIN GUESTS g ON r.GUEST_ID = g.GUEST_ID
         JOIN ROOMS rm ON b.ROOM_ID = rm.ROOM_ID
         ORDER BY c.ACTUAL_CHECK_IN DESC`
      )

      const checkins = result.rows.map(row => ({
        CHECKIN_ID: row[0],
        BOOKING_ID: row[1],
        ACTUAL_CHECK_IN: row[2],
        CHECKED_IN_BY: row[3],
        NOTES: row[4],
        ROOM_ID: row[5],
        CHECK_IN_DATE: row[6],
        CHECK_OUT_DATE: row[7],
        RATE_PER_NIGHT: row[8],
        RESERVATION_ID: row[9],
        GUEST_ID: row[10],
        ROOM_TYPE_ID: row[11],
        RESERVATION_STATUS: row[12],
        FIRST_NAME: row[13],
        LAST_NAME: row[14],
        EMAIL: row[15],
        PHONE: row[16],
        ROOM_NUMBER: row[17],
        FLOOR: row[18],
        ROOM_STATUS: row[19],
      }))

      return checkins
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
