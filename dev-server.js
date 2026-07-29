// ============================================================
// Lightweight Dev Server — Serves Netlify Functions locally
// Run: node dev-server.js (from project root)
// ============================================================

import { createServer } from 'http'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '.env')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.warn('No .env file found — using defaults')
  }
}

loadEnv()

const PORT = 8889

// Route map: maps URL paths to function handlers
const ROUTES = {
  'POST /api/auth/login': './netlify/functions/auth/login.ts',
  'POST /api/auth/refresh': './netlify/functions/auth/refresh.ts',
  'GET /api/auth/me': './netlify/functions/auth/me.ts',
  'POST /api/auth/change-password': './netlify/functions/auth/change-password.ts',
  'GET /api/rooms': './netlify/functions/rooms/list.ts',
  'GET /api/rooms/types': './netlify/functions/rooms/types.ts',
  'POST /api/rooms/types': './netlify/functions/rooms/types.ts',
  'POST /api/rooms': './netlify/functions/rooms/create.ts',
  'GET /api/rooms/availability': './netlify/functions/reservations/availability.ts',
  'GET /api/rooms/:id': './netlify/functions/rooms/get.ts',
  'PUT /api/rooms/:id': './netlify/functions/rooms/update.ts',
  'DELETE /api/rooms/:id': './netlify/functions/rooms/delete.ts',
  'PATCH /api/rooms/:id/status': './netlify/functions/rooms/status.ts',
  'GET /api/guests': './netlify/functions/guests/list.ts',
  'GET /api/guests/search': './netlify/functions/guests/search.ts',
  'POST /api/guests': './netlify/functions/guests/create.ts',
  'GET /api/guests/:id': './netlify/functions/guests/get.ts',
  'PUT /api/guests/:id': './netlify/functions/guests/update.ts',
  'GET /api/reservations': './netlify/functions/reservations/list.ts',
  'GET /api/reservations/availability': './netlify/functions/reservations/availability.ts',
  'POST /api/reservations': './netlify/functions/reservations/create.ts',
  'GET /api/reservations/:id': './netlify/functions/reservations/get.ts',
  'PUT /api/reservations/:id': './netlify/functions/reservations/update.ts',
  'POST /api/reservations/:id/cancel': './netlify/functions/reservations/cancel.ts',
  'POST /api/reservations/:id/confirm': './netlify/functions/reservations/confirm.ts',
  'GET /api/dashboard/stats': './netlify/functions/dashboard/stats.ts',
  'POST /api/checkin/process': './netlify/functions/checkin/process.ts',
  'GET /api/checkin/list': './netlify/functions/checkin/list.ts',
  'POST /api/checkout/process': './netlify/functions/checkout/process.ts',
  'GET /api/checkout/list': './netlify/functions/checkout/list.ts',
}

function matchRoute(method, pathname) {
  // Exact match first
  const exact = `${method} ${pathname}`
  if (ROUTES[exact]) return { handlerPath: ROUTES[exact], params: {} }

  // Parameterized match
  for (const [pattern, handlerPath] of Object.entries(ROUTES)) {
    const [pMethod, pPath] = pattern.split(' ')
    if (pMethod !== method) continue

    const patternParts = pPath.split('/')
    const pathParts = pathname.split('/')
    if (patternParts.length !== pathParts.length) continue

    const params = {}
    let match = true
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        match = false
        break
      }
    }
    if (match) return { handlerPath, params }
  }

  return null
}

// Dynamic import handler and invoke
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const route = matchRoute(req.method, pathname)
  if (!route) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: `Not found: ${req.method} ${pathname}` }))
    return
  }

  try {
    // Build the Request object (Web API Request like Netlify Functions expect)
    let body = null
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve) => {
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks).toString()))
      })
    }

    const requestUrl = `http://localhost:${PORT}${pathname}${url.search}`
    const headers = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers[key] = Array.isArray(value) ? value.join(', ') : value
    }

    const request = new Request(requestUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    })

    // Dynamically import the handler (needed for TypeScript via tsx)
    const handlerPath = resolve(__dirname, route.handlerPath)
    const fileUrl = process.platform === 'win32'
      ? 'file:///' + handlerPath.replace(/\\/g, '/')
      : handlerPath
    const mod = await import(fileUrl)
    const handler = mod.default

    const response = await handler(request)

    // Send response
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
    const responseBody = await response.text()
    res.end(responseBody)
  } catch (err) {
    console.error(`Error handling ${req.method} ${pathname}:`, err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: `Internal server error: ${err.message}` }))
  }
}

const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log('')
  console.log('  🏨 ALTONSHOTEL Dev Server')
  console.log(`  ├─ API:      http://localhost:${PORT}/api`)
  console.log(`  ├─ Mock DB:  ${process.env.DB_MODE || 'mock'}`)
  console.log('  └─ Ready!')
  console.log('')
  console.log('  Start the frontend in another terminal:')
  console.log('    cd frontend && npm run dev')
  console.log('')
})
