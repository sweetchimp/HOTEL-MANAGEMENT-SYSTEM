// ============================================================
// Single catch-all Netlify Function — routes /api/* to handlers
// Served directly at /api/* via config.path (no redirect needed)
// ============================================================

import type { Config } from '@netlify/functions'
import { errorResponse, optionsResponse } from './_shared/response'

type Handler = (req: Request) => Promise<Response>

type RouteLoader = () => Promise<{ default: Handler }>

const ROUTES: Record<string, RouteLoader> = {
  'POST /api/auth/login': () => import('./auth/login'),
  'POST /api/auth/refresh': () => import('./auth/refresh'),
  'GET /api/auth/me': () => import('./auth/me'),
  'POST /api/auth/change-password': () => import('./auth/change-password'),
  'GET /api/rooms': () => import('./rooms/list'),
  'GET /api/rooms/types': () => import('./rooms/types'),
  'POST /api/rooms/types': () => import('./rooms/types'),
  'POST /api/rooms': () => import('./rooms/create'),
  'GET /api/rooms/availability': () => import('./reservations/availability'),
  'GET /api/rooms/:id': () => import('./rooms/get'),
  'PUT /api/rooms/:id': () => import('./rooms/update'),
  'DELETE /api/rooms/:id': () => import('./rooms/delete'),
  'PATCH /api/rooms/:id/status': () => import('./rooms/status'),
  'GET /api/guests': () => import('./guests/list'),
  'GET /api/guests/search': () => import('./guests/search'),
  'POST /api/guests': () => import('./guests/create'),
  'GET /api/guests/:id': () => import('./guests/get'),
  'PUT /api/guests/:id': () => import('./guests/update'),
  'GET /api/reservations': () => import('./reservations/list'),
  'GET /api/reservations/availability': () => import('./reservations/availability'),
  'POST /api/reservations': () => import('./reservations/create'),
  'GET /api/reservations/:id': () => import('./reservations/get'),
  'PUT /api/reservations/:id': () => import('./reservations/update'),
  'POST /api/reservations/:id/cancel': () => import('./reservations/cancel'),
  'POST /api/reservations/:id/confirm': () => import('./reservations/confirm'),
  'GET /api/dashboard/stats': () => import('./dashboard/stats'),
  'POST /api/checkin/process': () => import('./checkin/process'),
  'POST /api/checkin/walk-in': () => import('./checkin/walk-in'),
  'GET /api/checkin/list': () => import('./checkin/list'),
  'POST /api/checkout/process': () => import('./checkout/process'),
  'GET /api/checkout/list': () => import('./checkout/list'),
  'GET /api/billing/invoices': () => import('./billing/list'),
  'POST /api/billing/invoices': () => import('./billing/create'),
  'GET /api/billing/invoices/:id': () => import('./billing/detail'),
  'GET /api/billing/invoices/:id/balance': () => import('./billing/balance'),
  'POST /api/billing/invoices/:id/items': () => import('./billing/add-item'),
  'POST /api/billing/invoices/:id/payments': () => import('./billing/record-payment'),
  'GET /api/reports/summary': () => import('./reports/summary'),
  'GET /api/reports/occupancy': () => import('./reports/occupancy'),
  'GET /api/reports/revenue': () => import('./reports/revenue'),
  'GET /api/reports/room-types': () => import('./reports/room-types'),
  'GET /api/reports/popular-guests': () => import('./reports/popular-guests'),
  'GET /api/maintenance': () => import('./maintenance/list'),
  'POST /api/maintenance': () => import('./maintenance/create'),
  'GET /api/maintenance/:id': () => import('./maintenance/detail'),
  'POST /api/maintenance/:id/resolve': () => import('./maintenance/resolve'),
  'GET /api/housekeeping/tasks': () => import('./housekeeping/tasks'),
  'POST /api/housekeeping/tasks/:id/complete': () => import('./housekeeping/complete'),
  'GET /api/staff': () => import('./staff/list'),
  'POST /api/staff': () => import('./staff/create'),
  'PUT /api/staff/:id': () => import('./staff/update'),
  'POST /api/staff/:id/deactivate': () => import('./staff/deactivate'),
  'GET /api/payroll/:staff_id': () => import('./payroll/list'),
  'POST /api/payroll': () => import('./payroll/create'),
  'GET /api/settings': () => import('./settings/get'),
  'PUT /api/settings': () => import('./settings/update'),
  'GET /api/audit': () => import('./audit/list'),
  'GET /api/users': () => import('./users/list'),
  'PUT /api/users/:id/role': () => import('./users/update-role'),
  'GET /api/public/availability': () => import('./public/availability'),
  'POST /api/public/bookings': () => import('./public/create-booking'),
  'GET /api/bookings/pending': () => import('./booking-requests/list'),
  'GET /api/bookings/requests': () => import('./booking-requests/list'),
  'PUT /api/bookings/:id/approve': () => import('./booking-requests/approve'),
  'PUT /api/bookings/:id/reject': () => import('./booking-requests/reject'),

  // Phase 4 — Content creation & marketing
  'GET /api/content': () => import('./content/list'),
  'POST /api/content': () => import('./content/create'),
  'GET /api/content/:id': () => import('./content/get'),
  'PUT /api/content/:id': () => import('./content/update'),
  'DELETE /api/content/:id': () => import('./content/delete'),
  'GET /api/promotions': () => import('./promotions/list'),
  'POST /api/promotions': () => import('./promotions/create'),
  'PUT /api/promotions/:id': () => import('./promotions/update'),
  'DELETE /api/promotions/:id': () => import('./promotions/delete'),
  'GET /api/email-templates': () => import('./email-templates/list'),
  'POST /api/email-templates': () => import('./email-templates/create'),
  'PUT /api/email-templates/:id': () => import('./email-templates/update'),
  'GET /api/email-campaigns': () => import('./email-campaigns/list'),
  'POST /api/email-campaigns/draft': () => import('./email-campaigns/send'),
  'POST /api/email-campaigns/send': () => import('./email-campaigns/send'),
  'POST /api/email-campaigns/schedule': () => import('./email-campaigns/send'),
  'GET /api/email-campaigns/recipient-counts': () => import('./email-campaigns/recipient-counts'),
  'GET /api/email-campaigns/:id/stats': () => import('./email-campaigns/stats'),
  'POST /api/email-campaigns/:id/test': () => import('./email-campaigns/test'),
  'DELETE /api/email-campaigns/:id': () => import('./email-campaigns/delete'),
  'GET /api/public/content': () => import('./public/content'),
  'GET /api/public/promotions': () => import('./public/promotions'),
  'POST /api/public/subscribe': () => import('./public/subscribe'),
  'POST /api/upload/image': () => import('./upload/image'),
  'GET /api/tracking/open/:campaign_id/:email': () => import('./tracking/open'),
  'GET /api/tracking/click/:campaign_id/:link_id': () => import('./tracking/click'),

  // Phase AI Content — AI content generator & distribution
  'POST /api/ai/generate-content': () => import('./ai-content/generate'),
  'POST /api/ai/regenerate-content/:id': () => import('./ai-content/regenerate'),
  'GET /api/ai/content/history': () => import('./ai-content/history'),
  'GET /api/ai/content/:id': () => import('./ai-content/content'),
  'POST /api/ai/content/:id/approve': () => import('./ai-content/approve'),
  'POST /api/ai/distribute/:id': () => import('./ai-content/distribute'),
  'GET /api/ai/analytics': () => import('./ai-content/analytics'),
  'DELETE /api/ai/content/:id': () => import('./ai-content/delete'),
  'POST /api/social/instagram/post': () => import('./social/instagram'),
  'POST /api/social/whatsapp/send': () => import('./social/whatsapp'),
}

function matchRoute(method: string, pathname: string): RouteLoader | null {
  const exact = `${method} ${pathname}`
  if (ROUTES[exact]) return ROUTES[exact]

  for (const [pattern, loader] of Object.entries(ROUTES)) {
    const [pMethod, pPath] = pattern.split(' ')
    if (pMethod !== method) continue

    const patternParts = pPath.split('/')
    const pathParts = pathname.split('/')
    if (patternParts.length !== pathParts.length) continue

    let match = true
    for (let i = 0; i < patternParts.length; i++) {
      if (!patternParts[i].startsWith(':') && patternParts[i] !== pathParts[i]) {
        match = false
        break
      }
    }
    if (match) return loader
  }

  return null
}

export const config: Config = {
  path: '/api/*',
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const pathname = url.pathname

  if (req.method === 'OPTIONS') return optionsResponse()

  const loader = matchRoute(req.method, pathname)
  if (!loader) {
    return errorResponse(`Not found: ${req.method} ${pathname}`, 404)
  }

  const mod = await loader()
  return mod.default(req)
}
