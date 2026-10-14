import type { AppPage } from '../types/spm'

const allPages: AppPage[] = ['dashboard', 'entry', 'reports', 'crossunit', 'indicators', 'periods', 'audit', 'users']
const basePages: AppPage[] = ['dashboard', 'entry', 'reports']

const rolePages: Record<string, AppPage[]> = {
  officer: ['dashboard', 'entry', 'reports'],
  unit_head: ['dashboard', 'entry', 'reports', 'indicators'],
  leadership: ['dashboard', 'entry', 'reports', 'crossunit', 'indicators'],
  admin: allPages,
}

const permissionPages: { permission: string; page: AppPage }[] = [
  { permission: 'manage_indicators', page: 'indicators' },
  { permission: 'manage_periods', page: 'periods' },
  { permission: 'view_audit', page: 'audit' },
  { permission: 'manage_users', page: 'users' },
  { permission: 'view_all_reports', page: 'crossunit' },
]

export function allowedPages(role: string | null, permissions: Record<string, boolean> | null | undefined, isPreview: boolean): AppPage[] {
  if (isPreview) return allPages
  const base = role ? rolePages[role] ?? basePages : basePages
  const extra = permissionPages
    .filter(({ permission }) => Boolean(permissions?.[permission]))
    .map(({ page }) => page)
  return Array.from(new Set<AppPage>([...base, ...extra]))
}

export function canAccessPage(role: string | null, permissions: Record<string, boolean> | null | undefined, isPreview: boolean, page: AppPage): boolean {
  return allowedPages(role, permissions, isPreview).includes(page)
}
