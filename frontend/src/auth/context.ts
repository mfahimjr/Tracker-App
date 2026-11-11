import { createContext } from 'react'
import type { LoginInput, User } from '../api/auth'

export interface AuthState {
  user: User | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
