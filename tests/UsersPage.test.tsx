import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Row } from './support/fake-supabase'
import UsersPage from '../src/features/users/UsersPage'

const authState = vi.hoisted(() => ({
  isPreview: false,
  role: 'admin' as string | null,
  userId: 'admin-1' as string | null,
  email: 'admin@rsud-ami.go.id' as string | null,
  permissions: null as Record<string, boolean> | null,
  signOut: async () => undefined,
}))

vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => authState }))

const database = vi.hoisted(() => ({ units: [] as Row[], profiles: [] as Row[], indicators: [] as Row[] }))

vi.mock('../src/lib/supabase', async () => {
  const { createFakeClient } = await import('./support/fake-supabase')
  return { getSupabaseClient: () => createFakeClient(database) }
})

const units: Row[] = [
  { id: 'u1', code: 'FARM', name: 'Farmasi' },
  { id: 'u2', code: 'IGD', name: 'Gawat Darurat' },
  { id: 'u3', code: 'RANAP', name: 'Rawat Inap' },
  { id: 'u4', code: 'RAD', name: 'Radiologi' },
]

const longUid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

const admin: Row = { id: 'admin-1', full_name: 'Admin SPM', role: 'admin', unit_id: null, unit_ids: [], email: 'admin@rsud-ami.go.id', permissions: { manage_users: true }, active: true }
const officer: Row = { id: longUid, full_name: 'Siti Rahma', role: 'officer', unit_id: 'u1', unit_ids: ['u1', 'u2', 'u3'], email: 'siti@rsud-ami.go.id', permissions: {}, active: true }
const inactiveHead: Row = { id: 'p2', full_name: 'Rudi Hartono', role: 'unit_head', unit_id: 'u2', unit_ids: ['u2'], email: null, permissions: {}, active: false }

function manyProfiles(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index}`,
    full_name: `Pengguna ${String(index + 1).padStart(2, '0')}`,
    role: 'officer',
    unit_id: 'u1',
    unit_ids: ['u1'],
    email: `pengguna${index}@rsud-ami.go.id`,
    permissions: {},
    active: true,
  }))
}

beforeEach(() => {
  authState.isPreview = false
  authState.userId = 'admin-1'
  database.units = units.map((unit) => ({ ...unit }))
  database.profiles = [admin, officer, inactiveHead].map((profile) => ({ ...profile }))
})

afterEach(() => {
  cleanup()
})

describe('UsersPage', () => {
  it('menampilkan tab Pengguna dengan daftar pengguna secara bawaan', async () => {
    render(<UsersPage />)
    expect(await screen.findByText('Siti Rahma')).toBeTruthy()
    expect(screen.getByText('Rudi Hartono')).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Pengguna/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: /Unit/ }).getAttribute('aria-selected')).toBe('false')
    expect(screen.getByText('3 pengguna')).toBeTruthy()
  })

  it('memotong UID dan menandai unit yang lebih dari dua', async () => {
    render(<UsersPage />)
    const row = (await screen.findByText('Siti Rahma')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('aaaaaaaa…')).toBeTruthy()
    expect(within(row as HTMLElement).getByTitle(longUid)).toBeTruthy()
    expect(within(row as HTMLElement).getByText('+1 unit lain')).toBeTruthy()
    expect(within(row as HTMLElement).getByText('Farmasi, Gawat Darurat, Rawat Inap')).toBeTruthy()
  })

  it('menampilkan badge status aktif dan nonaktif', async () => {
    render(<UsersPage />)
    const officerRow = (await screen.findByText('Siti Rahma')).closest('tr') as HTMLElement
    const headRow = screen.getByText('Rudi Hartono').closest('tr') as HTMLElement
    expect(within(officerRow).getByText('Aktif')).toBeTruthy()
    expect(within(headRow).getByText('Nonaktif')).toBeTruthy()
  })

  it('menyaring pengguna berdasarkan nama unit yang dipegang', async () => {
    render(<UsersPage />)
    await screen.findByText('Siti Rahma')
    fireEvent.change(screen.getByPlaceholderText('Cari nama, email, peran, atau unit'), { target: { value: 'farmasi' } })
    expect(screen.getByText('1 pengguna')).toBeTruthy()
    expect(screen.getByText('Siti Rahma')).toBeTruthy()
    expect(screen.queryByText('Rudi Hartono')).toBeNull()
  })

  it('berpindah ke tab Unit dan menyaring berdasarkan kode', async () => {
    render(<UsersPage />)
    await screen.findByText('Siti Rahma')
    fireEvent.click(screen.getByRole('tab', { name: /Unit/ }))
    expect(await screen.findByText('Farmasi')).toBeTruthy()
    expect(screen.getByText('4 unit')).toBeTruthy()
    expect(screen.queryByText('Siti Rahma')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Cari kode atau nama unit'), { target: { value: 'RAD' } })
    expect(screen.getByText('1 unit')).toBeTruthy()
    expect(screen.getByText('Radiologi')).toBeTruthy()
  })

  it('membuka modal Tambah pengguna, menutup dengan Esc, dan mengembalikan fokus', async () => {
    render(<UsersPage />)
    const addButton = await screen.findByRole('button', { name: /Tambah pengguna/ })
    fireEvent.click(addButton)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Tambah pengguna')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(addButton)
  })

  it('menutup modal saat area latar diklik', async () => {
    render(<UsersPage />)
    await screen.findByText('Siti Rahma')
    fireEvent.click(screen.getByRole('tab', { name: /Unit/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Tambah unit/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.mouseDown(dialog.parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('menolak peran unit tanpa unit yang dipilih dan menampilkan galat di modal', async () => {
    render(<UsersPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Tambah pengguna/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Farmasi' }))
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement)
    expect((await within(dialog).findByRole('alert')).textContent).toBe('Pilih minimal satu unit untuk peran ini.')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('menyembunyikan tombol pengelolaan untuk akun tanpa izin', async () => {
    database.profiles = [{ ...admin, role: 'leadership', permissions: {} }, officer, inactiveHead].map((profile) => ({ ...profile }))
    render(<UsersPage />)
    await screen.findByText('Siti Rahma')
    expect(screen.queryByRole('button', { name: /Tambah pengguna/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Tambah unit/ })).toBeNull()
  })

  it('membatasi tabel 10 baris dan menampilkan petunjuk gulir', async () => {
    database.profiles = manyProfiles(12)
    const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    const boundingRect = HTMLElement.prototype.getBoundingClientRect
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 400 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 380 })
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const index = this.parentElement ? Array.prototype.indexOf.call(this.parentElement.children, this) : -1
      const top = this.tagName === 'TR' ? 100 + index * 30 : 0
      return { top, bottom: top + 30, left: 0, right: 0, width: 0, height: 30, x: 0, y: top, toJSON: () => ({}) } as DOMRect
    }
    try {
      render(<UsersPage />)
      expect(await screen.findByText(/Menampilkan 10 pengguna pertama/)).toBeTruthy()
      const wrap = document.querySelector('.users-table-wrap') as HTMLElement
      expect(wrap.style.maxHeight).toBe('420px')
    } finally {
      if (offsetHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight)
      if (clientHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight)
      HTMLElement.prototype.getBoundingClientRect = boundingRect
    }
  })
})
