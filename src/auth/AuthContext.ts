import { createContext, useContext } from 'react'

export interface AuthState {
  isPreview: boolean
  email: string | null
  userId: string | null
  role: string | null
  permissions: Record<string, boolean> | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  isPreview: true,
  email: null,
  userId: null,
  role: null,
  permissions: null,
  signOut: async () => undefined,
})

export function useAuth() {
  return useContext(AuthContext)
}
