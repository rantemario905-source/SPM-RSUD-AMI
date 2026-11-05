import { describe, expect, it } from 'vitest'
import { formatHelperValue, helperKindOption, helperRowResult, helperSummary } from '../src/lib/spm-helper'

const timeRow = (start: string, end: string) => ({ subject_name: 'Pasien', start_date: '2026-11-03', start_time: start, end_time: end })

describe('helperRowResult', () => {
  it('menghitung selisih menit untuk time_span', () => {
    expect(helperRowResult('time_span', 'menit', timeRow('08:00', '08:45')).value).toBe(45)
  })

  it('mengonversi ke jam bila satuan indikator jam', () => {
    expect(helperRowResult('time_span', 'jam', timeRow('08:00', '09:30')).value).toBe(1.5)
  })

  it('menolak jam selesai sebelum jam mulai', () => {
    const result = helperRowResult('time_span', 'menit', timeRow('09:00', '08:00'))
    expect(result.value).toBeNull()
    expect(result.error).toContain('tidak boleh sebelum')
  })

  it('menghitung selisih hari untuk date_span', () => {
    const result = helperRowResult('date_span', 'hari', { subject_name: 'A', start_date: '2026-11-03', end_date: '2026-11-05' })
    expect(result.value).toBe(2)
  })

  it('menolak tanggal dilayani sebelum tanggal daftar', () => {
    const result = helperRowResult('date_span', 'hari', { subject_name: 'A', start_date: '2026-11-05', end_date: '2026-11-03' })
    expect(result.value).toBeNull()
    expect(result.error).toContain('tidak boleh sebelum')
  })

  it('mengosongkan hasil bila data belum lengkap', () => {
    expect(helperRowResult('time_span', 'menit', { subject_name: 'A', start_date: '2026-11-03', start_time: '', end_time: '' }).value).toBeNull()
  })
})

describe('helperSummary', () => {
  it('menjumlahkan nilai dan menghitung rata-rata', () => {
    const summary = helperSummary('time_span', 'menit', [
      timeRow('08:00', '08:30'),
      timeRow('09:00', '09:50'),
      timeRow('10:00', '10:20'),
    ])
    expect(summary.filled).toBe(3)
    expect(summary.total).toBe(100)
    expect(summary.average).toBeCloseTo(33.33, 2)
    expect(summary.hasError).toBe(false)
  })

  it('membulatkan total dan rata-rata ke 2 desimal', () => {
    const summary = helperSummary('time_span', 'jam', [
      timeRow('10:12', '11:20'),
      timeRow('11:20', '13:40'),
    ])
    expect(String(summary.total)).toBe('3.47')
    expect(String(summary.average)).toBe('1.74')
  })

  it('menandai error bila ada baris tidak valid', () => {
    const summary = helperSummary('time_span', 'menit', [timeRow('09:00', '08:00')])
    expect(summary.hasError).toBe(true)
    expect(summary.filled).toBe(0)
  })
})

describe('formatHelperValue & helperKindOption', () => {
  it('memformat nilai kosong dan desimal', () => {
    expect(formatHelperValue(null, 'menit')).toBe('—')
    expect(formatHelperValue(1.5, 'jam')).toContain('1,5')
  })

  it('mengenali jenis alat bantu', () => {
    expect(helperKindOption('date_span')?.value).toBe('date_span')
    expect(helperKindOption(null)).toBeNull()
  })
})
