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
