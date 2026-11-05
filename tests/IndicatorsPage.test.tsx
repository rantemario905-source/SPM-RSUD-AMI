import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import IndicatorsPage from '../src/features/indicators/IndicatorsPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'admin' as string | null,
  userId: 'admin-1' as string | null,
  email: 'admin@rsud-ami.go.id' as string | null,
  fullName: 'Admin SPM' as string | null,
  permissions: { view_all_reports: true, manage_indicators: true } as Record<string, boolean> | null,
  signOut: async () => undefined,
}))

vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => authState }))

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[], report_periods: [] as Row[], reports: [] as Row[], report_entries: [] as Row[], indicator_helper_records: [] as Row[] }))

vi.mock('../src/lib/supabase', async () => {
  const { createFakeClient } = await import('./support/fake-supabase')
  const client = createFakeClient(database)
  return { getSupabaseClient: () => client }
})

const units: Row[] = [
  { id: 'u1', code: 'RANAP', name: 'Rawat Inap' },
  { id: 'u2', code: 'RAJAL', name: 'Rawat Jalan' },
]

const admin: Row = { id: 'admin-1', full_name: 'Admin SPM', role: 'admin', unit_id: null, unit_ids: [], email: 'admin@rsud-ami.go.id', permissions: { view_all_reports: true, manage_indicators: true }, active: true }

function indicatorRow(overrides: Row = {}): Row {
  return {
    id: 'ind-1',
    code: 'RJ-06',
    service_name: 'Rawat Jalan',
    name: 'Penegakan diagnosis TB',
    operational_definition: 'Diagnosis TB ditegakkan melalui pemeriksaan mikroskopis.',
    standard: '≥ 60%',
    calculation_method: 'percentage',
    unit_label: '%',
    calculation_scale: null,
    result_unit: '%',
    unit_id: 'u2',
    effective_from: '2026-01-01',
    effective_until: null,
    active: true,
    ...overrides,
  }
}

function fillForm(dialog: HTMLElement, values: { code?: string; name?: string } = {}) {
  fireEvent.change(within(dialog).getByLabelText('Kode indikator'), { target: { value: values.code ?? 'RJ-06' } })
  fireEvent.change(within(dialog).getByLabelText('Nama indikator'), { target: { value: values.name ?? 'Penegakan diagnosis TB' } })
  fireEvent.change(within(dialog).getByLabelText('Definisi operasional'), { target: { value: 'Diagnosis TB ditegakkan melalui pemeriksaan mikroskopis.' } })
  fireEvent.change(within(dialog).getByLabelText('Standar'), { target: { value: '≥ 60%' } })
}

function submitModal(dialog: HTMLElement) {
  fireEvent.submit(dialog.querySelector('form') as HTMLFormElement)
}

beforeEach(() => {
  authState.isPreview = false
  authState.userId = 'admin-1'
  database.units = units.map((unit) => ({ ...unit }))
  database.profiles = [{ ...admin }]
  database.indicators = []
  database.indicator_helper_records = []
})

afterEach(() => {
  cleanup()
})

