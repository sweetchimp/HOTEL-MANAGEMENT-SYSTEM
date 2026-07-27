// ============================================================
// GET /api/guests/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireAuth } from '../_shared/middleware'
import { mapRow } from '../_shared/row-mapper'
import type { DbGuest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const guestId = Number(url.pathname.split('/').pop())

    if (!guestId) throw new NotFoundError('Guest ID required')

    const guest = await withConnection(async (conn) => {
      const result = await conn.execute('SELECT * FROM GUESTS WHERE GUEST_ID = :id', { id: guestId })
      if (result.rows.length === 0) return null
      return mapRow<DbGuest>(result.rows[0], 'GUESTS')
    })

    if (!guest) throw new NotFoundError('Guest not found')
    return successResponse(guest)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
