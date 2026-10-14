import { describe, expect, it } from 'vitest'
import { hashForRoute, isAppPage, routeFromHash } from '../src/lib/routes'

describe('routes', () => {
  it('memetakan hash ke rute halaman', () => {
    expect(routeFromHash('#/dashboard')).toBe('dashboard')
    expect(routeFromHash('#/indicators')).toBe('indicators')
    expect(routeFromHash('#/login')).toBe('login')
  })

  it('mengembalikan null untuk hash tak dikenal', () => {
    expect(routeFromHash('#/tidak-ada')).toBeNull()
    expect(routeFromHash('')).toBeNull()
  })

  it('membuat hash dari rute', () => {
    expect(hashForRoute('indicators')).toBe('#/indicators')
    expect(hashForRoute('login')).toBe('#/login')
  })

  it('membedakan halaman aplikasi dari login', () => {
    expect(isAppPage('reports')).toBe(true)
    expect(isAppPage('login')).toBe(false)
  })
})
