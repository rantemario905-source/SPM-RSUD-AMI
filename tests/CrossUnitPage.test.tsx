import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import CrossUnitPage from '../src/features/reports/CrossUnitPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'admin' as string | null,
  userId: 'admin-1' as string | null,
  email: 'admin@rsud-ami.go.id' as string | null,
  fullName: 'Admin SPM' as string | null,
  permissions: { view_all_reports: true } as Record<string, boolean> | null,
  signOut: async () => undefined,
}))

vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => authState }))

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[], report_periods: [] as Row[], reports: [] as Row[], report_entries: [] as Row[] }))

vi.mock('../src/lib/supabase', async () => {
  const { createFakeClient } = await import('./support/fake-supabase')
  const client = createFakeClient(database)
  return { getSupabaseClient: () => client }
})

const units: Row[] = [
  { id: 'u1', code: 'ADM', name: 'Administrasi/Manajemen' },
  { id: 'u2', code: 'AMB', name: 'Ambulance' },
  { id: 'u3', code: 'BDH', name: 'Bedah' },
]

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
  authState.userId = 'admin-1'
  database.units = units.map((unit) => ({ ...unit }))
  database.profiles = []
  database.report_periods = [{ period_start: '2026-11-01', period_end: '2026-11-30', state: 'open' }]
  database.indicators = [
    indicatorRow({ id: 'adm-1', code: 'ADM-01', service_name: 'Administrasi/Manajemen', name: 'Kepatuhan pelaporan', standard: '≥ 80%', unit_id: 'u1' }),
    indicatorRow({ id: 'amb-1', code: 'AMB-01', service_name: 'Ambulance', name: 'Waktu pelayanan ambulance/mobil jenazah', standard: '24 Jam', calculation_method: 'average', unit_label: 'jam', result_unit: 'jam', unit_id: 'u2' }),
    indicatorRow({ id: 'amb-2', code: 'AMB-02', service_name: 'Ambulance', name: 'Kecepatan memberikan pelayanan ambulance', standard: '100 %', unit_id: 'u2' }),
    indicatorRow({ id: 'bdh-1', code: 'BDH-01', service_name: 'Bedah', name: 'Waktu tunggu operasi elektif', standard: '≤2 hari', calculation_method: 'average', unit_label: 'hari', result_unit: 'hari', unit_id: 'u3' }),
    indicatorRow({ id: 'global-1', code: 'MUTU-01', service_name: 'Rumah Sakit', name: 'Kepatuhan kebersihan tangan', standard: '≥ 80%', unit_id: null }),
  ]
  database.reports = [
    { id: 'r1', unit_id: 'u1', period_start: '2026-11-01' },
    { id: 'r2', unit_id: 'u2', period_start: '2026-11-01' },
    { id: 'r3', unit_id: 'u3', period_start: '2026-11-01' },
  ]
  database.report_entries = [
    { report_id: 'r1', indicator_id: 'adm-1', numerator: 8, denominator: 10, analysis: 'Tercapai.' },
    { report_id: 'r1', indicator_id: 'global-1', numerator: 9, denominator: 10, analysis: '' },
    { report_id: 'r2', indicator_id: 'amb-1', numerator: 24, denominator: 1, analysis: '' },
    { report_id: 'r2', indicator_id: 'amb-2', numerator: 80, denominator: 100, analysis: '' },
    { report_id: 'r2', indicator_id: 'global-1', numerator: 8, denominator: 10, analysis: '' },
    { report_id: 'r3', indicator_id: 'bdh-1', numerator: 3, denominator: 1, analysis: '' },
    { report_id: 'r3', indicator_id: 'global-1', numerator: 7, denominator: 10, analysis: '' },
  ]
})

afterEach(() => {
  cleanup()
})

