import { useState, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthContextType } from '../../context/AuthContext'
import type { User } from '../../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('ahms_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((userData: User, accessToken: string, _refreshToken: string) => {
    localStorage.setItem('ahms_user', JSON.stringify(userData))
    localStorage.setItem('ahms_token', accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ahms_user')
    localStorage.removeItem('ahms_token')
    localStorage.removeItem('ahms_refresh_token')
    setUser(null)
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem('ahms_token')
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
