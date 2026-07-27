import type { Context } from '@netlify/functions'
import { successResponse, errorResponse } from '../_shared/response'
import { BadRequestError, AppError } from '../_shared/middleware'
import type { LoginRequest } from '../_shared/types'

export default async (req: Request, context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const body: LoginRequest = await req.json()

    if (!body.username || !body.password) {
      throw new BadRequestError('Username and password are required')
    }

    // TODO: Phase 4 — Implement actual auth with Oracle DB
    // For now, return a mock response
    return successResponse({
      user: {
        user_id: 1,
        username: body.username,
        full_name: 'Demo User',
        email: 'demo@altonshotel.com',
        role: 'ADMIN',
        is_active: true,
      },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    })
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error)
    }
    return errorResponse('Internal server error')
  }
}

export const config = {
  path: '/api/auth/login',
  method: 'POST',
}
