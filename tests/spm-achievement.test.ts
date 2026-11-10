import { describe, expect, it } from 'vitest'
import { achievement, aggregatePeriodEntry, entryAchievementText, entryHasValue, formatAchievement, formatValue, indicatorResult, meetsStandard, parseTarget } from '../src/lib/spm-achievement'
import { sampleUnits } from '../src/data/sample-indicators'

const percentage = { calculation_method: 'percentage' } as const
const numerator = { calculation_method: 'numerator' } as const
const direct = { calculation_method: 'direct' } as const
const average = { calculation_method: 'average' } as const
const scaled = { calculation_method: 'scaled' } as const
const freeText = { calculation_method: 'free_text' } as const

const catalog = sampleUnits.flatMap((unit) => unit.indicators.map((indicator) => ({ ...indicator, unitName: unit.name })))

describe('parseTarget', () => {
  it('membaca arah batas atas untuk tanda ≤ dan <', () => {
    expect(parseTarget('≤ 5%')).toEqual({ comparator: '<=', target: 5 })
    expect(parseTarget('< 5 menit')).toEqual({ comparator: '<=', target: 5 })
  })

  it('memakai arah minimum untuk standar lain', () => {
    expect(parseTarget('≥ 90%')).toEqual({ comparator: '>=', target: 90 })
    expect(parseTarget('100%')).toEqual({ comparator: '>=', target: 100 })
  })

  it('memahami koma sebagai pemisah desimal', () => {
    expect(parseTarget('≤ 1,5%')).toEqual({ comparator: '<=', target: 1.5 })
    expect(parseTarget('≤ 0,24%')).toEqual({ comparator: '<=', target: 0.24 })
  })

  it('mengembalikan null bila tidak ada angka', () => {
    expect(parseTarget('tanpa angka')).toBeNull()
    expect(parseTarget('')).toBeNull()
  })

  it('selalu menemukan target pada standar indikator contoh', () => {
    const missing = catalog.filter((indicator) => parseTarget(indicator.standard) === null).map((indicator) => indicator.code)
    expect(missing).toEqual([])
  })

  it.todo('standar rentang waktu (mis. "08.30 – selesai") belum diparsing sebagai ambang yang bermakna')
})

describe('achievement', () => {
  it('menghitung persentase', () => {
    expect(achievement({ numerator: 5, denominator: 10 }, percentage)).toBe(50)
  })

  it('mengembalikan null bila denominator kosong atau nol', () => {
    expect(achievement({ numerator: 5, denominator: 0 }, percentage)).toBeNull()
    expect(achievement({ numerator: 5, denominator: null }, percentage)).toBeNull()
  })

  it('menghitung capaian nol ketika pembilang dan penyebut sama-sama nol', () => {
    expect(achievement({ numerator: 0, denominator: 0 }, percentage)).toBe(0)
    expect(achievement({ numerator: 0, denominator: 0 }, average)).toBe(0)
    expect(achievement({ numerator: 0, denominator: 0 }, scaled)).toBe(0)
    expect(formatAchievement(0, percentage)).toBe('0 %')
  })

  it('mengabaikan denominator untuk numerator dan direct', () => {
    expect(achievement({ numerator: 7, denominator: null }, numerator)).toBe(7)
    expect(achievement({ numerator: 7, denominator: 3 }, numerator)).toBe(7)
    expect(achievement({ numerator: 4.2, denominator: null }, direct)).toBe(4.2)
  })

  it('menghitung rata-rata', () => {
    expect(achievement({ numerator: 225, denominator: 50 }, average)).toBe(4.5)
  })

  it('menghitung nilai berskala dengan skala bawaan 1000', () => {
    expect(achievement({ numerator: 1, denominator: 1000 }, scaled)).toBe(1)
    expect(achievement({ numerator: 1, denominator: 1000 }, { calculation_method: 'scaled', calculation_scale: 1000 })).toBe(1)
  })

  it('mengembalikan null bila numerator belum diisi', () => {
    expect(achievement({ numerator: null, denominator: 10 }, percentage)).toBeNull()
  })

  it('tidak menghitung angka untuk capaian teks bebas', () => {
    expect(achievement({ numerator: null, denominator: null, result_text: 'Biru' }, freeText)).toBeNull()
    expect(entryAchievementText({ numerator: null, denominator: null, result_text: 'Biru' }, freeText)).toBe('Biru')
    expect(entryAchievementText({ numerator: null, denominator: null, result_text: '  ' }, freeText)).toBeNull()
    expect(entryHasValue({ numerator: null, denominator: null, result_text: 'Hijau' }, freeText)).toBe(true)
    expect(entryHasValue({ numerator: null, denominator: null, result_text: '' }, freeText)).toBe(false)
  })

  it('tidak pernah menghasilkan NaN untuk data indikator contoh', () => {
    const broken = catalog
      .map((indicator) => {
        const value = achievement(
          {
            numerator: indicator.numerator === '' ? null : Number(indicator.numerator),
            denominator: indicator.denominator === '' ? null : Number(indicator.denominator),
          },
          { calculation_method: indicator.calculation ?? 'percentage', calculation_scale: indicator.scale ?? null },
        )
        return value !== null && !Number.isFinite(value) ? `${indicator.code} → ${value}` : null
      })
      .filter(Boolean)
    expect(broken).toEqual([])
  })
})

