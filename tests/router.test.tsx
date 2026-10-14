import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouterProvider } from '../src/lib/router'
import { useRouter } from '../src/lib/routerContext'

function Probe() {
  const { route, navigate } = useRouter()
  return (
    <div>
      <span data-testid="route">{route}</span>
      <button type="button" onClick={() => navigate('reports')}>ke-reports</button>
      <button type="button" onClick={() => navigate('login', { replace: true })}>ke-login</button>
    </div>
  )
}

describe('RouterProvider', () => {
  beforeEach(() => {
    window.location.hash = '#/dashboard'
  })

  afterEach(() => {
    cleanup()
  })

  it('membaca rute awal dari hash', () => {
    window.location.hash = '#/indicators'
    render(<RouterProvider><Probe /></RouterProvider>)
    expect(screen.getByTestId('route').textContent).toBe('indicators')
  })

  it('menavigasi ke halaman baru dan menulis hash', () => {
    render(<RouterProvider><Probe /></RouterProvider>)
    fireEvent.click(screen.getByText('ke-reports'))
    expect(screen.getByTestId('route').textContent).toBe('reports')
    expect(window.location.hash).toBe('#/reports')
  })

  it('mengikuti hashchange saat tombol back/forward browser', () => {
    render(<RouterProvider><Probe /></RouterProvider>)
    window.location.hash = '#/entry'
    fireEvent(window, new Event('hashchange'))
    expect(screen.getByTestId('route').textContent).toBe('entry')
  })

  it('mendukung replace ke layar login', () => {
    render(<RouterProvider><Probe /></RouterProvider>)
    fireEvent.click(screen.getByText('ke-login'))
    expect(screen.getByTestId('route').textContent).toBe('login')
    expect(window.location.hash).toBe('#/login')
  })
})
