import { useEffect, useState, type FormEvent } from 'react'
import { Building2, Plus, Trash2, UserRoundPlus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { loadUnits, type SpmUnit } from '../../lib/spm-data'
import './UsersPage.css'

type UserRole = 'officer' | 'unit_head' | 'quality' | 'leadership'
interface UserProfile { id: string; full_name: string; role: string; unit_id: string | null }

const roleNames: Record<string, string> = {
  admin: 'Administrator', officer: 'Petugas unit', unit_head: 'Kepala unit', quality: 'Mutu', leadership: 'Pimpinan',
}

function UsersPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [units, setUnits] = useState<SpmUnit[]>([])
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [unitCode, setUnitCode] = useState('')
  const [unitName, setUnitName] = useState('')
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('officer')
  const [unitId, setUnitId] = useState('')
  const [loading, setLoading] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!client || auth.isPreview) return
    let active = true
    Promise.all([
      loadUnits(client),
      client.from('profiles').select('id, full_name, role, unit_id').order('full_name'),
      client.from('profiles').select('role, permissions').eq('id', auth.userId).maybeSingle(),
    ]).then(([nextUnits, profileResult, selfResult]) => {
      if (profileResult.error) throw profileResult.error
      if (!active) return
      setUnits(nextUnits)
      setProfiles(profileResult.data ?? [])
      setUnitId((current) => current || nextUnits[0]?.id || '')
      const self = selfResult.data as { role: string; permissions: Record<string, boolean> } | null
      setCanManage(self?.role === 'admin' || Boolean(self?.permissions?.manage_users))
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Data unit dan pengguna gagal dimuat.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId])

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
      setUnitId(data.id)
      setUnitCode('')
      setUnitName('')
      setNotice('Unit berhasil ditambahkan.')
    }
    setSaving(false)
  }

  async function addProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setSaving(true)
    setError('')
    setNotice('')
    const permissions = role === 'quality'
      ? { view_dashboard: true, input_reports: false, view_own_unit_reports: false, view_all_reports: true, manage_indicators: true, manage_periods: false, view_audit: true, manage_users: false, edit_locked_periods: false }
      : role === 'leadership'
        ? { view_dashboard: true, input_reports: false, view_own_unit_reports: false, view_all_reports: true, manage_indicators: false, manage_periods: false, view_audit: true, manage_users: false, edit_locked_periods: false }
        : { view_dashboard: true, input_reports: true, view_own_unit_reports: true, view_all_reports: false, manage_indicators: false, manage_periods: false, view_audit: false, manage_users: false, edit_locked_periods: false }
    const { data, error: insertError } = await client.from('profiles').insert({
      id: userId.trim(),
      full_name: fullName.trim(),
      role,
      unit_id: role === 'officer' || role === 'unit_head' ? unitId : null,
      permissions,
    }).select('id, full_name, role, unit_id').single()
    if (insertError) setError(insertError.message)
    else if (data) {
      setProfiles((current) => [...current, data].sort((left, right) => left.full_name.localeCompare(right.full_name)))
      setUserId('')
      setFullName('')
      setNotice('Profil berhasil ditautkan ke akun Auth.')
    }
    setSaving(false)
  }

  async function removeUnit(unit: SpmUnit) {
    if (!client) return
    if (!window.confirm(`Hapus unit "${unit.name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setSaving(true)
    setError('')
    setNotice('')
    const { error: deleteError } = await client.from('units').delete().eq('id', unit.id)
    if (deleteError) setError(deleteError.message)
    else {
      setUnits((current) => current.filter((item) => item.id !== unit.id))
      setUnitId((current) => (current === unit.id ? '' : current))
      setNotice('Unit berhasil dihapus.')
    }
    setSaving(false)
  }

  async function removeProfile(profile: UserProfile) {
    if (!client) return
    if (!window.confirm(`Hapus profil "${profile.full_name}"? Akun Auth tetap ada, hanya profil ini yang dilepas.`)) return
    setSaving(true)
    setError('')
    setNotice('')
    const { error: deleteError } = await client.from('profiles').delete().eq('id', profile.id)
    if (deleteError) setError(deleteError.message)
    else {
      setProfiles((current) => current.filter((item) => item.id !== profile.id))
      setNotice('Profil pengguna berhasil dihapus.')
    }
    setSaving(false)
  }

  if (auth.isPreview) {
    return <section className="users-page"><div className="reports-heading"><div><span className="eyebrow">AKSES APLIKASI</span><h1>Unit &amp; pengguna</h1><p>Pengelolaan unit dan profil tersedia setelah Supabase dikonfigurasi.</p></div></div></section>
  }

  return (
    <section className="users-page">
      <div className="reports-heading"><div><span className="eyebrow">AKSES APLIKASI</span><h1>Unit &amp; pengguna</h1><p>Kelola unit pelaporan dan tautkan akun Auth ke profil dengan peran yang sesuai.</p></div></div>
      {error && <div className="users-message is-error" role="alert">{error}</div>}
      {notice && <div className="users-message" role="status">{notice}</div>}
      <div className="users-grid">
        <section className="users-section"><h2><Building2 size={17} /> Tambah unit</h2><form onSubmit={(event) => void addUnit(event)}><label>Kode unit<input required maxLength={20} value={unitCode} onChange={(event) => setUnitCode(event.target.value)} placeholder="Contoh: FARM" /></label><label>Nama unit<input required value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Contoh: Farmasi" /></label><button className="primary-button" type="submit" disabled={saving}><Plus size={15} /> Tambah unit</button></form></section>
        <section className="users-section"><h2><UserRoundPlus size={17} /> Tautkan akun ke profil</h2><form onSubmit={(event) => void addProfile(event)}><label>UID Pengguna<input required value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Masukan UID" /></label><label>Nama lengkap<input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label>Peran<select value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="officer">Petugas unit</option><option value="unit_head">Kepala unit</option><option value="quality">Mutu</option><option value="leadership">Pimpinan</option></select></label>{(role === 'officer' || role === 'unit_head') && <label>Unit<select required value={unitId} onChange={(event) => setUnitId(event.target.value)}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>}<button className="primary-button" type="submit" disabled={saving || loading || !units.length}><UserRoundPlus size={15} /> Tautkan profil</button></form></section>
      </div>
      <section className="users-section users-list-section"><h2>Unit terdaftar ({units.length})</h2><div className="users-table-wrap"><table><thead><tr><th>KODE</th><th>NAMA UNIT</th>{canManage && <th>AKSI</th>}</tr></thead><tbody>{units.map((unit) => <tr key={unit.id}><td>{unit.code}</td><td>{unit.name}</td>{canManage && <td><button className="row-delete" type="button" onClick={() => void removeUnit(unit)} disabled={saving} aria-label={`Hapus unit ${unit.name}`} title="Hapus unit"><Trash2 size={14} /></button></td>}</tr>)}</tbody></table>{!units.length && <p>{loading ? 'Memuat unit…' : 'Belum ada unit.'}</p>}</div></section>
      <section className="users-section users-list-section"><h2>Profil pengguna ({profiles.length})</h2><div className="users-table-wrap"><table><thead><tr><th>NAMA</th><th>PERAN</th><th>UNIT</th><th>UID</th>{canManage && <th>AKSI</th>}</tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id}><td>{profile.full_name}</td><td>{roleNames[profile.role] ?? profile.role}</td><td>{units.find((unit) => unit.id === profile.unit_id)?.name ?? 'Semua unit'}</td><td><code>{profile.id}</code></td>{canManage && <td><button className="row-delete" type="button" onClick={() => void removeProfile(profile)} disabled={saving} aria-label={`Hapus profil ${profile.full_name}`} title="Hapus profil"><Trash2 size={14} /></button></td>}</tr>)}</tbody></table>{!profiles.length && <p>{loading ? 'Memuat profil…' : 'Belum ada profil.'}</p>}</div></section>
    </section>
  )
}

export default UsersPage