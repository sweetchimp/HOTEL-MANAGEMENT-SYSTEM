// ============================================================
// GET /api/promotions
// ADMIN/MANAGER — list promotions with derived status
// (active / upcoming / expired from the date window).
// ============================================================

import { withConnection } from '../_shared/db'
import { paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { derivePromotionStatus } from '../_shared/marketing'
import type { DbPromotion } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'all'
    const search = url.searchParams.get('search') || undefined
    const sort = url.searchParams.get('sort') || 'newest'
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 12

    const items = await withConnection(async (conn) => {
      let filtered: DbPromotion[] = []

      if (status === 'active' || status === 'upcoming' || status === 'expired') {
        const res = await conn.execute(`SELECT * FROM PROMOTIONS WHERE STATUS = 'active'`)
        filtered = mapRows<DbPromotion>(res.rows, 'PROMOTIONS').filter(p => {
          if (status === 'active') return derivePromotionStatus(p) === 'active'
          if (status === 'upcoming') return derivePromotionStatus(p) === 'upcoming'
          return derivePromotionStatus(p) === 'expired'
        })
      } else {
        const binds: Record<string, unknown> = {}
        let where = 'WHERE 1=1'
        if (status !== 'all') {
          where += ' AND STATUS = :status'
          binds.status = status
        }
        if (search) {
          where += ' AND UPPER(TITLE) LIKE :search'
          binds.search = `%${search.toUpperCase()}%`
        }
        const res = await conn.execute(`SELECT * FROM PROMOTIONS ${where}`, binds)
        filtered = mapRows<DbPromotion>(res.rows, 'PROMOTIONS')
      }

      if (search) {
        const q = search.toUpperCase()
        filtered = filtered.filter(p => p.TITLE.toUpperCase().includes(q))
      }

      if (sort === 'discount') {
        filtered.sort((a, b) => Number(b.DISCOUNT_PCT) - Number(a.DISCOUNT_PCT))
      } else if (sort === 'expiring') {
        filtered.sort((a, b) => String(a.END_DATE).localeCompare(String(b.END_DATE)))
      } else {
        filtered.sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT)))
      }

      return filtered.map(p => ({ ...p, display_status: derivePromotionStatus(p) }))
    })

    const total = items.length
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)
    return paginatedResponse(paged, total, page, pageSize)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
