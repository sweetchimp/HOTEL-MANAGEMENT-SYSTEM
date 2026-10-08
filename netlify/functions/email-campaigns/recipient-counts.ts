// ============================================================
// GET /api/email-campaigns/recipient-counts
// ADMIN/MANAGER — audience sizes for the campaign wizard.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { resolveRecipientCounts } from '../_shared/marketing'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const counts = await withConnection((conn) => resolveRecipientCounts(conn))
    return successResponse(counts)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
