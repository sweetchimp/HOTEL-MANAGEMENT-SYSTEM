// ============================================================
// Standardized API Response Utilities
// ============================================================

import { corsHeaders, type AppError } from './middleware'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function successResponse<T>(data: T, message?: string, statusCode = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  }

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): Response {
  const data: PaginatedData<T> = {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }

  return successResponse(data, message)
}

export function errorResponse(error: string | AppError, statusCode = 500): Response {
  const status = typeof error === 'object' ? error.statusCode : statusCode
  const message = typeof error === 'object' ? error.message : error

  const body: ApiResponse = {
    success: false,
    error: message,
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

export function optionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
