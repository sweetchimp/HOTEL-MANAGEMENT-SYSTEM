// ============================================================
// POST /api/rooms
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { CreateRoomRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN'])
    const body: CreateRoomRequest = await req.json()

    if (!body.room_number || !body.type_id || !body.floor) {
      throw new BadRequestError('room_number, type_id, and floor are required')
    }

    const room = await withConnection(async (conn) => {
      const result = await conn.execute(
        'INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, DESCRIPTION) VALUES (:room_number, :type_id, :floor, :description) RETURNING ROOM_ID INTO :new_id',
        { room_number: body.room_number, type_id: body.type_id, floor: body.floor, description: body.description || '', new_id: { dir: 3001, type: 2010 } }
      )
      return { room_id: result.rows[0]?.[0] }
    })

    return successResponse(room, 'Room created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
