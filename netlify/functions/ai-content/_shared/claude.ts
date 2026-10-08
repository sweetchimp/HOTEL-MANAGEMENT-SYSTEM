// ============================================================
// AI Content generator — Anthropic (Claude) via fetch, with a
// deterministic local mock fallback when ANTHROPIC_API_KEY is
// unset (mirrors the sendEmail SMTP/log fallback pattern).
// Also builds self-contained flyer SVG art for the server.
// ============================================================

import type {
  AiContentType,
  AiGeneratedBundle,
  AiGeneratedEmail,
  AiGeneratedFlyer,
  AiGeneratedInstagram,
  AiGeneratedWhatsapp,
  AiProvider,
  GenerateContentRequest,
} from '../../_shared/types'

export const AI_CONTENT_TYPES: AiContentType[] = [
  'flyer',
  'email',
  'instagram_post',
  'whatsapp_message',
  'newsletter',
]

export const DEFAULT_BRAND_GUIDELINES =
  'Elegant luxury hospitality, deep navy (#0d1b2a) and gold (#c9a227) accents, serif headlines, warm and inviting tone.'

const CTA_URL = 'https://altonshotel.com/booking'

export function getAiProvider(): AiProvider {
  return process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock'
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

export async function generateAiContent(params: GenerateContentRequest): Promise<AiGeneratedBundle> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callAnthropic(params)
    } catch (err) {
      console.log(
        `[AI:FALLBACK] Claude generation failed (${err instanceof Error ? err.message : err}) — using mock generator`
      )
    }
  }
  return mockGenerateContent(params)
}

export function parseStoredContent<T>(json: string | null | undefined): T | null {
  if (!json) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

// ----------------------------------------------------------------
// Anthropic (real) path
// ----------------------------------------------------------------

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'

const SHAPE_INSTRUCTIONS: Record<AiContentType, string> = {
  flyer: `{ "headline": "short punchy headline", "subtitle": "one-line boost",
    "details": "two sentences of detail", "cta_text": "call to action (2-4 words)",
    "accent_color": "a hex color that fits the brand" }`,
  email: `{ "subject": "email subject under 80 chars", "preheader": "preview line",
    "headline": "main heading", "body_html": "fully styled inline-css HTML body with a <h2> heading and paragraphs and one <a href> cta anchor",
    "cta_label": "link text", "cta_url": "https://altonshotel.com/booking" }`,
  instagram_post: `{ "caption": "engaging caption, 2-3 sentences", "hashtags": "space separated hashtags starting with #" }`,
  whatsapp_message: `{ "message": "short friendly personalised message over a few short lines" }`,
  newsletter: `{ "subject": "email subject under 80 chars", "preheader": "preview line",
    "headline": "main heading", "body_html": "fully styled inline-css HTML body with h2 headings and paragraphs and one <a href> cta anchor",
    "cta_label": "link text", "cta_url": "https://altonshotel.com/booking" }`,
}

async function callAnthropic(params: GenerateContentRequest): Promise<AiGeneratedBundle> {
  const userPrompt = `Create hospitality marketing content for ALTONSHOTEL.

TYPE: ${params.type}
BRIEF: ${params.prompt}
BRAND GUIDELINES: ${params.brand_guidelines || DEFAULT_BRAND_GUIDELINES}

Return ONLY strict JSON in exactly this shape:
${SHAPE_INSTRUCTIONS[params.type]}`

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: 'You are ALTONSHOTEL\'s expert hospitality copywriter. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}`)
  }
  const json = await res.json() as { content?: { type: string; text: string }[] }
  const text = json.content?.map(c => c.text).join('') || ''
  const parsed = extractJson(text)

  const bundle = normalizeBundle(params.type, parsed)
  if (!bundle) throw new Error('Claude returned an unexpected shape')

  return bundle
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object in response')
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
}

