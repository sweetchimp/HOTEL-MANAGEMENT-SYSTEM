// ============================================================
// POST /api/guests
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireAuth } from '../_shared/middleware'
import type { CreateGuestRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const body: CreateGuestRequest = await req.json()

    if (!body.first_name || !body.last_name || !body.phone || !body.id_type || !body.id_number) {
      throw new BadRequestError('first_name, last_name, phone, id_type, and id_number are required')
    }

    const guest = await withConnection(async (conn) => {
      const result = await conn.execute(
        'INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER, ADDRESS, NATIONALITY) VALUES (:fn, :ln, :email, :phone, :id_type, :id_num, :addr, :nat) RETURNING GUEST_ID INTO :new_id',
        {
          fn: body.first_name, ln: body.last_name, email: body.email || null,
          phone: body.phone, id_type: body.id_type, id_num: body.id_number,
          addr: body.address || null, nat: body.nationality || null,
          new_id: { dir: 3001, type: 2010 }
        }
      )
      return { guest_id: result.rows[0]?.[0] }
    })

    return successResponse(guest, 'Guest created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
