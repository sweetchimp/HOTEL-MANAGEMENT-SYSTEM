// ============================================================
// API Client — Frontend HTTP Service
// ============================================================

import type { ApiResponse } from '../types'

const API_BASE = '/api'

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('ahms_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      })
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' }
    }

    // Handle 401 — attempt token refresh before logout
    if (response.status === 401 && token) {
      const refreshed = await this.attemptRefresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
      } else {
        this.handleLogout()
        return { success: false, error: 'Session expired. Please log in again.' }
      }
    }

    let data: ApiResponse<T>
    try {
      data = await response.json()
    } catch {
      return { success: false, error: 'Invalid server response' }
    }

    return data
  }

  private async attemptRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('ahms_refresh_token')
      if (!refreshToken) return false

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false

      const data = await response.json()
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('ahms_token', data.data.accessToken)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  private handleLogout() {
    localStorage.removeItem('ahms_token')
    localStorage.removeItem('ahms_refresh_token')
    localStorage.removeItem('ahms_user')
    window.location.href = '/login'
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
