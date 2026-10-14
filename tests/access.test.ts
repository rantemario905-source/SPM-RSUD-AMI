import { describe, expect, it } from 'vitest'
import { allowedPages, canAccessPage } from '../src/lib/access'

describe('allowedPages', () => {
  it('memberi halaman dasar untuk officer tanpa izin tambahan', () => {
    expect(allowedPages('officer', {}, false)).toEqual(['dashboard', 'entry', 'reports'])
  })

  it('menambahkan Indikator SPM saat izin manage_indicators diberikan', () => {
    expect(allowedPages('officer', { manage_indicators: true }, false)).toContain('indicators')
  })

  it('menambahkan Periode saat izin manage_periods diberikan', () => {
    expect(allowedPages('officer', { manage_periods: true }, false)).toContain('periods')
  })

  it('menambahkan Perubahan saat izin view_audit diberikan', () => {
    expect(allowedPages('officer', { view_audit: true }, false)).toContain('audit')
  })

  it('menambahkan Unit & pengguna saat izin manage_users diberikan', () => {
    expect(allowedPages('officer', { manage_users: true }, false)).toContain('users')
  })

  it('menambahkan Rekap lintas unit saat izin view_all_reports diberikan', () => {
    expect(allowedPages('officer', { view_all_reports: true }, false)).toContain('crossunit')
  })

  it('tidak membuka halaman untuk izin yang tidak dipetakan', () => {
    expect(allowedPages('officer', { edit_locked_periods: true }, false)).toEqual(['dashboard', 'entry', 'reports'])
  })

  it('menggabungkan halaman dasar peran dengan izin tambahan tanpa duplikat', () => {
    expect(allowedPages('unit_head', { manage_indicators: true, view_all_reports: true }, false))
      .toEqual(['dashboard', 'entry', 'reports', 'indicators', 'crossunit'])
  })

  it('tetap memberi semua halaman untuk admin dan pratinjau', () => {
    expect(allowedPages('admin', {}, false)).toContain('users')
    expect(allowedPages(null, null, true)).toContain('periods')
  })

  it('canAccessPage mengikuti izin pengguna', () => {
    expect(canAccessPage('officer', { manage_indicators: true }, false, 'indicators')).toBe(true)
    expect(canAccessPage('officer', {}, false, 'indicators')).toBe(false)
  })
})