describe('CrossUnitPage', () => {
  it('menampilkan satu baris per indikator pada unit pemiliknya di mode semua unit', async () => {
    render(<CrossUnitPage />)
    const heading = await screen.findByText('Indikator per unit')
    await screen.findByText('24 jam')
    const section = heading.closest('section') as HTMLElement
    const rows = within(section).getAllByRole('row')
    expect(rows).toHaveLength(8)

    const ambulanceRow = within(section).getByText('Waktu pelayanan ambulance/mobil jenazah').closest('tr') as HTMLElement
    expect(within(ambulanceRow).getByText('Ambulance')).toBeTruthy()
    expect(within(ambulanceRow).getByText('Memenuhi')).toBeTruthy()
    expect(within(ambulanceRow).queryByText('Administrasi/Manajemen')).toBeNull()

    const administrationRow = within(section).getByText('Kepatuhan pelaporan').closest('tr') as HTMLElement
    expect(within(administrationRow).getByText('Administrasi/Manajemen')).toBeTruthy()
    expect(within(administrationRow).getByText('Memenuhi')).toBeTruthy()
  })

  it('menampilkan capaian teks bebas sebagai Tercatat tanpa penilaian standar otomatis', async () => {
    database.indicators.push(indicatorRow({
      id: 'adm-2', code: 'PROPER-01', service_name: 'Administrasi/Manajemen',
      name: 'Proper lingkungan', standard: 'Biru', calculation_method: 'free_text',
      unit_label: '', result_unit: '', unit_id: 'u1',
    }))
    database.report_entries.push({ report_id: 'r1', indicator_id: 'adm-2', numerator: null, denominator: null, result_text: 'Hijau', analysis: '' })

    render(<CrossUnitPage />)
    const heading = await screen.findByText('Indikator per unit')
    await screen.findByText('Hijau')
    const section = heading.closest('section') as HTMLElement
    const row = within(section).getByText('Proper lingkungan').closest('tr') as HTMLElement
    expect(within(row).getByText('Tercatat')).toBeTruthy()
    expect(within(row).getByText('Hijau')).toBeTruthy()
    expect(within(row).queryByText('Memenuhi')).toBeNull()
  })

  it('menyaring baris dengan pencarian nama indikator atau unit', async () => {
    render(<CrossUnitPage />)
    await screen.findByText('Indikator per unit')
    fireEvent.change(screen.getByPlaceholderText('Cari indikator atau unit'), { target: { value: 'bedah' } })

    expect(screen.getByText('Waktu tunggu operasi elektif')).toBeTruthy()
    expect(screen.queryByText('Waktu pelayanan ambulance/mobil jenazah')).toBeNull()
    expect(screen.getByText('Kepatuhan kebersihan tangan')).toBeTruthy()
  })

  it('menampilkan detail unit saja saat satu unit dipilih', async () => {
    render(<CrossUnitPage />)
    await screen.findByText('Indikator per unit')
    fireEvent.change(screen.getByLabelText('Filter unit'), { target: { value: 'u1' } })

    const heading = await screen.findByText('Detail unit · Administrasi/Manajemen')
    expect(screen.queryByText('Indikator per unit')).toBeNull()
    const detailSection = heading.closest('section') as HTMLElement
    expect(within(detailSection).getByText('Kepatuhan pelaporan')).toBeTruthy()
    expect(within(detailSection).getByText('Kepatuhan kebersihan tangan')).toBeTruthy()
    expect(within(detailSection).queryByText('Waktu pelayanan ambulance/mobil jenazah')).toBeNull()
    expect(within(detailSection).queryByText('Waktu tunggu operasi elektif')).toBeNull()

    const summarySection = screen.getByText('Ringkasan per unit').closest('section') as HTMLElement
    expect(within(summarySection).getByText('Administrasi/Manajemen')).toBeTruthy()
    expect(within(summarySection).queryByText('Bedah')).toBeNull()
    expect(within(summarySection).queryByText('Ambulance')).toBeNull()
  })

  it('membuka detail lewat klik baris ringkasan dan menutupnya kembali', async () => {
    render(<CrossUnitPage />)
    await screen.findByText('Indikator per unit')
    const summarySection = screen.getByText('Ringkasan per unit').closest('section') as HTMLElement
    fireEvent.click(within(summarySection).getByText('Administrasi/Manajemen').closest('tr') as HTMLElement)

    await screen.findByText('Detail unit · Administrasi/Manajemen')
    expect(screen.queryByText('Indikator per unit')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Tutup/ }))
    await screen.findByText('Indikator per unit')
    expect(screen.queryByText('Detail unit · Administrasi/Manajemen')).toBeNull()
  })
})
