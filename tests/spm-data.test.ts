import { describe, expect, it } from 'vitest'
import { getMonthRange, periodLabel, profileUnitIds, profileUnitNames, scopedUnitIds } from '../src/lib/spm-data'

const units = [
  { id: 'u1', code: 'FARM', name: 'Farmasi' },
  { id: 'u2', code: 'IGD', name: 'Gawat Darurat' },
  { id: 'u3', code: 'RANAP', name: 'Rawat Inap' },
]

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

describe('profileUnitIds', () => {
  it('mengembalikan daftar kosong tanpa profil', () => {
    expect(profileUnitIds(null)).toEqual([])
    expect(profileUnitIds(undefined)).toEqual([])
  })

  it('menambahkan unit utama di depan bila belum ada di unit_ids', () => {
    expect(profileUnitIds({ unit_id: 'u1', unit_ids: ['u2'] })).toEqual(['u1', 'u2'])
  })

  it('tidak menggandakan unit utama yang sudah ada di unit_ids', () => {
    expect(profileUnitIds({ unit_id: 'u1', unit_ids: ['u1', 'u2'] })).toEqual(['u1', 'u2'])
  })

  it('membuang duplikat di dalam unit_ids', () => {
    expect(profileUnitIds({ unit_id: 'u1', unit_ids: ['u1', 'u1', 'u2'] })).toEqual(['u1', 'u2'])
    expect(profileUnitIds({ unit_id: 'u2', unit_ids: ['u1', 'u1', 'u2', 'u2'] })).toEqual(['u1', 'u2'])
  })

  it('mengabaikan entri kosong', () => {
    expect(profileUnitIds({ unit_id: null, unit_ids: ['', 'u1'] })).toEqual(['u1'])
  })
})

describe('profileUnitNames', () => {
  it('memetakan id ke nama unit tanpa duplikat', () => {
    expect(profileUnitNames({ unit_id: 'u1', unit_ids: ['u1', 'u1', 'u2'] }, units)).toEqual(['Farmasi', 'Gawat Darurat'])
  })

  it('membuang id unit yang tidak terdaftar', () => {
    expect(profileUnitNames({ unit_id: 'zz', unit_ids: ['zz'] }, units)).toEqual([])
  })
})

describe('scopedUnitIds', () => {
  it('null berarti semua unit', () => {
    expect(scopedUnitIds({ unit_id: null, unit_ids: [] })).toBeNull()
    expect(scopedUnitIds(null)).toBeNull()
  })

  it('berisi daftar unit yang dipegang', () => {
    expect(scopedUnitIds({ unit_id: 'u1', unit_ids: ['u2'] })).toEqual(['u1', 'u2'])
  })
})

describe('periodLabel', () => {
  it('menampilkan bulan dan tahun dalam bahasa Indonesia', () => {
    months.forEach((name, index) => {
      const start = `2026-${String(index + 1).padStart(2, '0')}-01`
      expect(periodLabel(start)).toBe(`${name} 2026`)
    })
  })
})

describe('getMonthRange', () => {
  const lastDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  it('mengembalikan hari terakhir bulan yang benar (regresi: dulu maju 1 hari di zona UTC+)', () => {
    lastDays.forEach((day, index) => {
      const start = `2026-${String(index + 1).padStart(2, '0')}-01`
      expect(getMonthRange(start)).toEqual({ period_start: start, period_end: `2026-${String(index + 1).padStart(2, '0')}-${day}` })
    })
  })

  it('mengenali Februari tahun kabisat', () => {
    expect(getMonthRange('2028-02-01').period_end).toBe('2028-02-29')
  })
})
