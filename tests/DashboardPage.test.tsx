import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import DashboardPage from '../src/features/dashboard/DashboardPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'leadership' as string | null,
  userId: 'dir-1' as string | null,
  email: 'direktur@rsud-ami.go.id' as string | null,
  fullName: 'Direktur RSUD' as string | null,
  permissions: { view_dashboard: true, simple_view: true } as Record<string, boolean> | null,
  signOut: async () => undefined,
}))

vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => authState }))

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[], report_periods: [] as Row[], reports: [] as Row[], report_entries: [] as Row[], indicator_helper_records: [] as Row[] }))

vi.mock('../src/lib/supabase', async () => {
  const { createFakeClient } = await import('./support/fake-supabase')
  const client = createFakeClient(database)
  return { getSupabaseClient: () => client }
})

const now = new Date()
const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`

function indicatorRow(overrides: Row): Row {
  return {
    id: 'ind-1',
    code: 'IND-01',
    service_name: 'Layanan',
    name: 'Indikator',
    operational_definition: 'Definisi operasional indikator.',
    standard: '≥ 80%',
    calculation_method: 'percentage',
    unit_label: '%',
    calculation_scale: null,
    result_unit: '%',
    unit_id: 'u1',
    effective_from: '2026-01-01',
    effective_until: null,
    active: true,
    ...overrides,
  }
}

beforeEach(() => {
  authState.isPreview = false
  authState.role = 'leadership'
  authState.userId = 'dir-1'
  authState.permissions = { view_dashboard: true, simple_view: true }
  database.units = [
    { id: 'u1', code: 'RANAP', name: 'Rawat Inap' },
    { id: 'u2', code: 'BEDAH', name: 'Bedah' },
  ]
  database.profiles = [{ id: 'dir-1', full_name: 'Direktur RSUD', role: 'leadership', unit_id: null, unit_ids: [], email: 'direktur@rsud-ami.go.id', permissions: { view_dashboard: true, simple_view: true, view_all_reports: true }, active: true }]
  database.report_periods = [{ period_start: periodStart, period_end: periodEnd, state: 'open' }]
  database.indicators = [
    indicatorRow({ id: 'ind-1', code: 'RANAP-01', service_name: 'Rawat Inap', name: 'Kepatuhan kebersihan tangan', unit_id: 'u1' }),
    indicatorRow({ id: 'ind-2', code: 'RANAP-02', service_name: 'Rawat Inap', name: 'Proper lingkungan', standard: 'Biru', calculation_method: 'free_text', unit_label: '', result_unit: '', unit_id: 'u1' }),
    indicatorRow({ id: 'ind-3', code: 'BEDAH-01', service_name: 'Bedah', name: 'Waktu tunggu operasi elektif', standard: '≤ 2 hari', calculation_method: 'average', unit_label: 'hari', result_unit: 'hari', unit_id: 'u2' }),
  ]
  database.reports = [
    { id: 'r1', unit_id: 'u1', period_start: periodStart, updated_at: `${periodStart}T08:00:00.000Z` },
    { id: 'r2', unit_id: 'u2', period_start: periodStart, updated_at: `${periodStart}T08:00:00.000Z` },
  ]
  database.report_entries = [
    { report_id: 'r1', indicator_id: 'ind-1', numerator: 8, denominator: 10, result_text: null, analysis: '', updated_at: `${periodStart}T08:00:00.000Z` },
    { report_id: 'r1', indicator_id: 'ind-2', numerator: null, denominator: null, result_text: 'Hijau', analysis: '', updated_at: `${periodStart}T08:00:00.000Z` },
    { report_id: 'r2', indicator_id: 'ind-3', numerator: 3, denominator: 1, result_text: null, analysis: '', updated_at: `${periodStart}T08:00:00.000Z` },
  ]
})

afterEach(() => {
  cleanup()
})

describe('DashboardPage', () => {
  it('menampilkan semua indikator dan capaian pada Tampilan Pimpinan', async () => {
    render(<DashboardPage onNavigate={() => undefined} />)

    expect(await screen.findByText('Capaian indikator per unit')).toBeTruthy()
    expect(await screen.findByText('Kepatuhan kebersihan tangan')).toBeTruthy()
    expect(screen.getByText('Proper lingkungan')).toBeTruthy()
    expect(screen.getByText('Waktu tunggu operasi elektif')).toBeTruthy()
    expect(screen.getByText('80 %')).toBeTruthy()
    expect(screen.getByText('Hijau')).toBeTruthy()
    expect(screen.getByText('3 hari')).toBeTruthy()
    expect(screen.getByText('Tercapai')).toBeTruthy()
    expect(screen.getByText('Tercatat')).toBeTruthy()
    expect(screen.getByText('Tidak tercapai')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Input laporan/ })).toBeNull()
    expect(screen.queryByText('Perlu perhatian')).toBeNull()
    expect(screen.queryByText('Data terbaru')).toBeNull()
  })

  it('menyaring indikator per unit dari kotak cari', async () => {
    render(<DashboardPage onNavigate={() => undefined} />)
    await screen.findByText('Capaian indikator per unit')
    await screen.findByText('Waktu tunggu operasi elektif')

    fireEvent.change(screen.getByPlaceholderText('Cari indikator atau unit'), { target: { value: 'bedah' } })
    expect(screen.getByText('Waktu tunggu operasi elektif')).toBeTruthy()
    expect(screen.queryByText('Kepatuhan kebersihan tangan')).toBeNull()
    expect(screen.queryByText('Proper lingkungan')).toBeNull()
  })

  it('tetap menampilkan dashboard lama untuk akun tanpa Tampilan Pimpinan', async () => {
    authState.permissions = { view_dashboard: true }
    render(<DashboardPage onNavigate={() => undefined} />)

    expect(await screen.findByText('Perlu perhatian')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Input laporan/ })).toBeTruthy()
    expect(screen.queryByText('Capaian indikator per unit')).toBeNull()
  })

  it('membatasi Ringkasan ke unit sendiri untuk Kepala Ruangan', async () => {
    authState.role = 'officer'
    authState.userId = 'officer-1'
    authState.permissions = { view_dashboard: true, input_reports: true }
    database.profiles = [{ id: 'officer-1', full_name: 'Petugas Rawat Inap', role: 'officer', unit_id: 'u1', unit_ids: ['u1'], email: 'officer@rsud-ami.go.id', permissions: { view_dashboard: true, input_reports: true }, active: true }]
    render(<DashboardPage onNavigate={() => undefined} />)

    expect(await screen.findByText('Perlu perhatian')).toBeTruthy()
    expect((await screen.findAllByText('Rawat Inap')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Bedah')).toBeNull()
  })

  it('menampilkan semua unit untuk Pimpinan', async () => {
    render(<DashboardPage onNavigate={() => undefined} />)

    expect(await screen.findByText('Capaian indikator per unit')).toBeTruthy()
    expect(await screen.findByText('Waktu tunggu operasi elektif')).toBeTruthy()
    expect(screen.getByText('Kepatuhan kebersihan tangan')).toBeTruthy()
  })
})
