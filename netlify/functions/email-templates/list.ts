// ============================================================
// GET /api/email-templates
// ADMIN/MANAGER — list all email templates (system + custom).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { TEMPLATE_TYPES } from '../_shared/marketing'
import type { DbEmailTemplate } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const type = new URL(req.url).searchParams.get('type') || undefined

    const items = await withConnection(async (conn) => {
      const binds: Record<string, unknown> = {}
      let where = ''
      if (type) {
        if (!TEMPLATE_TYPES.includes(type)) throw new AppError(400, `type must be one of: ${TEMPLATE_TYPES.join(', ')}`)
        where = 'WHERE TYPE = :type'
        binds.type = type
      }
      const res = await conn.execute(`SELECT * FROM EMAIL_TEMPLATES ${where}`, binds)
      return mapRows<DbEmailTemplate>(res.rows, 'EMAIL_TEMPLATES')
        .sort((a, b) => String(a.NAME).localeCompare(String(b.NAME)))
    })

    return successResponse(items)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
