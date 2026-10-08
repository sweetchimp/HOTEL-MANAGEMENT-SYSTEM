// ============================================================
// PUT /api/promotions/:id
// ADMIN/MANAGER — update a promotion (dates, discount, status).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbPromotion, UpdatePromotionRequest } from '../_shared/types'
import { roomTypesToString } from './create'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Promotion not found')

    const body: UpdatePromotionRequest = await req.json()

    if (!body.title || body.title.trim().length < 3) {
      throw new BadRequestError('Title is required (at least 3 characters)')
    }
    const pct = Number(body.discount_pct)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100 || !Number.isInteger(pct)) {
      throw new BadRequestError('discount_pct must be a whole number between 0 and 100')
    }
    if (!body.start_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.start_date)) {
      throw new BadRequestError('start_date must be YYYY-MM-DD')
    }
    if (!body.end_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.end_date)) {
      throw new BadRequestError('end_date must be YYYY-MM-DD')
    }
    if (body.end_date < body.start_date) {
      throw new BadRequestError('end_date must be on or after start_date')
    }
    if (!['draft', 'active', 'archived'].includes(body.status)) {
      throw new BadRequestError("status must be 'draft', 'active' or 'archived'")
    }

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM PROMOTIONS WHERE ID = :id', { id })
      if (mapRows<DbPromotion>(existing.rows, 'PROMOTIONS').length === 0) {
        throw new NotFoundError('Promotion not found')
      }

      await conn.execute(
        `UPDATE PROMOTIONS
         SET TITLE = :title, DESCRIPTION = :description, DISCOUNT_PCT = :discount_pct,
             START_DATE = :start_date, END_DATE = :end_date,
             APPLICABLE_ROOM_TYPES = :applicable_room_types, STATUS = :status,
             UPDATED_AT = CURRENT_TIMESTAMP
         WHERE ID = :id`,
        {
          id,
          title: body.title.trim(),
          description: body.description?.trim() || '',
          discount_pct: Number(body.discount_pct),
          start_date: body.start_date,
          end_date: body.end_date,
          applicable_room_types: roomTypesToString(body.applicable_room_types),
          status: body.status,
        }
      )
    })

    return successResponse({ id, status: body.status }, 'Promotion updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
