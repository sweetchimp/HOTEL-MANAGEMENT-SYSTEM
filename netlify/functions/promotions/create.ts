// ============================================================
// POST /api/promotions
// ADMIN/MANAGER — create a promotion.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { CreatePromotionRequest } from '../_shared/types'

function validate(body: CreatePromotionRequest) {
  if (!body.title || body.title.trim().length < 3) {
    throw new BadRequestError('Title is required (at least 3 characters)')
  }
  if (body.title.trim().length > 200) {
    throw new BadRequestError('Title must be 200 characters or fewer')
  }
  if (body.description && body.description.length > 1000) {
    throw new BadRequestError('Description must be 1000 characters or fewer')
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
  if (body.status !== 'draft' && body.status !== 'active') {
    throw new BadRequestError("status must be 'draft' or 'active'")
  }
}

export function roomTypesToString(input: CreatePromotionRequest['applicable_room_types']): string {
  if (Array.isArray(input)) return input.map(Number).filter(Number.isFinite).join(',')
  if (typeof input === 'string') return input
  return ''
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const body: CreatePromotionRequest = await req.json()
    validate(body)

    const result = await withConnection(async (conn) => {
      const insert = await conn.execute(
        `INSERT INTO PROMOTIONS (TITLE, DESCRIPTION, DISCOUNT_PCT, START_DATE, END_DATE,
                                 APPLICABLE_ROOM_TYPES, STATUS, CREATED_BY)
         VALUES (:title, :description, :discount_pct, :start_date, :end_date,
                 :applicable_room_types, :status, :created_by)
         RETURNING ID INTO :new_id`,
        {
          title: body.title.trim(),
          description: body.description?.trim() || '',
          discount_pct: Number(body.discount_pct),
          start_date: body.start_date,
          end_date: body.end_date,
          applicable_room_types: roomTypesToString(body.applicable_room_types),
          status: body.status,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      return { id: Number(insert.rows[0]?.[0]) }
    })

    return successResponse({ id: result.id, status: body.status }, 'Promotion created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