describe('IndicatorsPage', () => {
  it('menyimpan perubahan lewat Edit setelah indikator baru ditambahkan (tanpa galat kode duplikat)', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const createDialog = await screen.findByRole('dialog')
    fillForm(createDialog)
    submitModal(createDialog)

    expect(await screen.findByText('RJ-06 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators).toHaveLength(1)
    expect(database.indicators[0].id).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Edit RJ-06' }))
    const editDialog = await screen.findByRole('dialog')
    expect(within(editDialog).getByText('Edit indikator')).toBeTruthy()
    fillForm(editDialog, { name: 'Penegakan diagnosis TB (revisi)' })
    submitModal(editDialog)

    expect(await screen.findByText('RJ-06 diperbarui di database.')).toBeTruthy()
    expect(screen.queryByText(/sudah digunakan/)).toBeNull()
    expect(database.indicators).toHaveLength(1)
    expect(database.indicators[0].name).toBe('Penegakan diagnosis TB (revisi)')
    expect(database.indicators[0].code).toBe('RJ-06')
  })

  it('menolak simpan mode Edit saat baris tidak punya id dan tidak menulis ke database', async () => {
    database.indicators = [indicatorRow({ id: undefined })]
    render(<IndicatorsPage />)
    await screen.findByText('Penegakan diagnosis TB')

    fireEvent.click(screen.getByRole('button', { name: 'Edit RJ-06' }))
    const dialog = await screen.findByRole('dialog')
    submitModal(dialog)

    expect((await within(dialog).findByRole('alert')).textContent).toContain('Data indikator tidak dikenali')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(database.indicators).toHaveLength(1)
  })

  it('menampilkan pilihan rumus yang mudah dipahami dan menyimpan rumus pilihan', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')

    const percentage = within(dialog).getByRole('radio', { name: /Persentase/ }) as HTMLInputElement
    expect(percentage.checked).toBe(true)
    expect(within(dialog).getByRole('radio', { name: /Rata-rata/ })).toBeTruthy()
    expect(within(dialog).getByRole('radio', { name: /Rasio per 1\.000/ })).toBeTruthy()
    expect(within(dialog).getByRole('radio', { name: /Jumlah \(hitung banyaknya\)/ })).toBeTruthy()
    expect(within(dialog).getByRole('radio', { name: /Nilai akhir \(skor\/angka jadi\)/ })).toBeTruthy()
    expect(within(dialog).getByText(/Satuan hasil otomatis/)).toBeTruthy()
    expect(within(dialog).getByText(/Bingung memilih/)).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('radio', { name: /Jumlah \(hitung banyaknya\)/ }))
    expect(within(dialog).getByText(/Bila angka Anda berupa skor atau nilai akhir/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('radio', { name: /Nilai akhir \(skor\/angka jadi\)/ }))
    expect(within(dialog).getByText(/Bila Anda menghitung banyaknya/)).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('radio', { name: /Rata-rata/ }))
    expect(within(dialog).getByText('225 ÷ 50 = 4,5 menit')).toBeTruthy()
    fireEvent.change(within(dialog).getByLabelText('Satuan hasil'), { target: { value: 'menit' } })
    fillForm(dialog, { code: 'RJ-07', name: 'Waktu tunggu rawat jalan' })
    submitModal(dialog)

    expect(await screen.findByText('RJ-07 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators[0].calculation_method).toBe('average')
    expect(database.indicators[0].unit_label).toBe('menit')
  })

  it('menyimpan indikator dengan capaian teks bebas tanpa satuan hasil', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: /Teks bebas/ }))
    expect(within(dialog).getByText(/Capaian diketik bebas/)).toBeTruthy()
    expect(within(dialog).queryByLabelText('Satuan hasil')).toBeNull()
    fillForm(dialog, { code: 'PROPER-01', name: 'Proper lingkungan' })
    fireEvent.change(within(dialog).getByLabelText('Standar'), { target: { value: 'Biru' } })
    submitModal(dialog)

    expect(await screen.findByText('PROPER-01 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators[0]).toMatchObject({ calculation_method: 'free_text', unit_label: '', standard: 'Biru' })
  })

  it('menyimpan alat bantu perhitungan pada indikator rata-rata', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Alat bantu perhitungan')).toBeNull()

    fireEvent.click(within(dialog).getByRole('radio', { name: /Rata-rata/ }))
    fireEvent.change(within(dialog).getByLabelText('Satuan hasil'), { target: { value: 'menit' } })
    const helperSelect = within(dialog).getByLabelText('Alat bantu perhitungan') as HTMLSelectElement
    fireEvent.change(helperSelect, { target: { value: 'time_span' } })
    fillForm(dialog, { code: 'RJ-04', name: 'Waktu tunggu rawat jalan' })
    fireEvent.change(within(dialog).getByLabelText('Standar'), { target: { value: '≤ 60 menit' } })
    submitModal(dialog)

    expect(await screen.findByText('RJ-04 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators[0]).toMatchObject({ calculation_method: 'average', helper_kind: 'time_span', unit_label: 'menit' })
  })

  it('menyimpan minimal sampel alat bantu dan mengosongkannya saat alat bantu dilepas', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: /Rata-rata/ }))
    fireEvent.change(within(dialog).getByLabelText('Satuan hasil'), { target: { value: 'menit' } })
    fireEvent.change(within(dialog).getByLabelText('Alat bantu perhitungan'), { target: { value: 'time_span' } })
    fireEvent.change(within(dialog).getByLabelText('Minimal sampel (opsional)'), { target: { value: '100' } })
    fillForm(dialog, { code: 'RM-03', name: 'Waktu penyediaan dokumen rekam medis rawat jalan' })
    submitModal(dialog)

    expect(await screen.findByText('RM-03 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators[0]).toMatchObject({ helper_kind: 'time_span', helper_min_sample: 100 })

    fireEvent.click(screen.getByRole('button', { name: 'Edit RM-03' }))
    const editDialog = await screen.findByRole('dialog')
    fireEvent.change(within(editDialog).getByLabelText('Alat bantu perhitungan'), { target: { value: '' } })
    submitModal(editDialog)

    expect(await screen.findByText('RM-03 diperbarui di database.')).toBeTruthy()
    expect(database.indicators[0]).toMatchObject({ helper_kind: null, helper_min_sample: null })
  })

  it('mereset alat bantu saat rumus bukan rata-rata', async () => {
    render(<IndicatorsPage />)
    await screen.findByText('Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: /Rata-rata/ }))
    fireEvent.change(within(dialog).getByLabelText('Alat bantu perhitungan'), { target: { value: 'date_span' } })
    fireEvent.click(within(dialog).getByRole('radio', { name: /Persentase/ }))
    expect(within(dialog).queryByLabelText('Alat bantu perhitungan')).toBeNull()
    fillForm(dialog)
    submitModal(dialog)

    expect(await screen.findByText('RJ-06 ditambahkan di database.')).toBeTruthy()
    expect(database.indicators[0].helper_kind).toBeNull()
  })

  it('menampilkan galat dari database saat kode sudah dipakai indikator lain', async () => {
    database.indicators = [indicatorRow(), indicatorRow({ id: 'ind-2', code: 'RJ-99', name: 'Pencatatan dan pelaporan TB' })]
    render(<IndicatorsPage />)
    await screen.findByText('Penegakan diagnosis TB')

    fireEvent.click(screen.getByRole('button', { name: /Tambah indikator/ }))
    const dialog = await screen.findByRole('dialog')
    fillForm(dialog, { code: 'RJ-99', name: 'Indikator baru' })
    submitModal(dialog)

    expect((await within(dialog).findByRole('alert')).textContent).toContain('sudah digunakan')
    expect(database.indicators).toHaveLength(2)
  })
})
