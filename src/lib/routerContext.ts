import { createContext, useContext } from 'react'
import type { Route } from './routes'

export interface RouterState {
  route: Route
  navigate: (route: Route, options?: { replace?: boolean }) => void
}

export const RouterContext = createContext<RouterState | null>(null)

export function useRouter(): RouterState {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter harus dipakai di dalam RouterProvider')
  return context
}
