// ============================================================
// PUT /api/content/:id
// ADMIN/MANAGER — update a content item.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { CONTENT_TYPES } from '../_shared/marketing'
import type { DbContent, UpdateContentRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Content not found')

    const body: UpdateContentRequest = await req.json()

    if (!body.title || body.title.trim().length < 3) {
      throw new BadRequestError('Title is required (at least 3 characters)')
    }
    if (body.title.trim().length > 200) {
      throw new BadRequestError('Title must be 200 characters or fewer')
    }
    if (!body.type || !CONTENT_TYPES.includes(body.type)) {
      throw new BadRequestError(`type must be one of: ${CONTENT_TYPES.join(', ')}`)
    }
    if (typeof body.body !== 'string' || body.body.trim().length === 0) {
      throw new BadRequestError('Body content is required')
    }
    if (body.status !== 'draft' && body.status !== 'published') {
      throw new BadRequestError("status must be 'draft' or 'published'")
    }

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM CONTENT WHERE ID = :id', { id })
      if (mapRows<DbContent>(existing.rows, 'CONTENT').length === 0) {
        throw new NotFoundError('Content not found')
      }

      await conn.execute(
        `UPDATE CONTENT
         SET TITLE = :title, TYPE = :type, BODY = :body,
             FEATURED_IMAGE_URL = :featured_image_url, STATUS = :status,
             UPDATED_AT = CURRENT_TIMESTAMP
         WHERE ID = :id`,
        {
          id,
          title: body.title.trim(),
          type: body.type,
          body: body.body,
          featured_image_url: body.featured_image_url || null,
          status: body.status,
        }
      )
    })

    return successResponse({ id, status: body.status }, 'Content updated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
