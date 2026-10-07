import { createContext, useContext } from 'react'

export interface AuthState {
  isPreview: boolean
  email: string | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  isPreview: true,
  email: null,
  signOut: async () => undefined,
})

export function useAuth() {
  return useContext(AuthContext)
}