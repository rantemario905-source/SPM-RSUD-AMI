import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Building2, Check, Pencil, Plus, Power, Trash2, UserRoundPlus, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { loadUnits, profileUnitNames, type SpmUnit } from '../../lib/spm-data'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import './UsersPage.css'

type UserRole = 'officer' | 'unit_head' | 'quality' | 'leadership' | 'admin'
interface UserProfile { id: string; full_name: string; role: string; unit_id: string | null; unit_ids?: string[] | null; email: string | null; permissions: Record<string, boolean>; active?: boolean }

const roleNames: Record<string, string> = {
  admin: 'Administrator', officer: 'Petugas unit', unit_head: 'Kepala unit', quality: 'Mutu', leadership: 'Pimpinan',
}

const rolePermissions: Record<UserRole, Record<string, boolean>> = {
  officer: { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: false, manage_indicators: false, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
  unit_head: { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: false, manage_indicators: true, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
  quality: { view_dashboard: true, input_reports: true, view_own_unit_reports: false, view_all_reports: true, manage_indicators: true, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false },
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

const baseRoles: UserRole[] = ['officer', 'unit_head', 'quality', 'leadership']

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

function UsersPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [units, setUnits] = useState<SpmUnit[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [unitCode, setUnitCode] = useState('')
  const [unitName, setUnitName] = useState('')
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [unitEditCode, setUnitEditCode] = useState('')
  const [unitEditName, setUnitEditName] = useState('')
  const [form, setForm] = useState<ProfileForm>(() => profileForm([]))
  const [loading, setLoading] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [toast, setToast] = useState('')
  const [highlightForm, setHighlightForm] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'unit'; unit: SpmUnit } | { kind: 'profile'; profile: UserProfile } | null>(null)
  const formRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

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

  const roleChoices: UserRole[] = form.role === 'admin' ? ['admin', ...baseRoles] : baseRoles
  const needsUnit = form.role === 'officer' || form.role === 'unit_head'

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

  async function addUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    const { data, error: insertError } = await client.from('units')
      .insert({ code: unitCode.trim().toUpperCase(), name: unitName.trim() })
      .select('id, code, name').single()
    if (insertError) setError(insertError.message)
    else if (data) {
      setUnits((current) => [...current, data].sort((left, right) => left.name.localeCompare(right.name)))
      setForm((current) => ({
        ...current,
        unitId: current.unitId || data.id,
        unitIds: current.unitIds.length ? current.unitIds : [data.id],
      }))
      setUnitCode('')
      setUnitName('')
      setNotice('Unit berhasil ditambahkan.')
    }
    setSaving(false)
  }

  function startEditUnit(unit: SpmUnit) {
    setEditingUnitId(unit.id)
    setUnitEditCode(unit.code)
    setUnitEditName(unit.name)
    setError('')
    setNotice('')
  }

  function cancelEditUnit() {
    setEditingUnitId(null)
    setUnitEditCode('')
    setUnitEditName('')
  }

  async function saveUnit(unit: SpmUnit) {
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    const { data, error: updateError } = await client.from('units')
      .update({ code: unitEditCode.trim().toUpperCase(), name: unitEditName.trim() })
      .eq('id', unit.id).select('id, code, name').single()
    if (updateError) setError(updateError.message)
    else if (data) {
      setUnits((current) => current.map((item) => item.id === unit.id ? data : item).sort((left, right) => left.name.localeCompare(right.name)))
      cancelEditUnit()
      setNotice('Unit berhasil diperbarui.')
    }
    setSaving(false)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    const role = form.role
    const needsUnitForRole = role === 'officer' || role === 'unit_head'
    const unitIds = needsUnitForRole ? form.unitIds.filter((id) => units.some((unit) => unit.id === id)) : []
    if (needsUnitForRole && unitIds.length === 0) { setError('Pilih minimal satu unit untuk peran ini.'); return }
    const unitId = needsUnitForRole ? (unitIds.includes(form.unitId) ? form.unitId : unitIds[0]) : null
    setSaving(true)
    setError('')
    setNotice('')
    const payload = { full_name: form.fullName.trim(), email: form.email.trim() || null, role, unit_id: unitId, unit_ids: unitIds, permissions: form.permissions }
    const result = form.id
      ? await client.from('profiles').update(payload).eq('id', form.id).select('id, full_name, role, unit_id, unit_ids, email, permissions, active').single()
      : await client.from('profiles').insert({ id: form.userId.trim(), ...payload }).select('id, full_name, role, unit_id, unit_ids, email, permissions, active').single()
    if (result.error) setError(result.error.message)
    else if (result.data) {
      const saved = result.data as UserProfile
      setProfiles((current) => {
        const exists = current.some((item) => item.id === saved.id)
        const next = exists ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]
        return next.sort((left, right) => left.full_name.localeCompare(right.full_name))
      })
      setNotice(form.id ? `Profil ${saved.full_name} diperbarui.` : `Profil ${saved.full_name} ditautkan ke akun Auth.`)
      setForm(profileForm(units))
    }
    setSaving(false)
  }

  function startEditProfile(profile: UserProfile) {
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
    setError('')
    setNotice('')
    setHighlightForm(true)
    window.setTimeout(() => setHighlightForm(false), 1400)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <div className="users-grid">
        <section className="users-section"><h2><Building2 size={17} /> Tambah unit</h2><form onSubmit={(event) => void addUnit(event)}><label>Kode unit<input required maxLength={20} value={unitCode} onChange={(event) => setUnitCode(event.target.value)} placeholder="Contoh: FARM" /></label><label>Nama unit<input required value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Contoh: Farmasi" /></label><button className="primary-button" type="submit" disabled={saving}><Plus size={15} /> Tambah unit</button></form></section>
        <section className={`users-section${highlightForm ? ' is-highlight' : ''}`} ref={formRef}>
          <h2><UserRoundPlus size={17} /> {form.id ? 'Edit profil pengguna' : 'Tautkan akun ke profil'}</h2>
          <form onSubmit={(event) => void saveProfile(event)}>
            <label>UID Pengguna<input required value={form.userId} readOnly={Boolean(form.id)} disabled={Boolean(form.id)} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} placeholder="Masukan UID" /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nama@rsud-ami.go.id" /></label>
            <label>Nama lengkap<input required value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
            <label>Peran<select value={form.role} onChange={(event) => selectRole(event.target.value as UserRole)}>{roleChoices.map((value) => <option key={value} value={value}>{roleNames[value]}</option>)}</select></label>
            {needsUnit && (
              <fieldset className="permission-fieldset unit-fieldset">
                <legend>Unit yang dipegang</legend>
                <div className="permission-grid">
                  {units.map((unit) => (
                    <label className="permission-item" key={unit.id}>
                      <input type="checkbox" checked={form.unitIds.includes(unit.id)} onChange={() => toggleUnit(unit.id)} />
                      <span>{unit.name}</span>
                    </label>
                  ))}
                </div>
                <label className="unit-primary-label">Unit utama
                  <select required value={form.unitId} onChange={(event) => selectPrimaryUnit(event.target.value)}>
                    {form.unitIds.map((id) => {
                      const unit = units.find((item) => item.id === id)
                      return unit ? <option key={unit.id} value={unit.id}>{unit.name}</option> : null
                    })}
                  </select>
                </label>
                <p className="unit-hint">Pilih minimal satu unit. Unit utama dipakai sebagai pilihan awal saat menginput laporan.</p>
              </fieldset>
            )}
            <fieldset className="permission-fieldset"><legend>Izin akses</legend><div className="permission-grid">{permissionLabels.map(({ key, label }) => <label className="permission-item" key={key}><input type="checkbox" checked={Boolean(form.permissions[key])} onChange={() => togglePermission(key)} /><span>{label}</span></label>)}</div></fieldset>
            <div className="users-form-actions">
              <button className="primary-button" type="submit" disabled={saving || loading || (needsUnit && !units.length)}><UserRoundPlus size={15} /> {form.id ? 'Simpan perubahan' : 'Tautkan profil'}</button>
              {form.id && <button className="secondary-button" type="button" onClick={() => setForm(profileForm(units))} disabled={saving}><X size={15} /> Batal</button>}
            </div>
          </form>
        </section>
      </div>
      <section className="users-section users-list-section">
        <h2>Unit terdaftar ({units.length})</h2>
        <div className="users-table-wrap"><table><thead><tr><th>KODE</th><th>NAMA UNIT</th>{canManage && <th>AKSI</th>}</tr></thead><tbody>{units.map((unit) => editingUnitId === unit.id
          ? <tr key={unit.id}><td><input className="inline-input" value={unitEditCode} onChange={(event) => setUnitEditCode(event.target.value)} aria-label="Kode unit" /></td><td><input className="inline-input" value={unitEditName} onChange={(event) => setUnitEditName(event.target.value)} aria-label="Nama unit" /></td><td className="row-actions"><button className="row-save" type="button" onClick={() => void saveUnit(unit)} disabled={saving} title="Simpan" aria-label={`Simpan unit ${unit.name}`}><Check size={14} /></button><button className="row-cancel" type="button" onClick={cancelEditUnit} disabled={saving} title="Batal" aria-label="Batal edit unit"><X size={14} /></button></td></tr>
          : <tr key={unit.id}><td>{unit.code}</td><td>{unit.name}</td>{canManage && <td className="row-actions"><button className="row-edit" type="button" onClick={() => startEditUnit(unit)} disabled={saving} title="Edit unit" aria-label={`Edit unit ${unit.name}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => setPendingDelete({ kind: 'unit', unit })} disabled={saving} aria-label={`Hapus unit ${unit.name}`} title="Hapus unit"><Trash2 size={14} /></button></td>}</tr>
        )}</tbody></table>{!units.length && <p>{loading ? 'Memuat unit…' : 'Belum ada unit.'}</p>}</div>
      </section>
      <section className="users-section users-list-section">
        <h2>Profil pengguna ({profiles.length})</h2>
        <div className="users-table-wrap"><table><thead><tr><th>NAMA</th><th>PERAN</th><th>UNIT</th><th>EMAIL</th><th>STATUS</th><th>UID</th>{canManage && <th>AKSI</th>}</tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td>{profile.full_name}</td><td>{roleNames[profile.role] ?? profile.role}</td><td>{profileUnitNames(profile, units).join(', ') || 'Semua unit'}</td><td>{profile.email ?? '—'}</td><td>{profile.active === false ? <span className="status-badge is-inactive">Nonaktif</span> : <span className="status-badge is-active">Aktif</span>}</td><td><code>{profile.id}</code></td>{canManage && <td className="row-actions"><button className={`row-toggle ${profile.active === false ? 'is-off' : ''}`} type="button" onClick={() => void toggleActive(profile)} disabled={saving || profile.id === auth.userId} title={profile.active === false ? 'Aktifkan pengguna' : 'Nonaktifkan pengguna'} aria-label={`${profile.active === false ? 'Aktifkan' : 'Nonaktifkan'} ${profile.full_name}`}><Power size={14} /></button><button className="row-edit" type="button" onClick={() => startEditProfile(profile)} disabled={saving} title="Edit profil" aria-label={`Edit profil ${profile.full_name}`}><Pencil size={14} /></button><button className="row-delete" type="button" onClick={() => setPendingDelete({ kind: 'profile', profile })} disabled={saving} aria-label={`Hapus profil ${profile.full_name}`} title="Hapus profil"><Trash2 size={14} /></button></td>}</tr>)}</tbody></table>{!profiles.length && <p>{loading ? 'Memuat profil…' : 'Belum ada profil.'}</p>}</div>
      </section>
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
