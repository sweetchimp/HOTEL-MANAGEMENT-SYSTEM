// ============================================================
// POST /api/checkin/process
// Staff — checks in an existing reservation: reuses or creates
// its booking, assigns a room, and marks the guest checked in.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole, NotFoundError, BadRequestError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { isoDate } from '../_shared/availability'
import type { DbBooking, DbReservation, DbRoom, DbRoomType, ProcessCheckInRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const body: ProcessCheckInRequest = await req.json()

    if (!body.reservation_id || !body.room_id) {
      throw new BadRequestError('reservation_id and room_id are required')
    }

    const result = await withConnection(async (conn) => {
      const resResult = await conn.execute(
        'SELECT * FROM RESERVATIONS WHERE RESERVATION_ID = :reservation_id',
        { reservation_id: body.reservation_id }
      )
      const reservations = mapRows<DbReservation>(resResult.rows, 'RESERVATIONS')
      if (reservations.length === 0) throw new NotFoundError('Reservation not found')
      const reservation = reservations[0]
      if (reservation.STATUS === 'CHECKED_IN') throw new BadRequestError('Guest has already checked in')
      if (reservation.STATUS !== 'CONFIRMED') {
        throw new BadRequestError(`Reservation is ${reservation.STATUS} — only CONFIRMED reservations can check in`)
      }

      const roomResult = await conn.execute('SELECT * FROM ROOMS WHERE ROOM_ID = :room_id', {
        room_id: body.room_id,
      })
      const rooms = mapRows<DbRoom>(roomResult.rows, 'ROOMS')
      if (rooms.length === 0) throw new NotFoundError('Room not found')
      const room = rooms[0]
      if (room.STATUS !== 'AVAILABLE') {
        throw new BadRequestError(`Room ${room.ROOM_NUMBER} is not available (status: ${room.STATUS})`)
      }
      if (room.TYPE_ID !== reservation.ROOM_TYPE_ID) {
        throw new BadRequestError('Selected room does not match the reservation room type')
      }

      // Reuse the reservation's active booking, or create one
      const bookResult = await conn.execute(
        'SELECT * FROM BOOKINGS WHERE RESERVATION_ID = :reservation_id',
        { reservation_id: reservation.RESERVATION_ID }
      )
      const bookings = mapRows<DbBooking>(bookResult.rows, 'BOOKINGS')
      const existing = bookings.find(b => b.STATUS === 'ACTIVE')
      let bookingId: number

      if (existing) {
        bookingId = existing.BOOKING_ID
        if (existing.ROOM_ID !== room.ROOM_ID) {
          await conn.execute(
            'UPDATE BOOKINGS SET ROOM_ID = :room_id WHERE BOOKING_ID = :booking_id',
            { room_id: room.ROOM_ID, booking_id: bookingId }
          )
        }
      } else {
        const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES')
        const types = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
        const roomType = types.find(t => t.TYPE_ID === reservation.ROOM_TYPE_ID)
        const insert = await conn.execute(
          `INSERT INTO BOOKINGS (RESERVATION_ID, ROOM_ID, CHECK_IN_DATE, CHECK_OUT_DATE, RATE_PER_NIGHT, STATUS)
           VALUES (:reservation_id, :room_id, :check_in_date, :check_out_date, :rate_per_night, 'ACTIVE')
           RETURNING BOOKING_ID INTO :new_id`,
          {
            reservation_id: reservation.RESERVATION_ID,
            room_id: room.ROOM_ID,
            check_in_date: isoDate(reservation.CHECK_IN_DATE),
            check_out_date: isoDate(reservation.CHECK_OUT_DATE),
            rate_per_night: roomType?.BASE_PRICE || 0,
            new_id: { dir: 3001, type: 2010 },
          }
        )
        bookingId = Number(insert.rows[0]?.[0])
      }

      const checkinResult = await conn.execute(
        `INSERT INTO CHECKINS (BOOKING_ID, ACTUAL_CHECK_IN, CHECKED_IN_BY, NOTES)
         VALUES (:booking_id, CURRENT_TIMESTAMP, :checked_in_by, :notes)
         RETURNING CHECKIN_ID INTO :new_id`,
        {
          booking_id: bookingId,
          checked_in_by: user.user_id,
          notes: body.notes || '',
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const checkinId = Number(checkinResult.rows[0]?.[0])

      await conn.execute(
        "UPDATE ROOMS SET STATUS = 'OCCUPIED', UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id",
        { room_id: room.ROOM_ID }
      )
      await conn.execute(
        "UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = :reservation_id",
        { reservation_id: reservation.RESERVATION_ID }
      )

      return { checkin_id: checkinId, booking_id: bookingId, room_number: room.ROOM_NUMBER }
    })

    return successResponse(result, 'Check-in processed successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
