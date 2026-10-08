// ============================================================
// POST /api/upload/image
// ADMIN/MANAGER — image upload (jpg/png/webp, max 4MB).
// Stores to frontend/public/uploads/ and returns a public URL.
// ============================================================

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const UPLOAD_DIR = fileURLToPath(new URL('../../../frontend/public/uploads', import.meta.url))

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const body = await req.json()

    const contentType = typeof body?.content_type === 'string' ? body.content_type : ''
    if (!contentType || !ALLOWED[contentType]) {
      throw new BadRequestError('Only JPG, PNG and WebP images are allowed')
    }

    let base64 = typeof body?.data_base64 === 'string' ? body.data_base64 : ''
    if (!base64) throw new BadRequestError('Image data is required')
    const dataPrefix = base64.match(/^data:[^;]+;base64,/)
    if (dataPrefix) base64 = base64.slice(dataPrefix[0].length)

    const buffer = Buffer.from(base64, 'base64')
    if (buffer.length === 0) throw new BadRequestError('Image data could not be decoded')
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestError('Image must be 4MB or smaller')
    }

    const original = typeof body?.filename === 'string' ? body.filename : 'image'
    const safeName = (original.split(/[\\/]/).pop() || 'image')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 60)
    const ext = ALLOWED[contentType]
    const name = `${Date.now()}-${safeName.replace(/\.[a-zA-Z0-9]+$/, '')}${ext}`

    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(`${UPLOAD_DIR}/${name}`, buffer)

    return successResponse({ url: `/uploads/${name}` }, 'Image uploaded', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
