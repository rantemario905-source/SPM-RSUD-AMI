import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Building2, Check, Pencil, Plus, Power, Search, Trash2, UserRoundPlus, Users, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { loadUnits, profileUnitNames, type SpmUnit } from '../../lib/spm-data'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import './UsersPage.css'

type UserRole = 'officer' | 'unit_head' | 'leadership' | 'admin'
interface UserProfile { id: string; full_name: string; role: string; unit_id: string | null; unit_ids?: string[] | null; email: string | null; permissions: Record<string, boolean>; active?: boolean }

const roleNames: Record<string, string> = {
  admin: 'Administrator', officer: 'Petugas unit', unit_head: 'Kepala unit', leadership: 'Pimpinan',
}

const rolePermissions: Record<UserRole, Record<string, boolean>> = {
  officer: { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: false, manage_indicators: false, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
  unit_head: { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: false, manage_indicators: true, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
  leadership: { view_dashboard: true, input_reports: true, view_own_unit_reports: false, view_all_reports: true, manage_indicators: true, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
  admin: { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: true, manage_indicators: true, manage_periods: true, view_audit: true, manage_users: true, edit_locked_periods: true },
}

const permissionLabels: { key: string; label: string }[] = [
  { key: 'view_dashboard', label: 'Lihat ringkasan' },
  { key: 'input_reports', label: 'Input laporan' },
  { key: 'view_own_unit_reports', label: 'Lihat laporan unit sendiri' },
  { key: 'view_all_reports', label: 'Lihat laporan semua unit' },
  { key: 'manage_indicators', label: 'Kelola indikator SPM' },
  { key: 'manage_periods', label: 'Kelola periode' },
  { key: 'view_audit', label: 'Lihat audit' },
  { key: 'manage_users', label: 'Kelola unit & pengguna' },
  { key: 'edit_locked_periods', label: 'Edit periode terkunci' },
]

const baseRoles: UserRole[] = ['officer', 'unit_head', 'leadership']
const tablePreviewRows = 10
const visibleUnitNames = 2

interface ProfileForm {
  id: string | null
  userId: string
  email: string
  fullName: string
  role: UserRole
  unitId: string
  unitIds: string[]
  permissions: Record<string, boolean>
}

function profileForm(units: SpmUnit[]): ProfileForm {
  return { id: null, userId: '', email: '', fullName: '', role: 'officer', unitId: units[0]?.id ?? '', unitIds: units[0] ? [units[0].id] : [], permissions: { ...rolePermissions.officer } }
}

function measureTableHeight(wrap: HTMLDivElement | null): number | null {
  if (!wrap) return null
  wrap.scrollTop = 0
  const rows = wrap.querySelectorAll('tbody tr')
  if (rows.length <= tablePreviewRows) return null
  const firstHidden = rows[tablePreviewRows] as HTMLElement | undefined
  if (!firstHidden) return null
  const offset = firstHidden.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop
  const chrome = wrap.offsetHeight - wrap.clientHeight
  return Math.max(0, Math.round(offset) + chrome)
}

function UsersPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [units, setUnits] = useState<SpmUnit[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [form, setForm] = useState<ProfileForm>(() => profileForm([]))
  const [loading, setLoading] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'users' | 'units'>('users')
  const [userQuery, setUserQuery] = useState('')
  const [unitQuery, setUnitQuery] = useState('')
  const [profileDialog, setProfileDialog] = useState(false)
  const [unitDialog, setUnitDialog] = useState<'create' | 'edit' | null>(null)
  const [unitForm, setUnitForm] = useState({ id: '', code: '', name: '' })
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'unit'; unit: SpmUnit } | { kind: 'profile'; profile: UserProfile } | null>(null)
  const [unitTableMaxHeight, setUnitTableMaxHeight] = useState<number | null>(null)
  const [profileTableMaxHeight, setProfileTableMaxHeight] = useState<number | null>(null)
  const unitTableRef = useRef<HTMLDivElement | null>(null)
  const profileTableRef = useRef<HTMLDivElement | null>(null)
  const addProfileButtonRef = useRef<HTMLButtonElement | null>(null)
  const addUnitButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!highlightId) return
    const timer = window.setTimeout(() => setHighlightId((current) => (current === highlightId ? null : current)), 1400)
    return () => window.clearTimeout(timer)
  }, [highlightId])

  useEffect(() => {
    if (!profileDialog && !unitDialog) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || saving) return
      if (profileDialog) {
        setProfileDialog(false)
        setFormError('')
        addProfileButtonRef.current?.focus()
      } else {
        setUnitDialog(null)
        setFormError('')
        addUnitButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [profileDialog, unitDialog, saving])

  useEffect(() => {
    if (!client || auth.isPreview) return
    let active = true
    Promise.all([
      loadUnits(client),
      client.from('profiles').select('id, full_name, role, unit_id, unit_ids, email, permissions, active').order('full_name'),
      client.from('profiles').select('role, permissions').eq('id', auth.userId).maybeSingle(),
    ]).then(([nextUnits, profileResult, selfResult]) => {
      if (profileResult.error) throw profileResult.error
      if (!active) return
      setUnits(nextUnits)
      setProfiles((profileResult.data ?? []) as UserProfile[])
      setForm((current) => ({
        ...current,
        unitId: current.unitId || nextUnits[0]?.id || '',
        unitIds: current.unitIds.length ? current.unitIds : nextUnits[0] ? [nextUnits[0].id] : [],
      }))
      const self = selfResult.data as { role: string; permissions: Record<string, boolean> } | null
      setCanManage(self?.role === 'admin' || Boolean(self?.permissions?.manage_users))
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Data unit dan pengguna gagal dimuat.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId])

  useEffect(() => {
    function measure() {
      setUnitTableMaxHeight(measureTableHeight(unitTableRef.current))
      setProfileTableMaxHeight(measureTableHeight(profileTableRef.current))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [tab, units, profiles, userQuery, unitQuery])

  const filteredUnits = useMemo(() => units.filter((unit) => `${unit.code} ${unit.name}`.toLowerCase().includes(unitQuery.trim().toLowerCase())), [units, unitQuery])
  const filteredProfiles = useMemo(() => profiles.filter((profile) => {
    const haystack = `${profile.full_name} ${profile.email ?? ''} ${roleNames[profile.role] ?? profile.role} ${profileUnitNames(profile, units).join(' ')}`
    return haystack.toLowerCase().includes(userQuery.trim().toLowerCase())
  }), [profiles, units, userQuery])

  const roleChoices: UserRole[] = form.role === 'admin' ? ['admin', ...baseRoles] : baseRoles
  const needsUnit = form.role === 'officer' || form.role === 'unit_head'

  function flashHighlight(id: string) {
    setHighlightId(id)
  }

  function selectRole(next: UserRole) {
    setForm((current) => {
      const needsUnit = next === 'officer' || next === 'unit_head'
      const unitIds = needsUnit
        ? (current.unitIds.length ? current.unitIds : (units[0] ? [units[0].id] : []))
        : []
      const unitId = needsUnit
        ? (unitIds.includes(current.unitId) ? current.unitId : unitIds[0] ?? '')
        : current.unitId
      return { ...current, role: next, unitId, unitIds, permissions: { ...rolePermissions[next] } }
    })
  }

  function togglePermission(key: string) {
    setForm((current) => ({ ...current, permissions: { ...current.permissions, [key]: !current.permissions[key] } }))
  }

  function toggleUnit(id: string) {
    setForm((current) => {
      const has = current.unitIds.includes(id)
      const unitIds = has ? current.unitIds.filter((item) => item !== id) : [...current.unitIds, id]
      const unitId = unitIds.includes(current.unitId) ? current.unitId : unitIds[0] ?? ''
      return { ...current, unitIds, unitId }
    })
  }

  function selectPrimaryUnit(id: string) {
    setForm((current) => ({ ...current, unitId: id }))
  }

  function openCreateUnit() {
    setUnitForm({ id: '', code: '', name: '' })
    setFormError('')
    setError('')
    setNotice('')
    setUnitDialog('create')
  }

  function openEditUnit(unit: SpmUnit) {
    setUnitForm({ id: unit.id, code: unit.code, name: unit.name })
    setFormError('')
    setError('')
    setNotice('')
    setUnitDialog('edit')
  }

  function closeUnitDialog() {
    setUnitDialog(null)
    setFormError('')
    addUnitButtonRef.current?.focus()
  }

  function openCreateProfile() {
    setForm(profileForm(units))
    setFormError('')
    setError('')
    setNotice('')
    setProfileDialog(true)
  }

  function openEditProfile(profile: UserProfile) {
    const role = (profileNames.includes(profile.role) ? profile.role : 'officer') as UserRole
    const unitIds = profile.unit_ids?.length ? profile.unit_ids : profile.unit_id ? [profile.unit_id] : []
    setForm({
      id: profile.id,
      userId: profile.id,
      email: profile.email ?? '',
      fullName: profile.full_name,
      role,
      unitId: profile.unit_id ?? unitIds[0] ?? '',
      unitIds,
      permissions: { ...(rolePermissions[profile.role as UserRole] ?? rolePermissions.officer), ...(profile.permissions ?? {}) },
    })
    setFormError('')
    setError('')
    setNotice('')
    setProfileDialog(true)
  }

  function closeProfileDialog() {
    setProfileDialog(false)
    setFormError('')
    addProfileButtonRef.current?.focus()
  }

  async function submitUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    setFormError('')
    const payload = { code: unitForm.code.trim().toUpperCase(), name: unitForm.name.trim() }
    const result = unitForm.id
      ? await client.from('units').update(payload).eq('id', unitForm.id).select('id, code, name').single()
      : await client.from('units').insert(payload).select('id, code, name').single()
    if (result.error) setFormError(result.error.message)
    else if (result.data) {
      const saved = result.data as SpmUnit
      setUnits((current) => {
        const exists = current.some((item) => item.id === saved.id)
        const next = exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]
        return next.sort((left, right) => left.name.localeCompare(right.name))
      })
      setForm((current) => ({
        ...current,
        unitId: current.unitId || saved.id,
        unitIds: current.unitIds.length ? current.unitIds : [saved.id],
      }))
      setUnitQuery('')
      setNotice(unitForm.id ? 'Unit berhasil diperbarui.' : 'Unit berhasil ditambahkan.')
      flashHighlight(saved.id)
      setUnitDialog(null)
    }
    setSaving(false)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    const role = form.role
    const needsUnitForRole = role === 'officer' || role === 'unit_head'
    const unitIds = needsUnitForRole ? form.unitIds.filter((id) => units.some((unit) => unit.id === id)) : []
    if (needsUnitForRole && unitIds.length === 0) { setFormError('Pilih minimal satu unit untuk peran ini.'); return }
    const unitId = needsUnitForRole ? (unitIds.includes(form.unitId) ? form.unitId : unitIds[0]) : null
    setSaving(true)
    setError('')
    setNotice('')
    setFormError('')
    const payload = { full_name: form.fullName.trim(), email: form.email.trim() || null, role, unit_id: unitId, unit_ids: unitIds, permissions: form.permissions }
    const result = form.id
      ? await client.from('profiles').update(payload).eq('id', form.id).select('id, full_name, role, unit_id, unit_ids, email, permissions, active').single()
      : await client.from('profiles').insert({ id: form.userId.trim(), ...payload }).select('id, full_name, role, unit_id, unit_ids, email, permissions, active').single()
    if (result.error) setFormError(result.error.message)
    else if (result.data) {
      const saved = result.data as UserProfile
      setProfiles((current) => {
        const exists = current.some((item) => item.id === saved.id)
        const next = exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]
        return next.sort((left, right) => left.full_name.localeCompare(right.full_name))
      })
      setUserQuery('')
      setNotice(form.id ? `Profil ${saved.full_name} diperbarui.` : `Profil ${saved.full_name} ditautkan ke akun Auth.`)
      flashHighlight(saved.id)
      setProfileDialog(false)
    }
    setSaving(false)
  }

  async function removeUnit(unit: SpmUnit) {
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    const { error: deleteError } = await client.from('units').delete().eq('id', unit.id)
    if (deleteError) setError(deleteError.message)
    else {
      setUnits((current) => current.filter((item) => item.id !== unit.id))
      setForm((current) => {
        if (!current.unitIds.includes(unit.id)) return current
        const unitIds = current.unitIds.filter((id) => id !== unit.id)
        const unitId = unitIds.includes(current.unitId) ? current.unitId : unitIds[0] ?? ''
        return { ...current, unitIds, unitId }
      })
      setNotice('Unit berhasil dihapus.')
      setToast('Unit berhasil dihapus.')
    }
    setSaving(false)
  }

  async function toggleActive(profile: UserProfile) {
    if (!client) return
    if (profile.id === auth.userId) {
      setError('Tidak bisa menonaktifkan akun sendiri.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    const next = !profile.active
    const { error: updateError } = await client.from('profiles').update({ active: next }).eq('id', profile.id)
    if (updateError) setError(updateError.message)
    else {
      setProfiles((current) => current.map((item) => item.id === profile.id ? { ...item, active: next } : item))
      setNotice(`Profil ${profile.full_name} ${next ? 'diaktifkan' : 'dinonaktifkan'}.`)
      setToast(`Profil ${profile.full_name} ${next ? 'diaktifkan' : 'dinonaktifkan'}.`)
    }
    setSaving(false)
  }

  async function removeProfile(profile: UserProfile) {
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    const { error: deleteError } = await client.from('profiles').delete().eq('id', profile.id)
    if (deleteError) setError(deleteError.message)
    else {
      setProfiles((current) => current.filter((item) => item.id !== profile.id))
      if (form.id === profile.id) setForm(profileForm(units))
      setNotice('Profil pengguna berhasil dihapus.')
      setToast('Profil pengguna berhasil dihapus.')
    }
    setSaving(false)
  }

  if (auth.isPreview) {
    return <section className="users-page"><div className="reports-heading"><div><span className="eyebrow">AKSES APLIKASI</span><h1>Unit &amp; pengguna</h1><p>Pengelolaan unit dan profil tersedia setelah Supabase dikonfigurasi.</p></div></div></section>
  }

  return (
    <section className="users-page">
      <div className="reports-heading"><div><span className="eyebrow">AKSES APLIKASI</span><h1>Unit &amp; pengguna</h1><p>Kelola unit pelaporan serta tautkan akun Auth ke profil dengan peran dan izin yang sesuai.</p></div></div>
      {error && <div className="users-message is-error" role="alert">{error}</div>}
      {notice && <div className="users-message" role="status">{notice}</div>}

      <div className="users-tabs" role="tablist" aria-label="Bagian pengelolaan akses">
        <button className={`users-tab${tab === 'users' ? ' is-active' : ''}`} type="button" role="tab" id="users-tab-pengguna" aria-selected={tab === 'users'} aria-controls="users-panel-pengguna" onClick={() => setTab('users')}><Users size={15} aria-hidden="true" />Pengguna<span className="users-tab-count">{profiles.length}</span></button>
        <button className={`users-tab${tab === 'units' ? ' is-active' : ''}`} type="button" role="tab" id="users-tab-unit" aria-selected={tab === 'units'} aria-controls="users-panel-unit" onClick={() => setTab('units')}><Building2 size={15} aria-hidden="true" />Unit<span className="users-tab-count">{units.length}</span></button>
      </div>

      {tab === 'users' ? (
        <section className="users-section users-list-section" role="tabpanel" id="users-panel-pengguna" aria-labelledby="users-tab-pengguna">
          <div className="users-toolbar">
            <label className="users-search"><span className="sr-only">Cari pengguna</span><Search size={15} aria-hidden="true" /><input type="search" name="user-search" autoComplete="off" spellCheck={false} value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Cari nama, email, peran, atau unit" /></label>
            <span className="users-result-count">{filteredProfiles.length} pengguna</span>
            {canManage && <button ref={addProfileButtonRef} className="primary-button" type="button" onClick={openCreateProfile} disabled={saving || loading}><UserRoundPlus size={15} /> Tambah pengguna</button>}
          </div>
          <div className="users-table-wrap" ref={profileTableRef} style={profileTableMaxHeight ? { maxHeight: `${profileTableMaxHeight}px` } : undefined}>
            <table>
              <thead><tr><th scope="col">NAMA</th><th scope="col">PERAN</th><th scope="col">UNIT</th><th scope="col">EMAIL</th><th scope="col">STATUS</th><th scope="col">UID</th>{canManage && <th scope="col">AKSI</th>}</tr></thead>
              <tbody>{filteredProfiles.map((profile) => {
                const names = profileUnitNames(profile, units)
                const unitLabel = names.length ? names.join(', ') : 'Semua unit'
                return <tr key={profile.id} className={highlightId === profile.id ? 'is-highlight' : undefined}>
                  <td className="users-name">{profile.full_name}</td>
                  <td>{roleNames[profile.role] ?? profile.role}</td>
                  <td className="users-units" title={unitLabel}><span className="users-unit-list">{unitLabel}</span>{names.length > visibleUnitNames && <span className="users-unit-more">+{names.length - visibleUnitNames} unit lain</span>}</td>
                  <td className="users-email">{profile.email ?? '—'}</td>
                  <td>{profile.active === false ? <span className="status-badge is-inactive">Nonaktif</span> : <span className="status-badge is-active">Aktif</span>}</td>
                  <td className="users-uid"><code title={profile.id}>{profile.id.slice(0, 8)}…</code></td>
                  {canManage && <td className="row-actions"><button className={`row-toggle ${profile.active === false ? 'is-off' : ''}`} type="button" onClick={() => void toggleActive(profile)} disabled={saving || profile.id === auth.userId} title={profile.active === false ? 'Aktifkan pengguna' : 'Nonaktifkan pengguna'} aria-label={`${profile.active === false ? 'Aktifkan' : 'Nonaktifkan'} ${profile.full_name}`}><Power size={14} /></button><button className="row-edit" type="button" onClick={() => openEditProfile(profile)} disabled={saving} title="Edit profil" aria-label={`Edit profil ${profile.full_name}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => setPendingDelete({ kind: 'profile', profile })} disabled={saving} aria-label={`Hapus profil ${profile.full_name}`} title="Hapus profil"><Trash2 size={14} /></button></td>}
                </tr>
              })}</tbody>
            </table>
            {!filteredProfiles.length && <p className="users-empty">{loading ? 'Memuat profil…' : profiles.length ? 'Tidak ada pengguna yang cocok dengan pencarian.' : 'Belum ada profil pengguna.'}</p>}
          </div>
          {profileTableMaxHeight && <p className="users-scroll-hint">Menampilkan {tablePreviewRows} pengguna pertama — gulir di dalam tabel untuk melihat sisanya.</p>}
        </section>
      ) : (
        <section className="users-section users-list-section" role="tabpanel" id="users-panel-unit" aria-labelledby="users-tab-unit">
          <div className="users-toolbar">
            <label className="users-search"><span className="sr-only">Cari unit</span><Search size={15} aria-hidden="true" /><input type="search" name="unit-search" autoComplete="off" spellCheck={false} value={unitQuery} onChange={(event) => setUnitQuery(event.target.value)} placeholder="Cari kode atau nama unit" /></label>
            <span className="users-result-count">{filteredUnits.length} unit</span>
            {canManage && <button ref={addUnitButtonRef} className="primary-button" type="button" onClick={openCreateUnit} disabled={saving || loading}><Plus size={15} /> Tambah unit</button>}
          </div>
          <div className="users-table-wrap" ref={unitTableRef} style={unitTableMaxHeight ? { maxHeight: `${unitTableMaxHeight}px` } : undefined}>
            <table>
              <thead><tr><th scope="col">KODE</th><th scope="col">NAMA UNIT</th>{canManage && <th scope="col">AKSI</th>}</tr></thead>
              <tbody>{filteredUnits.map((unit) => <tr key={unit.id} className={highlightId === unit.id ? 'is-highlight' : undefined}>
                <td className="users-code">{unit.code}</td>
                <td>{unit.name}</td>
                {canManage && <td className="row-actions"><button className="row-edit" type="button" onClick={() => openEditUnit(unit)} disabled={saving} title="Edit unit" aria-label={`Edit unit ${unit.name}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => setPendingDelete({ kind: 'unit', unit })} disabled={saving} aria-label={`Hapus unit ${unit.name}`} title="Hapus unit"><Trash2 size={14} /></button></td>}
              </tr>)}</tbody>
            </table>
            {!filteredUnits.length && <p className="users-empty">{loading ? 'Memuat unit…' : units.length ? 'Tidak ada unit yang cocok dengan pencarian.' : 'Belum ada unit.'}</p>}
          </div>
          {unitTableMaxHeight && <p className="users-scroll-hint">Menampilkan {tablePreviewRows} unit pertama — gulir di dalam tabel untuk melihat sisanya.</p>}
        </section>
      )}

      {unitDialog && canManage && (
        <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) closeUnitDialog() }}>
          <section className="users-modal users-modal-narrow" role="dialog" aria-modal="true" aria-labelledby="users-unit-title">
            <div className="users-modal-heading"><div><span className="eyebrow">UNIT PELAPORAN</span><h2 id="users-unit-title">{unitDialog === 'edit' ? 'Edit unit' : 'Tambah unit'}</h2></div><button className="users-modal-close" type="button" onClick={closeUnitDialog} disabled={saving} aria-label="Tutup"><X size={18} /></button></div>
            <form onSubmit={(event) => void submitUnit(event)}>
              <label>Kode unit<input required maxLength={20} autoFocus name="unit-code" autoComplete="off" spellCheck={false} value={unitForm.code} onChange={(event) => setUnitForm((current) => ({ ...current, code: event.target.value }))} placeholder="Contoh: FARM" /></label>
              <label>Nama unit<input required name="unit-name" autoComplete="off" value={unitForm.name} onChange={(event) => setUnitForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contoh: Farmasi" /></label>
              {formError && <p className="users-field-error" role="alert">{formError}</p>}
              <div className="users-modal-actions">
                <button className="secondary-button" type="button" onClick={closeUnitDialog} disabled={saving}><X size={15} /> Batal</button>
                <button className="primary-button" type="submit" disabled={saving}>{unitDialog === 'edit' ? <Check size={15} /> : <Plus size={15} />} {unitDialog === 'edit' ? 'Simpan perubahan' : 'Tambah unit'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {profileDialog && canManage && (
        <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) closeProfileDialog() }}>
          <section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-profile-title">
            <div className="users-modal-heading"><div><span className="eyebrow">PROFIL &amp; IZIN</span><h2 id="users-profile-title">{form.id ? 'Edit profil pengguna' : 'Tambah pengguna'}</h2></div><button className="users-modal-close" type="button" onClick={closeProfileDialog} disabled={saving} aria-label="Tutup"><X size={18} /></button></div>
            <form onSubmit={(event) => void saveProfile(event)}>
              <label>UID Pengguna<input required name="profile-uid" autoComplete="off" spellCheck={false} autoFocus={!form.id} value={form.userId} readOnly={Boolean(form.id)} disabled={Boolean(form.id)} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} placeholder="Masukkan UID akun Auth" />{form.id && <small className="users-field-hint">UID akun Auth tidak dapat diubah.</small>}</label>
              <label>Email<input type="email" name="profile-email" autoComplete="email" spellCheck={false} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nama@rsud-ami.go.id" /></label>
              <label>Nama lengkap<input required name="profile-name" autoComplete="name" autoFocus={Boolean(form.id)} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Nama pengguna" /></label>
              <label>Peran<select name="profile-role" value={form.role} onChange={(event) => selectRole(event.target.value as UserRole)}>{roleChoices.map((value) => <option key={value} value={value}>{roleNames[value]}</option>)}</select></label>
              {needsUnit && (
                <fieldset className="permission-fieldset unit-fieldset">
                  <legend>Unit yang dipegang</legend>
                  <div className="users-unit-options">
                    <div className="permission-grid">
                      {units.map((unit) => (
                        <label className="permission-item" key={unit.id}>
                          <input type="checkbox" checked={form.unitIds.includes(unit.id)} onChange={() => toggleUnit(unit.id)} />
                          <span>{unit.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {!units.length && <p className="unit-hint">Belum ada unit terdaftar. Tambahkan unit lebih dulu pada tab Unit.</p>}
                  <label className="unit-primary-label">Unit utama
                    <select required name="profile-primary-unit" value={form.unitId} onChange={(event) => selectPrimaryUnit(event.target.value)}>
                      {form.unitIds.map((id) => {
                        const unit = units.find((item) => item.id === id)
                        return unit ? <option key={unit.id} value={unit.id}>{unit.name}</option> : null
                      })}
                    </select>
                  </label>
                  {Boolean(units.length) && <p className="unit-hint">Pilih minimal satu unit. Unit utama dipakai sebagai pilihan awal saat menginput laporan.</p>}
                </fieldset>
              )}
              {formError && <p className="users-field-error" role="alert">{formError}</p>}
              <fieldset className="permission-fieldset"><legend>Izin akses</legend><div className="permission-grid">{permissionLabels.map(({ key, label }) => <label className="permission-item" key={key}><input type="checkbox" checked={Boolean(form.permissions[key])} onChange={() => togglePermission(key)} /><span>{label}</span></label>)}</div></fieldset>
              <div className="users-modal-actions">
                <button className="secondary-button" type="button" onClick={closeProfileDialog} disabled={saving}><X size={15} /> Batal</button>
                <button className="primary-button" type="submit" disabled={saving || loading || (needsUnit && !units.length)}>{form.id ? <Check size={15} /> : <UserRoundPlus size={15} />} {form.id ? 'Simpan perubahan' : 'Tautkan profil'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="users-toast" role="status">{toast}</div>}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.kind === 'profile' ? 'Hapus profil' : 'Hapus unit'}
        message={pendingDelete?.kind === 'profile'
          ? `Hapus profil "${pendingDelete.profile.full_name}"? Akun Auth tetap ada, hanya profil ini yang dilepas.`
          : pendingDelete ? `Hapus unit "${pendingDelete.unit.name}"? Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmIcon={<Trash2 size={15} />}
        onConfirm={() => {
          const target = pendingDelete
          setPendingDelete(null)
          if (target?.kind === 'profile') void removeProfile(target.profile)
          else if (target?.kind === 'unit') void removeUnit(target.unit)
        }}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  )
}

const profileNames = Object.keys(roleNames)

export default UsersPage
