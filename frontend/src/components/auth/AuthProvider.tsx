import { useState, useCallback, type ReactNode } from 'react'
import { AuthContext, type AuthContextType } from '../../context/AuthContext'
import type { User } from '../../types'

const ADMIN_USER: User = {
  user_id: 1,
  username: 'admin',
  full_name: 'System Administrator',
  email: 'admin@altonshotel.com',
  role: 'ADMIN',
  is_active: true,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User>(ADMIN_USER)

  const logout = useCallback(() => {
    window.location.href = '/'
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem('ahms_token')
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: true,
    logout,
    getToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
