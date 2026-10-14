import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hashForRoute, routeFromHash, type Route } from './routes'
import { RouterContext } from './routerContext'

function readRoute(): Route {
  if (typeof window === 'undefined') return 'dashboard'
  return routeFromHash(window.location.hash) ?? 'dashboard'
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    function sync() {
      setRoute(readRoute())
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const hash = hashForRoute(next)
    if (!options?.replace && window.location.hash === hash) return
    if (options?.replace) window.history.replaceState(null, '', hash)
    else window.history.pushState(null, '', hash)
    setRoute(next)
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}
