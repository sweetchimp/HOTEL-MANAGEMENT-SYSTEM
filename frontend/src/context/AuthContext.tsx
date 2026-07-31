import { createContext } from 'react'
import type { User } from '../types'

export interface LoginResult {
  success: boolean
  error?: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  getToken: () => string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
