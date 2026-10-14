import type { SupabaseClient } from '@supabase/supabase-js'

export interface SpmUnit {
  id: string
  code: string
  name: string
}

export interface SpmIndicator {
  id: string
  code: string
  service_name: string
  name: string
  operational_definition: string
  standard: string
  calculation_method: 'percentage' | 'average' | 'scaled' | 'numerator' | 'direct'
  unit_label: string
  calculation_scale: number | null
  result_unit: string
  unit_id: string | null
  effective_from: string
  effective_until: string | null
  active: boolean
}

export interface SpmPeriod {
  period_start: string
  period_end: string
  state: 'open' | 'locked'
}

export interface SpmProfile {
  id: string
  role: string
  unit_id: string | null
  unit_ids: string[] | null
  permissions: Record<string, boolean>
}

export interface SpmReportEntry {
  report_id: string
  indicator_id: string
  numerator: number | null
  denominator: number | null
  analysis: string
  evidence_note: string
  updated_at: string
}

export async function loadProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('id, role, unit_id, unit_ids, permissions')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as SpmProfile
}

export function profileUnitIds(profile: Pick<SpmProfile, 'unit_id' | 'unit_ids'> | null | undefined): string[] {
  if (!profile) return []
  const ids = (profile.unit_ids ?? []).filter(Boolean)
  if (profile.unit_id && !ids.includes(profile.unit_id)) ids.unshift(profile.unit_id)
  return ids
}

export function scopedUnitIds(profile: Pick<SpmProfile, 'unit_id' | 'unit_ids'> | null | undefined): string[] | null {
  const ids = profileUnitIds(profile)
  return ids.length ? ids : null
}

export function profileUnitNames(profile: { unit_id: string | null; unit_ids?: string[] | null }, units: SpmUnit[]): string[] {
  return profileUnitIds({ unit_id: profile.unit_id, unit_ids: profile.unit_ids ?? null })
    .map((id) => units.find((unit) => unit.id === id)?.name)
    .filter((name): name is string => Boolean(name))
}

export async function loadUnits(client: SupabaseClient) {
  const { data, error } = await client.from('units').select('id, code, name').order('name')
  if (error) throw error
  return (data ?? []) as SpmUnit[]
}

export async function loadIndicators(client: SupabaseClient, unitId?: string) {
  let request = client
    .from('indicators')
    .select('id, code, service_name, name, operational_definition, standard, calculation_method, unit_label, calculation_scale, result_unit, unit_id, effective_from, effective_until, active')
    .order('code')
  if (unitId) request = request.or(`unit_id.is.null,unit_id.eq.${unitId}`)
  const { data, error } = await request
  if (error) throw error
  return (data ?? []) as SpmIndicator[]
}

export async function loadPeriods(client: SupabaseClient) {
  const { data, error } = await client.from('report_periods').select('period_start, period_end, state').order('period_start', { ascending: false })
  if (error) throw error
  return (data ?? []) as SpmPeriod[]
}

export function periodLabel(periodStart: string) {
  const [year, month] = periodStart.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

export function getMonthRange(periodStart: string) {
  const [year, month] = periodStart.split('-').map(Number)
  const periodEnd = new Date(year, month, 0).toISOString().slice(0, 10)
  return { period_start: periodStart, period_end: periodEnd }
}