// ============================================================
// GET /api/public/availability
// Public — no auth. Returns offered rooms for a date range.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError } from '../_shared/middleware'
import { computeAvailableRooms, nightsBetween } from '../_shared/availability'
import { mapRows } from '../_shared/row-mapper'
import type { DbRoomType } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const url = new URL(req.url)
    const checkIn = url.searchParams.get('check_in')
    const checkOut = url.searchParams.get('check_out')
    const roomType = url.searchParams.get('room_type')

    if (!checkIn || !checkOut) {
      throw new BadRequestError('check_in and check_out are required')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      throw new BadRequestError('Dates must be in YYYY-MM-DD format')
    }
    const nights = nightsBetween(checkIn, checkOut)
    if (nights < 1) {
      throw new BadRequestError('Check-out date must be after check-in date')
    }
    if (nights > 365) {
      throw new BadRequestError('Maximum stay is 365 nights')
    }

    const typeId = roomType ? Number(roomType) : undefined
    if (roomType && (!Number.isFinite(typeId) || typeId! < 1)) {
      throw new BadRequestError('room_type must be a valid room type id')
    }

    const result = await withConnection(async conn => {
      const rooms = await computeAvailableRooms(conn, checkIn, checkOut, typeId)
      const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES ORDER BY TYPE_ID')
      const roomTypes = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
      return { rooms, roomTypes }
    })

    return successResponse({
      check_in: checkIn,
      check_out: checkOut,
      nights,
      available: result.rooms.length,
      rooms: result.rooms,
      room_types: result.roomTypes,
    })
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
