import { useState, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthContextType, type LoginResult } from '../../context/AuthContext'
import { api } from '../../services/api'
import type { AuthResponse, User } from '../../types'

const TOKEN_KEY = 'ahms_token'
const REFRESH_KEY = 'ahms_refresh_token'
const USER_KEY = 'ahms_user'

function readStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY)
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const res = await api.post<AuthResponse>('/auth/login', { username, password })
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Login failed' }
      }

      localStorage.setItem(TOKEN_KEY, res.data.accessToken)
      localStorage.setItem(REFRESH_KEY, res.data.refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user))
      setUser(res.data.user)
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    getToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
