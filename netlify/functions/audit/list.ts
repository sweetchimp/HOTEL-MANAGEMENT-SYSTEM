import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbAuditEntry, AuditListParams } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAdmin(req)
    const url = new URL(req.url)
    const params: AuditListParams = {
      action: url.searchParams.get('action') || undefined,
      entity_type: url.searchParams.get('entity_type') || undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 50,
    }

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.action) {
        where += ' AND a.ACTION = :action'
        binds.action = params.action
      }
      if (params.entity_type) {
        where += ' AND a.ENTITY_TYPE = :entity_type'
        binds.entity_type = params.entity_type
      }
      if (params.from) {
        where += ' AND a.PERFORMED_AT >= :from_date'
        binds.from_date = params.from
      }
      if (params.to) {
        where += ' AND a.PERFORMED_AT <= :to_date'
        binds.to_date = params.to
      }

      const countResult = await conn.execute(
        `SELECT COUNT(*) FROM AUDIT_LOG_V a ${where}`,
        binds
      )
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page - 1) * params.pageSize
      binds.offset = offset
      binds.pageSize = params.pageSize

      const rowsResult = await conn.execute(
        `SELECT a.ID, a.ACTION, a.ENTITY_TYPE, a.ENTITY_ID, a.PERFORMED_BY_ID, a.PERFORMED_AT, a.DETAILS,
                u.FULL_NAME as PERFORMED_BY_NAME
         FROM AUDIT_LOG_V a
         LEFT JOIN USERS u ON a.PERFORMED_BY_ID = u.USER_ID
         ${where}
         ORDER BY a.PERFORMED_AT DESC
         OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
        binds
      )

      const items = rowsResult.rows.map((row: unknown[]) => ({
        id: row[0],
        action: row[1],
        entity_type: row[2],
        entity_id: row[3],
        performed_by: row[4],
        performed_at: row[5],
        details: row[6],
        performed_by_name: row[7],
      }))

      return { items, total, page: params.page, pageSize: params.pageSize }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
