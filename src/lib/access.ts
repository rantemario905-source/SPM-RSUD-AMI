import type { AppPage } from '../types/spm'

const allPages: AppPage[] = ['dashboard', 'entry', 'reports', 'indicators', 'periods', 'audit', 'users']
const basePages: AppPage[] = ['dashboard', 'entry', 'reports']

const rolePages: Record<string, AppPage[]> = {
  officer: ['dashboard', 'entry', 'reports'],
  unit_head: ['dashboard', 'entry', 'reports', 'indicators'],
  quality: ['dashboard', 'entry', 'reports', 'indicators'],
  leadership: ['dashboard', 'entry', 'reports', 'indicators'],
  admin: allPages,
}

export function allowedPages(role: string | null, isPreview: boolean): AppPage[] {
  if (isPreview) return allPages
  if (!role) return basePages
  return rolePages[role] ?? basePages
}

export function canAccessPage(role: string | null, isPreview: boolean, page: AppPage): boolean {
  return allowedPages(role, isPreview).includes(page)
}
