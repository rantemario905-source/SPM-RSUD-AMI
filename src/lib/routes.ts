import type { AppPage } from '../types/spm'

export type Route = AppPage | 'login'

export const appPages: AppPage[] = ['dashboard', 'entry', 'reports', 'crossunit', 'indicators', 'periods', 'audit', 'users']

export const routeHashes: Record<Route, string> = {
  login: '#/login',
  dashboard: '#/dashboard',
  entry: '#/entry',
  reports: '#/reports',
  crossunit: '#/crossunit',
  indicators: '#/indicators',
  periods: '#/periods',
  audit: '#/audit',
  users: '#/users',
}

export function isAppPage(route: Route): route is AppPage {
  return route !== 'login'
}

export function hashForRoute(route: Route): string {
  return routeHashes[route]
}

export function routeFromHash(hash: string): Route | null {
  const value = hash.replace(/^#\/?/, '').trim()
  const routes = Object.keys(routeHashes) as Route[]
  return routes.find((route) => route === value) ?? null
}
