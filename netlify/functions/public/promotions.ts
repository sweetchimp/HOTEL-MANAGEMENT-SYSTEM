// ============================================================
// GET /api/public/promotions
// Public — promotions currently active by date window.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { derivePromotionStatus } from '../_shared/marketing'
import type { DbPromotion } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const items = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM PROMOTIONS WHERE STATUS = :status', { status: 'active' })
      return mapRows<DbPromotion>(res.rows, 'PROMOTIONS')
        .filter(p => derivePromotionStatus(p) === 'active')
        .sort((a, b) => Number(b.DISCOUNT_PCT) - Number(a.DISCOUNT_PCT))
    })

    return successResponse(items)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
