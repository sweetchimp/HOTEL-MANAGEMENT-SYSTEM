// ============================================================
// GET /api/reservations/availability
// Staff — available rooms for a stay (shared availability engine).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireAuth } from '../_shared/middleware'
import { computeAvailableRooms, nightsBetween } from '../_shared/availability'

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

    const rooms = await withConnection(conn =>
      computeAvailableRooms(conn, checkIn, checkOut, Number(roomType))
    )

    return successResponse({
      available: rooms.length,
      nights: nightsBetween(checkIn, checkOut),
      rooms,
    })
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
