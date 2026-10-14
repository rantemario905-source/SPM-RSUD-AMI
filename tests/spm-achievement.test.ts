import { describe, expect, it } from 'vitest'
import { achievement, formatAchievement, formatValue, meetsStandard, parseTarget } from '../src/lib/spm-achievement'
import { sampleUnits } from '../src/data/sample-indicators'

const percentage = { calculation_method: 'percentage' } as const
const numerator = { calculation_method: 'numerator' } as const
const direct = { calculation_method: 'direct' } as const
const average = { calculation_method: 'average' } as const
const scaled = { calculation_method: 'scaled' } as const

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
