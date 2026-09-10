import { createContext, useContext } from 'react'
import type { MeResponse, Role } from '../types'

export interface AuthContextValue {
  me: MeResponse
  hasRole: (...roles: Role[]) => boolean
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() called outside <AuthProvider>')
  }
  return ctx
}