describe('aggregatePeriodEntry', () => {
  it('menjumlahkan pembilang dan penyebut lalu menghitung ulang persentase', () => {
    const combined = aggregatePeriodEntry([
      { numerator: 5, denominator: 10, result_text: null },
      { numerator: 10, denominator: 10, result_text: null },
    ], percentage)
    expect(combined).toEqual({ numerator: 15, denominator: 20, result_text: null })
    expect(indicatorResult({ calculation_method: 'percentage', standard: '≥ 80%' }, combined)).toMatchObject({ badge: 'Tidak tercapai' })
  })

  it('mengabaikan bulan yang penyebutnya kosong', () => {
    expect(aggregatePeriodEntry([
      { numerator: 1, denominator: null, result_text: null },
      { numerator: 2, denominator: 10, result_text: null },
    ], percentage)).toEqual({ numerator: 2, denominator: 10, result_text: null })
  })

  it('mempertahankan bulan yang berisi nol sebagai capaian nol', () => {
    const combined = aggregatePeriodEntry([{ numerator: 0, denominator: 0, result_text: null }], percentage)
    expect(combined).toEqual({ numerator: 0, denominator: 0, result_text: null })
    expect(achievement(combined!, percentage)).toBe(0)
  })

  it('menjumlahkan numerator dan direct tanpa penyebut', () => {
    expect(aggregatePeriodEntry([
      { numerator: 7, denominator: null, result_text: null },
      { numerator: 3, denominator: null, result_text: null },
    ], numerator)).toEqual({ numerator: 10, denominator: null, result_text: null })
    expect(aggregatePeriodEntry([{ numerator: 4.2, denominator: null, result_text: null }], direct)).toEqual({ numerator: 4.2, denominator: null, result_text: null })
  })

  it('memakai teks terakhir yang terisi untuk capaian teks bebas', () => {
    expect(aggregatePeriodEntry([
      { numerator: null, denominator: null, result_text: 'Biru' },
      { numerator: null, denominator: null, result_text: 'Hijau' },
    ], freeText)).toEqual({ numerator: null, denominator: null, result_text: 'Hijau' })
  })

  it('mengembalikan null bila tidak ada data', () => {
    expect(aggregatePeriodEntry([], percentage)).toBeNull()
    expect(aggregatePeriodEntry([{ numerator: null, denominator: null, result_text: '  ' }], freeText)).toBeNull()
  })
})

describe('meetsStandard', () => {
  it('batas atas inklusif', () => {
    expect(meetsStandard(5, { comparator: '<=', target: 5 })).toBe(true)
    expect(meetsStandard(5.01, { comparator: '<=', target: 5 })).toBe(false)
  })

  it('batas bawah inklusif', () => {
    expect(meetsStandard(90, { comparator: '>=', target: 90 })).toBe(true)
    expect(meetsStandard(89.99, { comparator: '>=', target: 90 })).toBe(false)
  })
})

describe('format', () => {
  it('memformat angka dengan gaya Indonesia', () => {
    expect(formatValue(1234.567)).toBe('1.234,57')
    expect(formatValue(0.5)).toBe('0,5')
  })

  it('menyertakan satuan sesuai rumus capaian', () => {
    expect(formatAchievement(95, percentage)).toBe('95 %')
    expect(formatAchievement(24, { calculation_method: 'average', unit_label: 'jam' })).toBe('24 jam')
  })
})
