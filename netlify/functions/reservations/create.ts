// ============================================================
// POST /api/reservations
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireAuth } from '../_shared/middleware'
import type { CreateReservationRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const authUser = requireAuth(req)
    const body: CreateReservationRequest = await req.json()

    if (!body.guest_id || !body.room_type_id || !body.check_in_date || !body.check_out_date) {
      throw new BadRequestError('guest_id, room_type_id, check_in_date, and check_out_date are required')
    }

    if (new Date(body.check_out_date) <= new Date(body.check_in_date)) {
      throw new BadRequestError('Check-out date must be after check-in date')
    }

    const result = await withConnection(async (conn) => {
      // Validate guest exists
      const guestResult = await conn.execute('SELECT GUEST_ID FROM GUESTS WHERE GUEST_ID = :id', { id: body.guest_id })
      if (guestResult.rows.length === 0) throw new BadRequestError('Guest not found')

      // Check availability
      const availResult = await conn.execute(
        `SELECT COUNT(*) FROM ROOMS r
         WHERE r.TYPE_ID = :type_id AND r.STATUS = 'AVAILABLE'
         AND r.ROOM_ID NOT IN (
           SELECT b.ROOM_ID FROM BOOKINGS b
           JOIN RESERVATIONS res ON b.RESERVATION_ID = res.RESERVATION_ID
           WHERE b.STATUS = 'ACTIVE' AND res.STATUS IN ('CONFIRMED', 'CHECKED_IN')
           AND b.CHECK_IN_DATE < :check_out AND b.CHECK_OUT_DATE > :check_in
         )`,
        { type_id: body.room_type_id, check_in: body.check_in_date, check_out: body.check_out_date }
      )
      const available = Number(availResult.rows[0]?.[0] || 0)
      if (available === 0) throw new BadRequestError('No rooms available for the selected dates and type')

      const resResult = await conn.execute(
        'INSERT INTO RESERVATIONS (GUEST_ID, ROOM_TYPE_ID, CHECK_IN_DATE, CHECK_OUT_DATE, SPECIAL_REQUESTS, CREATED_BY) VALUES (:guest_id, :type_id, :check_in, :check_out, :requests, :created_by) RETURNING RESERVATION_ID INTO :new_id',
        {
          guest_id: body.guest_id, type_id: body.room_type_id,
          check_in: body.check_in_date, check_out: body.check_out_date,
          requests: body.special_requests || null, created_by: authUser.user_id,
          new_id: { dir: 3001, type: 2010 }
        }
      )
      return { reservation_id: resResult.rows[0]?.[0] }
    })

    return successResponse(result, 'Reservation created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
