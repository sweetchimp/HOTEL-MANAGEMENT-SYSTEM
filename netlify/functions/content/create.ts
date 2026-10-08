// ============================================================
// POST /api/content
// ADMIN/MANAGER — create a news / announcement / event item.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import { CONTENT_TYPES } from '../_shared/marketing'
import type { CreateContentRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const body: CreateContentRequest = await req.json()

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
    if (body.featured_image_url && body.featured_image_url.length > 500) {
      throw new BadRequestError('Featured image URL must be 500 characters or fewer')
    }
    if (body.status !== 'draft' && body.status !== 'published') {
      throw new BadRequestError("status must be 'draft' or 'published'")
    }

    const result = await withConnection(async (conn) => {
      const insert = await conn.execute(
        `INSERT INTO CONTENT (TITLE, TYPE, BODY, FEATURED_IMAGE_URL, STATUS, CREATED_BY)
         VALUES (:title, :type, :body, :featured_image_url, :status, :created_by)
         RETURNING ID INTO :new_id`,
        {
          title: body.title.trim(),
          type: body.type,
          body: body.body,
          featured_image_url: body.featured_image_url || null,
          status: body.status,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const id = Number(insert.rows[0]?.[0])
      return { id }
    })

    return successResponse({ id: result.id, status: body.status }, 'Content created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
