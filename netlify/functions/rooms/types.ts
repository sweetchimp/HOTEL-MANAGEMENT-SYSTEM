// ============================================================
// GET/POST /api/rooms/types
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbRoomType } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()

  try {
    requireAuth(req)

    if (req.method === 'GET') {
      const types = await withConnection(async (conn) => {
        const result = await conn.execute('SELECT * FROM ROOM_TYPES ORDER BY TYPE_ID')
        return mapRows<DbRoomType>(result.rows, 'ROOM_TYPES')
      })
      return successResponse(types)
    }

    if (req.method === 'POST') {
      requireRole(req, ['ADMIN'])
      const body = await req.json()
      const result = await withConnection(async (conn) => {
        await conn.execute(
          'INSERT INTO ROOM_TYPES (TYPE_NAME, DESCRIPTION, BASE_PRICE, MAX_OCCUPANCY) VALUES (:name, :desc, :price, :occupancy)',
          { name: body.type_name, desc: body.description || '', price: body.base_price, occupancy: body.max_occupancy }
        )
      })
      return successResponse(result, 'Room type created', 201)
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
