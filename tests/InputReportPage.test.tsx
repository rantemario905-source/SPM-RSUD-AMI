import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import InputReportPage from '../src/features/reports/InputReportPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'officer' as string | null,
  userId: 'officer-1' as string | null,
  email: 'officer@rsud-ami.go.id' as string | null,
  fullName: 'Petugas Rawat Inap' as string | null,
  permissions: { input_reports: true, view_all_reports: false } as Record<string, boolean> | null,
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

const unit: Row = { id: 'u1', code: 'RANAP', name: 'Rawat Inap' }
const officer: Row = { id: 'officer-1', full_name: 'Petugas Rawat Inap', role: 'officer', unit_id: 'u1', unit_ids: ['u1'], email: 'officer@rsud-ami.go.id', permissions: { input_reports: true, view_all_reports: false }, active: true }

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
  authState.userId = 'officer-1'
  database.units = [{ ...unit }]
  database.profiles = [{ ...officer }]
  database.indicators = [indicatorRow()]
  database.report_periods = [{ period_start: periodStart, period_end: periodEnd, state: 'open' }]
  database.reports = []
  database.report_entries = []
  database.indicator_helper_records = []
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

  it('menghitung rata-rata hari dan menyertakan kolom ruangan pada date_span', async () => {
    database.indicators = [indicatorRow({ id: 'ind-el', code: 'BDH-01', name: 'Waktu tunggu operasi elektif', calculation_method: 'average', helper_kind: 'date_span', unit_label: 'hari', standard: '≤ 2 hari', unit_id: 'u1' })]
    render(<InputReportPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Alat bantu/ }))

    expect(await screen.findByLabelText('Ruangan baris 1')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nama pasien / No. RM baris 1'), { target: { value: 'Pasien A' } })
    fireEvent.change(screen.getByLabelText('Ruangan baris 1'), { target: { value: 'OK 1' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 1'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Tanggal dilayani baris 1'), { target: { value: '2026-11-05' } })

    fireEvent.click(screen.getByRole('button', { name: /^Simpan$/ }))
    await screen.findByRole('button', { name: /Tersimpan/ })

    const entry = database.report_entries.find((row) => row.indicator_id === 'ind-el')
    expect(entry).toMatchObject({ numerator: 2, denominator: 1 })
    expect(database.indicator_helper_records[0]).toMatchObject({ room: 'OK 1', start_time: null, end_time: null })
  })

  it('menyembunyikan tombol alat bantu pada periode terkunci tanpa izin koreksi', async () => {
    database.report_periods = [{ period_start: periodStart, period_end: periodEnd, state: 'locked' }]
    database.indicators = [indicatorRow({ id: 'ind-wait', code: 'RJ-04', name: 'Waktu tunggu', calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit', standard: '≤ 60 menit', unit_id: 'u1' })]
    render(<InputReportPage />)
    await screen.findByText('Waktu tunggu')
    expect(screen.queryByRole('button', { name: /Alat bantu/ })).toBeNull()
  })

  it('menyembunyikan periode masa depan dari pilihan', async () => {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
    const nextEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-28`
    database.report_periods = [
      { period_start: periodStart, period_end: periodEnd, state: 'open' },
      { period_start: nextStart, period_end: nextEnd, state: 'open' },
    ]

    render(<InputReportPage />)
    const periodSelect = await screen.findByLabelText('Pilih periode input') as HTMLSelectElement
    const values = Array.from(periodSelect.options).map((option) => option.value)

    expect(values).toContain(periodStart)
    expect(values).not.toContain(nextStart)
  })

  it('hanya menampilkan tombol alat bantu pada indikator yang ditandai', async () => {
    database.indicators = [indicatorRow({ id: 'ind-wait', code: 'RJ-04', name: 'Waktu tunggu', calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit', standard: '≤ 60 menit', unit_id: 'u1' })]
    database.report_entries = []
    render(<InputReportPage />)
    expect(await screen.findByRole('button', { name: /Alat bantu/ })).toBeTruthy()
  })

  it('tidak menampilkan tombol alat bantu tanpa helper_kind', async () => {
    database.indicators = [indicatorRow({ id: 'ind-plain', code: 'RJ-01', name: 'Tanpa alat', calculation_method: 'percentage', helper_kind: null, unit_label: '%' })]
    render(<InputReportPage />)
    await screen.findByText('Tanpa alat')
    expect(screen.queryByRole('button', { name: /Alat bantu/ })).toBeNull()
  })

  it('menyimpan data pasien dan mengisi numerator/denominator otomatis', async () => {
    database.indicators = [indicatorRow({ id: 'ind-wait', code: 'RJ-04', name: 'Waktu tunggu', calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit', standard: '≤ 60 menit', unit_id: 'u1' })]
    database.report_entries = []
    render(<InputReportPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Alat bantu/ }))

    fireEvent.change(await screen.findByLabelText('Nama pasien / No. RM baris 1'), { target: { value: 'Pasien A' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 1'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Jam mulai baris 1'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai baris 1'), { target: { value: '08:30' } })

    fireEvent.click(screen.getByRole('button', { name: 'Tambah baris' }))
    fireEvent.change(screen.getByLabelText('Nama pasien / No. RM baris 2'), { target: { value: 'Pasien B' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 2'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Jam mulai baris 2'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai baris 2'), { target: { value: '09:50' } })

    fireEvent.click(screen.getByRole('button', { name: /^Simpan$/ }))

    await screen.findByRole('button', { name: /Tersimpan/ })
    const entry = database.report_entries.find((row) => row.indicator_id === 'ind-wait')
    expect(entry).toMatchObject({ numerator: 80, denominator: 2 })
    expect(database.indicator_helper_records).toHaveLength(2)
  })

  it('menampilkan peringatan minimum sampel tanpa memblokir simpan', async () => {
    database.indicators = [indicatorRow({ id: 'ind-rm', code: 'RM-03', name: 'Waktu penyediaan dokumen', calculation_method: 'average', helper_kind: 'time_span', helper_min_sample: 100, unit_label: 'menit', standard: '≤ 10 menit', unit_id: 'u1' })]
    render(<InputReportPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Alat bantu/ }))

    fireEvent.change(await screen.findByLabelText('Nama pasien / No. RM baris 1'), { target: { value: 'RM-001' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 1'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Jam mulai baris 1'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai baris 1'), { target: { value: '08:05' } })

    expect(await screen.findByText(/Sampel baru 1 dari minimal 100/)).toBeTruthy()
    expect(screen.getByText('1 / minimal 100')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^Simpan$/ }))
    await screen.findByRole('button', { name: /Tersimpan/ })
    expect(database.report_entries.find((row) => row.indicator_id === 'ind-rm')).toMatchObject({ numerator: 5, denominator: 1 })
  })

  it('menolak jam selesai sebelum jam mulai', async () => {
    database.indicators = [indicatorRow({ id: 'ind-wait', code: 'RJ-04', name: 'Waktu tunggu', calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit', standard: '≤ 60 menit', unit_id: 'u1' })]
    render(<InputReportPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Alat bantu/ }))

    fireEvent.change(await screen.findByLabelText('Nama pasien / No. RM baris 1'), { target: { value: 'Pasien A' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 1'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Jam mulai baris 1'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai baris 1'), { target: { value: '08:00' } })

    fireEvent.click(screen.getByRole('button', { name: /^Simpan$/ }))
    expect(await screen.findByText(/tidak boleh sebelum jam mulai/)).toBeTruthy()
    expect(database.indicator_helper_records).toHaveLength(0)
  })

  it('menyimpan alat bantu tanpa memuat ulang dan menghapus ketikan baris lain', async () => {
    database.indicators = [
      indicatorRow({ id: 'ind-wait', code: 'RJ-04', name: 'Waktu tunggu', calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit', standard: '≤ 60 menit', unit_id: 'u1' }),
      indicatorRow({ id: 'ind-plain', code: 'RJ-05', name: 'Kepatuhan cuci tangan', calculation_method: 'percentage', helper_kind: null, unit_label: '%', standard: '≥ 85%', unit_id: 'u1' }),
    ]
    render(<InputReportPage />)
    fireEvent.change(await screen.findByLabelText('Jumlah (pembilang) Kepatuhan cuci tangan'), { target: { value: '42' } })

    fireEvent.click(await screen.findByRole('button', { name: /Alat bantu/ }))
    fireEvent.change(await screen.findByLabelText('Nama pasien / No. RM baris 1'), { target: { value: 'Pasien A' } })
    fireEvent.change(screen.getByLabelText('Tanggal baris 1'), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText('Jam mulai baris 1'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Jam selesai baris 1'), { target: { value: '08:30' } })
    fireEvent.click(screen.getByRole('button', { name: /^Simpan$/ }))

    await screen.findByRole('button', { name: /Tersimpan/ })
    fireEvent.keyDown(document, { key: 'Escape' })

    const pending = screen.getByLabelText('Jumlah (pembilang) Kepatuhan cuci tangan') as HTMLInputElement
    expect(pending.value).toBe('42')
    const filled = screen.getByLabelText('Jumlah (pembilang) Waktu tunggu') as HTMLInputElement
    expect(filled.value).toBe('30')
  })

  it('hanya menampilkan unit yang dipegang pada dropdown unit', async () => {
    database.units = [{ ...unit }, { id: 'u2', code: 'BEDAH', name: 'Bedah' }]
    render(<InputReportPage />)

    await screen.findByRole('option', { name: 'Rawat Inap' })
    const select = screen.getByLabelText('Pilih unit atau instalasi') as HTMLSelectElement
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual(['Rawat Inap'])
  })

  it('menampilkan capaian 0 ketika jumlah dan total sama-sama diisi nol', async () => {
    database.indicators = [indicatorRow({ id: 'ind-pct', code: 'RJ-01', name: 'Kepatuhan cuci tangan', calculation_method: 'percentage', helper_kind: null, unit_label: '%', standard: '≥ 85%', unit_id: 'u1' })]
    render(<InputReportPage />)

    fireEvent.change(await screen.findByLabelText('Jumlah (pembilang) Kepatuhan cuci tangan'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Total (penyebut) Kepatuhan cuci tangan'), { target: { value: '0' } })

    expect(screen.getByText('0 %')).toBeTruthy()
    expect(screen.queryByText('Belum dihitung')).toBeNull()
  })
})
