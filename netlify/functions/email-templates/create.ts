// ============================================================
// POST /api/email-templates
// ADMIN/MANAGER — create a custom email template.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import { TEMPLATE_TYPES } from '../_shared/marketing'
import type { CreateTemplateRequest } from '../_shared/types'

export function validateTemplate(body: CreateTemplateRequest) {
  if (!body.name || body.name.trim().length < 3) {
    throw new BadRequestError('Template name is required (at least 3 characters)')
  }
  if (body.name.trim().length > 200) {
    throw new BadRequestError('Name must be 200 characters or fewer')
  }
  if (!body.subject || !body.subject.trim()) {
    throw new BadRequestError('Subject is required')
  }
  if (typeof body.body !== 'string' || !body.body.trim()) {
    throw new BadRequestError('Body is required')
  }
  if (!body.type || !TEMPLATE_TYPES.includes(body.type)) {
    throw new BadRequestError(`type must be one of: ${TEMPLATE_TYPES.join(', ')}`)
  }
  if (body.placeholders && (!Array.isArray(body.placeholders) || body.placeholders.length > 10)) {
    throw new BadRequestError('placeholders must be an array of up to 10 keys')
  }
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const body: CreateTemplateRequest = await req.json()
    validateTemplate(body)

    const result = await withConnection(async (conn) => {
      const insert = await conn.execute(
        `INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, CREATED_BY)
         VALUES (:name, :subject, :body, :type, :placeholders, :created_by)
         RETURNING ID INTO :new_id`,
        {
          name: body.name.trim(),
          subject: body.subject.trim(),
          body: body.body,
          type: body.type,
          placeholders: JSON.stringify(body.placeholders || []),
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      return { id: Number(insert.rows[0]?.[0]) }
    })

    return successResponse({ id: result.id }, 'Template created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
