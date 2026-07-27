// ============================================================
// PUT /api/guests/:id
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import type { UpdateGuestRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const guestId = Number(url.pathname.split('/').pop())
    const body: UpdateGuestRequest = await req.json()

    await withConnection(async (conn) => {
      const sets: string[] = []
      const binds: Record<string, unknown> = { id: guestId }

      if (body.first_name !== undefined) { sets.push('FIRST_NAME = :fn'); binds.fn = body.first_name }
      if (body.last_name !== undefined) { sets.push('LAST_NAME = :ln'); binds.ln = body.last_name }
      if (body.email !== undefined) { sets.push('EMAIL = :email'); binds.email = body.email }
      if (body.phone !== undefined) { sets.push('PHONE = :phone'); binds.phone = body.phone }
      if (body.id_type !== undefined) { sets.push('ID_TYPE = :id_type'); binds.id_type = body.id_type }
      if (body.id_number !== undefined) { sets.push('ID_NUMBER = :id_num'); binds.id_num = body.id_number }
      if (body.address !== undefined) { sets.push('ADDRESS = :addr'); binds.addr = body.address }
      if (body.nationality !== undefined) { sets.push('NATIONALITY = :nat'); binds.nat = body.nationality }

      if (sets.length === 0) return
      sets.push('UPDATED_AT = CURRENT_TIMESTAMP')
      await conn.execute(`UPDATE GUESTS SET ${sets.join(', ')} WHERE GUEST_ID = :id`, binds)
    })

    return successResponse(null, 'Guest updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
