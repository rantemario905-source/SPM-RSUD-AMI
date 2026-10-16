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

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[] }))

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
