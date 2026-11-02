import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import InputReportPage from '../src/features/reports/InputReportPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'admin' as string | null,
  userId: 'admin-1' as string | null,
  email: 'admin@rsud-ami.go.id' as string | null,
  fullName: 'Admin SPM' as string | null,
  permissions: { input_reports: true, view_all_reports: true } as Record<string, boolean> | null,
  signOut: async () => undefined,
}))

vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => authState }))

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[], report_periods: [] as Row[], reports: [] as Row[], report_entries: [] as Row[] }))

vi.mock('../src/lib/supabase', async () => {
  const { createFakeClient } = await import('./support/fake-supabase')
  const client = createFakeClient(database)
  return { getSupabaseClient: () => client }
})

const now = new Date()
const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`

const unit: Row = { id: 'u1', code: 'RANAP', name: 'Rawat Inap' }
const admin: Row = { id: 'admin-1', full_name: 'Admin SPM', role: 'admin', unit_id: null, unit_ids: [], email: 'admin@rsud-ami.go.id', permissions: { input_reports: true, view_all_reports: true }, active: true }

function indicatorRow(overrides: Row = {}): Row {
  return {
    id: 'ind-1',
    code: 'PROPER-01',
    service_name: 'Rawat Inap',
    name: 'Proper lingkungan',
    operational_definition: 'Peringkat Proper lingkungan rumah sakit.',
    standard: 'Biru',
    calculation_method: 'free_text',
    unit_label: '',
    calculation_scale: null,
    result_unit: '',
    unit_id: 'u1',
    effective_from: '2026-01-01',
    effective_until: null,
    active: true,
    ...overrides,
  }
}

beforeEach(() => {
  authState.isPreview = false
  authState.userId = 'admin-1'
  database.units = [{ ...unit }]
  database.profiles = [{ ...admin }]
  database.indicators = [indicatorRow()]
  database.report_periods = [{ period_start: periodStart, period_end: periodEnd, state: 'open' }]
  database.reports = []
  database.report_entries = []
})

afterEach(() => {
  cleanup()
})

describe('InputReportPage', () => {
  it('menyimpan capaian teks bebas ke result_text tanpa numerator dan denominator', async () => {
    render(<InputReportPage />)
    const input = await screen.findByLabelText('Capaian Proper lingkungan')
    fireEvent.change(input, { target: { value: 'Hijau' } })
    expect(screen.getByText('Hijau')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Simpan input/ }))

    expect(await screen.findByText('Tersimpan di database')).toBeTruthy()
    expect(database.report_entries).toHaveLength(1)
    expect(database.report_entries[0]).toMatchObject({
      indicator_id: 'ind-1',
      result_text: 'Hijau',
      numerator: null,
      denominator: null,
    })
  })
})
