// ============================================================
// POST /api/ai/regenerate-content/:id
// ADMIN/MANAGER — regenerate an existing AI content item,
// storing the previous version in AI_CONTENT_VERSIONS.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { DEFAULT_BRAND_GUIDELINES, generateAiContent, getAiProvider, parseStoredContent } from './_shared/claude'
import { persistFlyerSvg } from './_shared/flyer'
import type { AiGeneratedBundle, DbAiGeneratedContent, DbAiContentVersion, RegenerateContentRequest } from '../_shared/types'

const REASON_MAX = 200

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const id = Number(new URL(req.url).pathname.split('/').pop())
    if (!Number.isFinite(id) || id <= 0) throw new BadRequestError('Invalid content id')

    const body: RegenerateContentRequest = (await req.json().catch(() => ({}))) as RegenerateContentRequest
    if (body.reason && body.reason.length > REASON_MAX) {
      throw new BadRequestError(`Reason must be ${REASON_MAX} characters or fewer`)
    }

    const provider = getAiProvider()
    const result = await withConnection(async (conn) => {
      const contentRes = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const content = mapRows<DbAiGeneratedContent>(contentRes.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new NotFoundError('AI content not found')

      const versionsRes = await conn.execute('SELECT * FROM AI_CONTENT_VERSIONS WHERE CONTENT_ID = :content_id', { content_id: content.ID })
      const versions = mapRows<DbAiContentVersion>(versionsRes.rows, 'AI_CONTENT_VERSIONS')
      const nextVersion = versions.reduce((max, v) => Math.max(max, v.VERSION_NUMBER), 0) + 1

      const bundle = await generateAiContent({
        type: content.TYPE,
        prompt: content.ADMIN_PROMPT,
        brand_guidelines: content.BRAND_GUIDELINES || DEFAULT_BRAND_GUIDELINES,
        title: content.TITLE,
      })

      const payload = JSON.stringify(bundle.content)
      const flyerSvg = bundle.type === 'flyer' ? (bundle as Extract<AiGeneratedBundle, { type: 'flyer' }>).flyerSvg : null

      let flyerImageUrl = content.FLYER_IMAGE_URL
      if (flyerSvg) {
        flyerImageUrl = await persistFlyerSvg(content.ID, flyerSvg)
      }

      await conn.execute(
        `UPDATE AI_GENERATED_CONTENT
         SET GENERATED_CONTENT = :generated_content, FLYER_DATA = :flyer_data,
             FLYER_IMAGE_URL = :flyer_image_url, STATUS = 'draft', UPDATED_AT = CURRENT_TIMESTAMP
         WHERE ID = :id`,
        {
          generated_content: payload,
          flyer_data: flyerSvg,
          flyer_image_url: flyerSvg ? flyerImageUrl : content.FLYER_IMAGE_URL,
          id: content.ID,
        }
      )

      await conn.execute(
        `INSERT INTO AI_CONTENT_VERSIONS (CONTENT_ID, VERSION_NUMBER, GENERATED_CONTENT, REASON, GENERATED_BY)
         VALUES (:content_id, :version_number, :generated_content, :reason, :generated_by)`,
        {
          content_id: content.ID,
          version_number: nextVersion,
          generated_content: payload,
          reason: body.reason || 'Regenerated',
          generated_by: user.user_id,
        }
      )

      return { id: content.ID, version: nextVersion, flyer_image_url: flyerImageUrl, payload }
    })

    return successResponse({
      id: result.id,
      version: result.version,
      status: 'draft',
      provider,
      content_payload: parseStoredContent(result.payload),
      flyer_image_url: result.flyer_image_url,
    }, 'Content regenerated')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}