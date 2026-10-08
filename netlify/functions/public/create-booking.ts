// ============================================================
// POST /api/public/bookings
// Public — submits a booking request (status 'pending').
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { computeAvailableRooms, nightsBetween } from '../_shared/availability'
import { sendEmail } from '../_shared/email'
import { bookingReceivedEmail } from '../_shared/email-templates'
import type { PublicBookingRequest, DbRoomType } from '../_shared/types'

const ID_TYPES = ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'OTHER']
const PAYMENT_METHODS = ['CARD', 'CASH', 'BANK_TRANSFER']

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const body: PublicBookingRequest = await req.json()

    if (!body.guest_name || body.guest_name.trim().length < 3) {
      throw new BadRequestError('Full name is required (at least 3 characters)')
    }
    if (!body.guest_email || !/^\S+@\S+\.\S+$/.test(body.guest_email)) {
      throw new BadRequestError('A valid email address is required')
    }
    if (!body.guest_phone || body.guest_phone.replace(/\D/g, '').length < 7) {
      throw new BadRequestError('A valid phone number is required')
    }
    if (!body.id_type || !ID_TYPES.includes(body.id_type)) {
      throw new BadRequestError(`id_type must be one of: ${ID_TYPES.join(', ')}`)
    }
    if (!body.id_number || body.id_number.trim().length < 4) {
      throw new BadRequestError('ID number is required (at least 4 characters)')
    }
    if (!body.room_type_id || !Number.isFinite(Number(body.room_type_id))) {
      throw new BadRequestError('room_type_id is required')
    }
    if (!body.check_in_date || !body.check_out_date) {
      throw new BadRequestError('check_in_date and check_out_date are required')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.check_in_date) || !/^\d{4}-\d{2}-\d{2}$/.test(body.check_out_date)) {
      throw new BadRequestError('Dates must be in YYYY-MM-DD format')
    }
    const today = new Date().toISOString().slice(0, 10)
    if (body.check_in_date < today) {
      throw new BadRequestError('Check-in date cannot be in the past')
    }
    const nights = nightsBetween(body.check_in_date, body.check_out_date)
    if (nights < 1) {
      throw new BadRequestError('Check-out date must be after check-in date')
    }
    if (!body.num_guests || Number(body.num_guests) < 1) {
      throw new BadRequestError('num_guests must be at least 1')
    }
    if (body.payment_method && !PAYMENT_METHODS.includes(body.payment_method)) {
      throw new BadRequestError(`payment_method must be one of: ${PAYMENT_METHODS.join(', ')}`)
    }

    const result = await withConnection(async (conn) => {
      const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES')
      const types = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
      const roomType = types.find(t => t.TYPE_ID === Number(body.room_type_id))
      if (!roomType) throw new BadRequestError('Unknown room type')
      if (Number(body.num_guests) > roomType.MAX_OCCUPANCY) {
        throw new BadRequestError(`This room type sleeps a maximum of ${roomType.MAX_OCCUPANCY} guests`)
      }

      const offered = await computeAvailableRooms(conn, body.check_in_date, body.check_out_date, Number(body.room_type_id))
      if (offered.length === 0) {
        throw new BadRequestError('No rooms available for the selected dates')
      }
      if (body.room_id) {
        const chosen = offered.find(r => r.room_id === Number(body.room_id))
        if (!chosen) throw new BadRequestError('The selected room is no longer available for those dates')
      }

      const total = nights * roomType.BASE_PRICE

      const insertResult = await conn.execute(
        `INSERT INTO BOOKING_REQUESTS
           (GUEST_NAME, GUEST_EMAIL, GUEST_PHONE, ID_TYPE, ID_NUMBER,
            ROOM_TYPE_ID, ROOM_ID, CHECK_IN_DATE, CHECK_OUT_DATE, NUM_GUESTS,
            TOTAL_PRICE, SPECIAL_REQUESTS, PAYMENT_METHOD, PROMO_CODE, STATUS)
         VALUES
           (:guest_name, :guest_email, :guest_phone, :id_type, :id_number,
            :room_type_id, :room_id, :check_in_date, :check_out_date, :num_guests,
            :total_price, :special_requests, :payment_method, :promo_code, 'pending')
         RETURNING ID INTO :new_id`,
        {
          guest_name: body.guest_name.trim(),
          guest_email: body.guest_email.trim().toLowerCase(),
          guest_phone: body.guest_phone.trim(),
          id_type: body.id_type,
          id_number: body.id_number.trim(),
          room_type_id: Number(body.room_type_id),
          room_id: body.room_id ? Number(body.room_id) : null,
          check_in_date: body.check_in_date,
          check_out_date: body.check_out_date,
          num_guests: Number(body.num_guests),
          total_price: total,
          special_requests: body.special_requests?.trim() || null,
          payment_method: body.payment_method || null,
          promo_code: body.promo?.trim() || null,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const bookingId = Number(insertResult.rows[0]?.[0])

      const email = bookingReceivedEmail({
        guest_name: body.guest_name.trim(),
        booking_id: bookingId,
        room_type_name: roomType.TYPE_NAME,
        check_in_date: body.check_in_date,
        check_out_date: body.check_out_date,
        num_guests: Number(body.num_guests),
        total,
      })
      await sendEmail({ to: body.guest_email.trim(), subject: email.subject, html: email.html })

      return { booking_id: bookingId, status: 'pending', total, nights }
    })

    return successResponse(result, 'Booking request submitted', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