function normalizeBundle(type: AiContentType, raw: Record<string, unknown>): AiGeneratedBundle | null {
  const str = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d)
  const num = (v: unknown, d: number) => (typeof v === 'number' ? v : d)

  if (type === 'flyer') {
    const flyer: AiGeneratedFlyer = {
      headline: str(raw.headline, 'A stay to remember'),
      subtitle: str(raw.subtitle, ''),
      details: str(raw.details, ''),
      cta_text: str(raw.cta_text, 'Book Now'),
      accent_color: /^#[0-9a-fA-F]{6}$/.test(str(raw.accent_color, '')) ? str(raw.accent_color) : '#c9a227',
    }
    return { type, content: flyer, flyerSvg: buildFlyerSvg(flyer) }
  }
  if (type === 'email' || type === 'newsletter') {
    const email: AiGeneratedEmail = {
      subject: str(raw.subject, 'News from ALTONSHOTEL'),
      preheader: str(raw.preheader, ''),
      headline: str(raw.headline, 'Welcome'),
      body_html: str(raw.body_html, ''),
      cta_label: str(raw.cta_label, 'Book now'),
      cta_url: str(raw.cta_url, CTA_URL),
    }
    return { type, content: email }
  }
  if (type === 'instagram_post') {
    const instagram: AiGeneratedInstagram = {
      caption: str(raw.caption, ''),
      hashtags: str(raw.hashtags, '#ALTONSHOTEL'),
    }
    return { type, content: instagram }
  }
  if (type === 'whatsapp_message') {
    const whatsapp: AiGeneratedWhatsapp = {
      message: str(raw.message, ''),
    }
    return { type, content: whatsapp }
  }
  return null
}

// ----------------------------------------------------------------
// Mock generator (deterministic variation via seed)
// ----------------------------------------------------------------

function hashSeed(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length]
}

function topicOf(prompt: string, max = 60): string {
  const clean = prompt.replace(/\s+/g, ' ').trim()
  let out = clean.length > max ? `${clean.slice(0, max).replace(/[,;:]?\s*$/, '')}…` : clean
  return out || 'A special offer'
}

const SUBTITLES = [
  'save up to 25% on your next stay',
  'an experience worth remembering',
  'luxury, comfort and warm hospitality await',
  'make your next escape unforgettable',
  'where every moment is crafted for you',
]

const DETAIL_FLAVOR = [
  'Our team is ready to look after every detail of your stay.',
  'Book directly for the best available rate and flexibility.',
  'From the rooftop terrace to the executive suites, there is so much to explore.',
  'Limited availability — we recommend reserving early.',
  'We would love to welcome you back to ALTONSHOTEL.',
]

const CTA_LABELS = ['Book Now', 'Reserve Your Stay', 'Plan Your Visit', 'Claim the Offer']

const ACCENTS = ['#c9a227', '#1f6feb', '#2a9d8f', '#b24a2e']

const PREHEADERS = [
  'Something special is waiting for you.',
  'Your next stay starts here.',
  'Keep reading to see what is new.',
  'A little invitation from our team.',
]

