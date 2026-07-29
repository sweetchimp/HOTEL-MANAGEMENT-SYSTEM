import { createContext } from 'react'
import type { User } from '../types'

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  logout: () => void
  getToken: () => string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
