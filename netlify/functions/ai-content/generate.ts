// ============================================================
// POST /api/ai/generate-content
// ADMIN/MANAGER — generate AI content (flyer, email, Instagram,
// WhatsApp, or newsletter) from an admin brief.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import { AI_CONTENT_TYPES, DEFAULT_BRAND_GUIDELINES, generateAiContent, getAiProvider, parseStoredContent } from './_shared/claude'
import { persistFlyerSvg } from './_shared/flyer'
import type { AiGeneratedBundle, GenerateContentRequest } from '../_shared/types'

function deriveTitle(type: string, prompt: string, title?: string): string {
  if (title && title.trim().length > 0) return title.trim().slice(0, 200)
  const clean = prompt.replace(/\s+/g, ' ').trim()
  return `${type.replace('_', ' ')} — ${(clean.length > 60 ? `${clean.slice(0, 60)}…` : clean)}`.slice(0, 200)
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const body: GenerateContentRequest = await req.json()

    if (!body.type || !AI_CONTENT_TYPES.includes(body.type)) {
      throw new BadRequestError(`type must be one of: ${AI_CONTENT_TYPES.join(', ')}`)
    }
    if (!body.prompt || body.prompt.trim().length < 3) {
      throw new BadRequestError('Prompt is required (at least 3 characters)')
    }
    if (body.prompt.trim().length > 2000) {
      throw new BadRequestError('Prompt must be 2000 characters or fewer')
    }
    if (body.brand_guidelines && body.brand_guidelines.length > 1000) {
      throw new BadRequestError('Brand guidelines must be 1000 characters or fewer')
    }

    const provider = getAiProvider()
    const bundle = await generateAiContent({
      type: body.type,
      prompt: body.prompt.trim(),
      brand_guidelines: body.brand_guidelines || undefined,
      title: body.title,
    })

    const payload = JSON.stringify(bundle.content)
    const flyerSvg = bundle.type === 'flyer' ? (bundle as Extract<AiGeneratedBundle, { type: 'flyer' }>).flyerSvg : null

    const result = await withConnection(async (conn) => {
      const insert = await conn.execute(
        `INSERT INTO AI_GENERATED_CONTENT (TITLE, TYPE, ADMIN_PROMPT, GENERATED_CONTENT, FLYER_DATA, STATUS, BRAND_GUIDELINES, CREATED_BY)
         VALUES (:title, :type, :admin_prompt, :generated_content, :flyer_data, :status, :brand_guidelines, :created_by)
         RETURNING ID INTO :new_id`,
        {
          title: deriveTitle(body.type, body.prompt, body.title),
          type: body.type,
          admin_prompt: body.prompt.trim(),
          generated_content: payload,
          flyer_data: flyerSvg,
          status: 'draft',
          brand_guidelines: body.brand_guidelines || DEFAULT_BRAND_GUIDELINES,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const id = Number(insert.rows[0]?.[0])

      let flyerImageUrl: string | null = null
      if (flyerSvg) {
        flyerImageUrl = await persistFlyerSvg(id, flyerSvg)
        await conn.execute(
          `UPDATE AI_GENERATED_CONTENT SET FLYER_IMAGE_URL = :url WHERE ID = :id`,
          { url: flyerImageUrl, id }
        )
      }

      await conn.execute(
        `INSERT INTO AI_CONTENT_VERSIONS (CONTENT_ID, VERSION_NUMBER, GENERATED_CONTENT, REASON, GENERATED_BY)
         VALUES (:content_id, 1, :generated_content, :reason, :generated_by)`,
        {
          content_id: id,
          generated_content: payload,
          reason: 'Initial generation',
          generated_by: user.user_id,
        }
      )

      return { id, flyer_image_url: flyerImageUrl }
    })

    return successResponse({
      id: result.id,
      title: deriveTitle(body.type, body.prompt, body.title),
      type: body.type,
      status: 'draft',
      provider,
      flyer_image_url: result.flyer_image_url,
      content_payload: parseStoredContent(payload),
    }, 'Content generated', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}