// ============================================================
// PUT /api/email-templates/:id
// ADMIN/MANAGER — update an email template.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbEmailTemplate, CreateTemplateRequest } from '../_shared/types'
import { validateTemplate } from './create'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Template not found')

    const body: CreateTemplateRequest = await req.json()
    validateTemplate(body)

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM EMAIL_TEMPLATES WHERE ID = :id', { id })
      if (mapRows<DbEmailTemplate>(existing.rows, 'EMAIL_TEMPLATES').length === 0) {
        throw new NotFoundError('Template not found')
      }

      await conn.execute(
        `UPDATE EMAIL_TEMPLATES
         SET NAME = :name, SUBJECT = :subject, BODY = :body, TYPE = :type,
             PLACEHOLDERS = :placeholders, UPDATED_AT = CURRENT_TIMESTAMP
         WHERE ID = :id`,
        {
          id,
          name: body.name.trim(),
          subject: body.subject.trim(),
          body: body.body,
          type: body.type,
          placeholders: JSON.stringify(body.placeholders || []),
        }
      )
    })

    return successResponse({ id }, 'Template updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
