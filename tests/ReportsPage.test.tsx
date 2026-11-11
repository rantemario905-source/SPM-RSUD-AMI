import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import ReportsPage from '../src/features/reports/ReportsPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'admin' as string | null,
  userId: 'admin-1' as string | null,
  email: 'admin@rsud-ami.go.id' as string | null,
  fullName: 'Administrator' as string | null,
  permissions: { view_all_reports: true } as Record<string, boolean> | null,
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
const currentYear = now.getFullYear()
const quarter = Math.floor(now.getMonth() / 3) + 1
const firstMonth = quarter * 3 - 2
const secondMonth = firstMonth + 1
const periodStart = (month: number) => `${currentYear}-${String(month).padStart(2, '0')}-01`

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
  authState.role = 'admin'
  authState.userId = 'admin-1'
  authState.permissions = { view_all_reports: true }
  Object.defineProperty(window, 'print', { value: vi.fn(), writable: true })
  database.units = [
    { id: 'u1', code: 'RANAP', name: 'Rawat Inap' },
    { id: 'u2', code: 'BEDAH', name: 'Bedah' },
  ]
  database.profiles = [{ id: 'admin-1', full_name: 'Administrator', role: 'admin', unit_id: null, unit_ids: [], email: 'admin@rsud-ami.go.id', permissions: { view_all_reports: true }, active: true }]
  database.report_periods = [firstMonth, secondMonth, firstMonth + 2].map((month) => ({ period_start: periodStart(month), period_end: periodStart(month), state: 'open' }))
  database.indicators = [
    indicatorRow({ id: 'ind-1', code: 'RANAP-01', name: 'Kepatuhan kebersihan tangan', unit_id: 'u1' }),
    indicatorRow({ id: 'ind-3', code: 'RANAP-02', name: 'Skor kepuasan pelanggan', standard: '≥ 4', calculation_method: 'direct', unit_label: 'skor', result_unit: 'skor', unit_id: 'u1' }),
    indicatorRow({ id: 'ind-2', code: 'BEDAH-01', name: 'Waktu tunggu operasi elektif', standard: '≥ 80%', unit_id: 'u2' }),
  ]
  database.reports = [
    { id: 'r1', unit_id: 'u1', period_start: periodStart(firstMonth) },
    { id: 'r2', unit_id: 'u1', period_start: periodStart(secondMonth) },
    { id: 'r3', unit_id: 'u2', period_start: periodStart(secondMonth) },
  ]
  database.report_entries = [
    { id: 'e1', report_id: 'r1', indicator_id: 'ind-1', numerator: 5, denominator: 10, result_text: null, analysis: 'Bulan pertama belum optimal.' },
    { id: 'e2', report_id: 'r2', indicator_id: 'ind-1', numerator: 10, denominator: 10, result_text: null, analysis: 'Bulan kedua membaik.' },
    { id: 'e3', report_id: 'r1', indicator_id: 'ind-3', numerator: 4.2, denominator: null, result_text: null, analysis: 'Skor baik.' },
    { id: 'e4', report_id: 'r3', indicator_id: 'ind-2', numerator: 8, denominator: 10, result_text: null, analysis: 'Mencapai standar.' },
  ]
})

afterEach(() => {
  cleanup()
})

describe('ReportsPage cetak semua unit', () => {
  it('menggabungkan semua unit dalam satu tabel dengan kolom unit dan status triwulan gabungan', async () => {
    const { container } = render(<ReportsPage />)
    const button = await screen.findByRole('button', { name: /Cetak semua unit/ })
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(button)

    const table = await waitFor(() => {
      const element = container.querySelector('.report-print-all-table')
      expect(element).toBeTruthy()
      return element as HTMLTableElement
    })

    const unitTitles = Array.from(table.querySelectorAll('tbody .report-print-unit-title td'))
    expect(unitTitles.map((cell) => cell.textContent)).toEqual(['Rawat Inap', 'Bedah'])
    expect(unitTitles[0].getAttribute('colspan')).toBe('8')
    expect(table.querySelector('[rowspan]')).toBeNull()

    const headerRows = Array.from(table.querySelectorAll('tbody .report-print-unit-head'))
    expect(headerRows).toHaveLength(2)
    const headers = Array.from(headerRows[0].querySelectorAll('th')).map((cell) => cell.textContent)
    expect(headers[0]).toBe('No')
    expect(headers[1]).toBe('Indikator')
    expect(headers.at(-1)).toBe('Status')

    const statuses = Array.from(table.querySelectorAll('tbody .report-print-status'))
    expect(statuses.map((cell) => cell.textContent)).toEqual(['Tidak tercapai', 'Tercapai', 'Tercapai'])
    expect(statuses.map((cell) => cell.className)).toEqual([
      expect.stringContaining('is-perhatian'),
      expect.stringContaining('is-baik'),
      expect.stringContaining('is-baik'),
    ])
  })
})

describe('ReportsPage cetak unit terpilih', () => {
  function singlePrintTable(container: HTMLElement) {
    return container.querySelector('.report-print-table:not(.report-print-all-table)') as HTMLTableElement | null
  }

  function statusByIndicator(table: HTMLTableElement) {
    const rows = Array.from(table.querySelectorAll('tbody tr'))
    return Object.fromEntries(rows.map((row) => [
      row.querySelector('.report-print-indicator')?.textContent,
      row.querySelector('.report-print-status')?.textContent,
    ]))
  }

  it('menambahkan kolom status gabungan periode pada tabel cetak unit terpilih', async () => {
    const { container } = render(<ReportsPage />)
    const table = await waitFor(() => {
      const element = singlePrintTable(container)
      expect(element?.querySelectorAll('tbody tr')).toHaveLength(2)
      return element as HTMLTableElement
    })

    const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent)
    expect(headers.at(-1)).toBe('Status')
    expect(statusByIndicator(table)).toEqual({
      'Kepatuhan kebersihan tangan': 'Tidak tercapai',
      'Skor kepuasan pelanggan': 'Tercapai',
    })
  })

  it('memakai status bulan terpilih saat cetak bulanan', async () => {
    const { container } = render(<ReportsPage />)
    await waitFor(() => expect(singlePrintTable(container)?.querySelectorAll('tbody tr')).toHaveLength(2))

    fireEvent.click(screen.getByRole('tab', { name: 'Bulanan' }))
    fireEvent.change(screen.getByLabelText('Pilih bulan'), { target: { value: String(secondMonth) } })

    const table = singlePrintTable(container) as HTMLTableElement
    expect(statusByIndicator(table)).toEqual({
      'Kepatuhan kebersihan tangan': 'Tercapai',
      'Skor kepuasan pelanggan': 'Belum diisi',
    })
  })
})
