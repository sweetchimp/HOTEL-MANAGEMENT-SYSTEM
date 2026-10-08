// ============================================================
// Flyer asset persistence — writes self-contained SVG to
// frontend/public/uploads/ai/<id>.svg (served by the frontend).
// ============================================================

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const AI_UPLOAD_DIR = fileURLToPath(
  new URL('../../../../frontend/public/uploads/ai', import.meta.url)
)

export async function persistFlyerSvg(id: number, svg: string): Promise<string> {
  await mkdir(AI_UPLOAD_DIR, { recursive: true })
  await writeFile(`${AI_UPLOAD_DIR}/${id}.svg`, svg, 'utf-8')
  return `/uploads/ai/${id}.svg`
}

export async function removeFlyerSvg(id: number): Promise<void> {
  const { rm } = await import('node:fs/promises')
  try {
    await rm(`${AI_UPLOAD_DIR}/${id}.svg`, { force: true })
  } catch {
    // ignore removal errors
  }
}