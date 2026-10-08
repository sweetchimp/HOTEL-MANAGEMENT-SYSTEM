// ============================================================
// POST /api/checkin/walk-in
// Staff — full walk-in check-in: creates (or reuses) the guest,
// reservation, and booking, assigns the room, and checks them in.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole, BadRequestError } from '../_shared/middleware'
import { mapRows, mapRow } from '../_shared/row-mapper'
import { computeAvailableRooms, isoDate, nightsBetween } from '../_shared/availability'
import type { DbGuest, DbRoomType, WalkInCheckInRequest } from '../_shared/types'

const ID_TYPES = ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'OTHER']

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const body: WalkInCheckInRequest = await req.json()

    if (!body.guest_name || body.guest_name.trim().length < 3) {
      throw new BadRequestError('guest_name must be at least 3 characters')
    }
    if (!body.guest_phone || body.guest_phone.replace(/\D/g, '').length < 7) {
      throw new BadRequestError('A valid guest_phone is required')
    }
    if (!body.id_type || !ID_TYPES.includes(body.id_type)) {
      throw new BadRequestError(`id_type must be one of: ${ID_TYPES.join(', ')}`)
    }
    if (!body.id_number || body.id_number.trim().length < 4) {
      throw new BadRequestError('id_number must be at least 4 characters')
    }
    if (!body.room_type_id || !body.room_id) {
      throw new BadRequestError('room_type_id and room_id are required')
    }
    if (!body.num_guests || Number(body.num_guests) < 1) {
      throw new BadRequestError('num_guests must be at least 1')
    }

    const today = isoDate(new Date())
    const checkIn = String(body.check_in_date || '')
    const checkOut = String(body.check_out_date || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      throw new BadRequestError('Dates must be in YYYY-MM-DD format')
    }
    if (checkIn < today) throw new BadRequestError('Check-in cannot be in the past')
    if (checkOut <= checkIn) throw new BadRequestError('Check-out must be after check-in')
    const nights = nightsBetween(checkIn, checkOut)
    if (nights < 1 || nights > 365) throw new BadRequestError('Stay must be between 1 and 365 nights')

    const result = await withConnection(async (conn) => {
      const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES')
      const types = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
      const roomType = types.find(t => t.TYPE_ID === Number(body.room_type_id))
      if (!roomType) throw new BadRequestError('Unknown room type')
      if (Number(body.num_guests) > roomType.MAX_OCCUPANCY) {
        throw new BadRequestError(`${roomType.TYPE_NAME} sleeps a maximum of ${roomType.MAX_OCCUPANCY} guests`)
      }

      // Verify the chosen room is truly available for these dates
      const available = await computeAvailableRooms(conn, checkIn, checkOut, Number(body.room_type_id))
      const chosen = available.find(r => r.room_id === Number(body.room_id))
      if (!chosen) {
        throw new BadRequestError('The selected room is not available for these dates')
      }

      // Find existing guest by ID number, otherwise create one
      const guestResult = await conn.execute('SELECT * FROM GUESTS WHERE ID_NUMBER = :id_number', {
        id_number: body.id_number.trim(),
      })
      let guestId: number
      if (guestResult.rows.length > 0) {
        guestId = mapRow<DbGuest>(guestResult.rows[0], 'GUESTS').GUEST_ID
      } else {
        const nameParts = body.guest_name.trim().split(/\s+/)
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || firstName
        const guestInsert = await conn.execute(
          `INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER)
           VALUES (:first_name, :last_name, :email, :phone, :id_type, :id_number)
           RETURNING GUEST_ID INTO :new_id`,
          {
            first_name: firstName,
            last_name: lastName,
            email: body.guest_email?.trim() || null,
            phone: body.guest_phone.trim(),
            id_type: body.id_type,
            id_number: body.id_number.trim(),
            new_id: { dir: 3001, type: 2010 },
          }
        )
        guestId = Number(guestInsert.rows[0]?.[0])
      }

      const specialRequests = [
        body.notes?.trim(),
        `Party of ${body.num_guests}`,
      ].filter(Boolean).join(' — ')

      const resInsert = await conn.execute(
        `INSERT INTO RESERVATIONS
           (GUEST_ID, ROOM_TYPE_ID, CHECK_IN_DATE, CHECK_OUT_DATE, SPECIAL_REQUESTS, STATUS, CREATED_BY)
         VALUES
           (:guest_id, :room_type_id, :check_in_date, :check_out_date, :special_requests, 'CONFIRMED', :created_by)
         RETURNING RESERVATION_ID INTO :new_id`,
        {
          guest_id: guestId,
          room_type_id: Number(body.room_type_id),
          check_in_date: checkIn,
          check_out_date: checkOut,
          special_requests: specialRequests,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const reservationId = Number(resInsert.rows[0]?.[0])

      const bookingInsert = await conn.execute(
        `INSERT INTO BOOKINGS (RESERVATION_ID, ROOM_ID, CHECK_IN_DATE, CHECK_OUT_DATE, RATE_PER_NIGHT, STATUS)
         VALUES (:reservation_id, :room_id, :check_in_date, :check_out_date, :rate_per_night, 'ACTIVE')
         RETURNING BOOKING_ID INTO :new_id`,
        {
          reservation_id: reservationId,
          room_id: Number(body.room_id),
          check_in_date: checkIn,
          check_out_date: checkOut,
          rate_per_night: roomType.BASE_PRICE,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const bookingId = Number(bookingInsert.rows[0]?.[0])

      const checkinResult = await conn.execute(
        `INSERT INTO CHECKINS (BOOKING_ID, ACTUAL_CHECK_IN, CHECKED_IN_BY, NOTES)
         VALUES (:booking_id, CURRENT_TIMESTAMP, :checked_in_by, :notes)
         RETURNING CHECKIN_ID INTO :new_id`,
        {
          booking_id: bookingId,
          checked_in_by: user.user_id,
          notes: body.notes?.trim() || '',
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const checkinId = Number(checkinResult.rows[0]?.[0])

      await conn.execute(
        "UPDATE ROOMS SET STATUS = 'OCCUPIED', UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id",
        { room_id: Number(body.room_id) }
      )
      await conn.execute(
        "UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = :reservation_id",
        { reservation_id: reservationId }
      )

      return {
        checkin_id: checkinId,
        booking_id: bookingId,
        reservation_id: reservationId,
        guest_id: guestId,
        room_number: chosen.room_number,
        nights,
        total: chosen.total,
      }
    })

    return successResponse(result, 'Walk-in check-in complete', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
