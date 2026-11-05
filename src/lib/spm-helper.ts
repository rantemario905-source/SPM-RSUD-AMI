export type HelperKind = 'time_span' | 'date_span'

export interface HelperKindOption {
  value: HelperKind
  name: string
  description: string
  unitHint: string
}

export const helperKindOptions: HelperKindOption[] = [
  {
    value: 'time_span',
    name: 'Waktu (jam mulai & jam selesai)',
    description: 'Petugas mencatat jam mulai dan jam selesai layanan untuk setiap pasien; hasil dihitung otomatis dalam satuan indikator (menit/jam).',
    unitHint: 'Cocok untuk indikator rata-rata ber satuan menit atau jam.',
  },
  {
    value: 'date_span',
    name: 'Waktu (tanggal daftar & tanggal dilayani)',
    description: 'Petugas mencatat tanggal pendaftaran dan tanggal dilayani; hasil dihitung otomatis dalam satuan hari.',
    unitHint: 'Cocok untuk indikator rata-rata ber satuan hari.',
  },
]

export function helperKindOption(kind: string | null | undefined): HelperKindOption | null {
  return helperKindOptions.find((option) => option.value === kind) ?? null
}

export interface HelperRecordInput {
  subject_name: string
  room?: string
  start_date: string
  start_time?: string | null
  end_date?: string | null
  end_time?: string | null
}

export interface HelperRecordResult {
  value: number | null
  error: string | null
}

export function helperRowResult(kind: HelperKind, unitLabel: string, record: HelperRecordInput): HelperRecordResult {
  if (!record.start_date) return { value: null, error: null }
  if (kind === 'date_span') {
    if (!record.end_date) return { value: null, error: null }
    const days = dateDiffDays(record.start_date, record.end_date)
    if (days < 0) return { value: null, error: 'Tanggal dilayani tidak boleh sebelum tanggal daftar.' }
    return { value: days, error: null }
  }
  if (!record.start_time || !record.end_time) return { value: null, error: null }
  const minutes = timeDiffMinutes(record.start_time, record.end_time)
  if (minutes < 0) return { value: null, error: 'Jam selesai tidak boleh sebelum jam mulai.' }
  return { value: unitLabel === 'jam' ? minutes / 60 : minutes, error: null }
}

export interface HelperSummary {
  filled: number
  total: number
  average: number | null
  hasError: boolean
}

export interface HelperSaveResult {
  reportId: string | null
  numerator: number | null
  denominator: number | null
}

export function helperSummary(kind: HelperKind, unitLabel: string, records: HelperRecordInput[]): HelperSummary {
  let filled = 0
  let total = 0
  let hasError = false
  for (const record of records) {
    const { value, error } = helperRowResult(kind, unitLabel, record)
    if (error) hasError = true
    if (value === null) continue
    filled += 1
    total += value
  }
  const rounded = roundHelperValue(total)
  return { filled, total: rounded, average: filled > 0 ? roundHelperValue(rounded / filled) : null, hasError }
}

function dateDiffDays(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000)
}

function timeDiffMinutes(start: string, end: string): number {
  return (toMinutes(end) - toMinutes(start))
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export function formatHelperValue(value: number | null, unitLabel: string): string {
  if (value === null) return '—'
  const formatted = value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
  return unitLabel ? `${formatted} ${unitLabel}` : formatted
}

export function roundHelperValue(value: number): number {
  return Math.round(value * 100) / 100
}