function mockGenerateContent(params: GenerateContentRequest): AiGeneratedBundle {
  const seed = hashSeed(`${params.type}|${params.prompt}|${params.title || ''}`)
  const topic = topicOf(params.prompt)

  if (params.type === 'flyer') {
    const flyer: AiGeneratedFlyer = {
      headline: topic,
      subtitle: pick(SUBTITLES, seed, 0),
      details: `${pick(DETAIL_FLAVOR, seed, 1)} ${pick(DETAIL_FLAVOR, seed, 2)}`,
      cta_text: pick(CTA_LABELS, seed, 3),
      accent_color: pick(ACCENTS, seed, 4),
    }
    return { type: params.type, content: flyer, flyerSvg: buildFlyerSvg(flyer) }
  }

  if (params.type === 'email' || params.type === 'newsletter') {
    const email: AiGeneratedEmail = {
      subject: `${topic.slice(0, 60)} — an invitation from ALTONSHOTEL`,
      preheader: pick(PREHEADERS, seed, 3),
      headline: topic,
      body_html: `<h2 style="margin:0 0 12px;color:#1a2b3c;">${esc(topic)}</h2>
<p style="margin:0 0 12px;color:#44505c;font-size:15px;line-height:1.6;">${esc(pick(DETAIL_FLAVOR, seed, 0))}</p>
<p style="margin:0 0 12px;color:#44505c;font-size:15px;line-height:1.6;">${esc(pick(DETAIL_FLAVOR, seed, 4))}</p>
<p style="margin:24px 0 0;"><a href="${esc(CTA_URL)}" style="background:#0d1b2a;color:#f5f0e6;text-decoration:none;padding:12px 24px;border-radius:6px;">${esc(pick(CTA_LABELS, seed, 1))}</a></p>`,
      cta_label: pick(CTA_LABELS, seed, 1),
      cta_url: CTA_URL,
    }
    return { type: params.type, content: email }
  }

  if (params.type === 'instagram_post') {
    const instagram: AiGeneratedInstagram = {
      caption: `${topic}. ${pick(DETAIL_FLAVOR, seed, 2)} Tag your stay with ${pick(['#ALTONSHOTEL', '#StayWithUs', '#GoldenHour'], seed, 9)}.`,
      hashtags: `${pick(['#ALTONSHOTEL', '#HotelAtItsBest'], seed, 5)} ${pick(['#RooftopBar', '#ExecutiveSuite', '#CityViews', '#WeekendGetaway'], seed, 6)} ${pick(['#TravelLuxury', '#BookYourEscape'], seed, 7)}`,
    }
    return { type: params.type, content: instagram }
  }

  const whatsapp: AiGeneratedWhatsapp = {
    message: `Hi there 👋\n\n${topic}\n\n${pick(DETAIL_FLAVOR, seed, 0)}\n\nReply to this message to book, or call us anytime. We look forward to hosting you!\n\n— ALTONSHOTEL`,
  }
  return { type: params.type, content: whatsapp }
}

// ----------------------------------------------------------------
// Flyer SVG (self-contained, server-rendered)
// ----------------------------------------------------------------

function esc(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (candidate.length > maxChars && line) {
      lines.push(line)
      line = w
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

const FLYER_WIDTH = 1080
const FLYER_HEIGHT = 1350
const NAVY = '#0d1b2a'
const CREAM = '#f5f0e6'

export function buildFlyerSvg(flyer: AiGeneratedFlyer): string {
  const accent = /^#[0-9a-fA-F]{6}$/.test(flyer.accent_color) ? flyer.accent_color : '#c9a227'
  const detailLines = wrapText(flyer.details, 56)
  const detailStart = 860

  const details = detailLines
    .map((line, i) => `<text x="540" y="${detailStart + i * 46}" font-family="Arial, sans-serif" font-size="28" fill="#e0dccf" text-anchor="middle">${esc(line)}</text>`)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FLYER_WIDTH}" height="${FLYER_HEIGHT}" viewBox="0 0 ${FLYER_WIDTH} ${FLYER_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}" />
      <stop offset="1" stop-color="#0a1420" />
    </linearGradient>
  </defs>
  <rect width="${FLYER_WIDTH}" height="${FLYER_HEIGHT}" fill="url(#bg)" />
  <rect x="0" y="0" width="${FLYER_WIDTH}" height="14" fill="${accent}" />
  <text x="540" y="300" font-family="Georgia, serif" font-size="56" letter-spacing="8" fill="${accent}" text-anchor="middle">ALTONSHOTEL</text>
  <line x1="420" y1="350" x2="660" y2="350" stroke="${accent}" stroke-width="2" />
  <text x="540" y="560" font-family="Georgia, serif" font-size="92" fill="${CREAM}" text-anchor="middle">${esc(flyer.headline.slice(0, 42))}</text>
  <text x="540" y="640" font-family="Arial, sans-serif" font-size="38" fill="${accent}" text-anchor="middle">${esc(flyer.subtitle.slice(0, 64))}</text>
  ${details}
  <rect y="${FLYER_HEIGHT - 150}" width="${FLYER_WIDTH}" height="150" fill="${accent}" />
  <text x="540" y="${FLYER_HEIGHT - 55}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${NAVY}" text-anchor="middle" letter-spacing="2">${esc(flyer.cta_text.toUpperCase().slice(0, 32))}</text>
</svg>`
}

export function flyerSvgToMeta(svg: string): { width: number; height: number } {
  const w = Number(svg.match(/width="(\d+)"/)?.[1] || 1080)
  const h = Number(svg.match(/height="(\d+)"/)?.[1] || 1350)
  return { width: w, height: h }
}