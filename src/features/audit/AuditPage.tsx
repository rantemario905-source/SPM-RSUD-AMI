import { useEffect, useState } from 'react'
import { CircleAlert, History } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { demoAudit } from '../../data/demo'
import { getSupabaseClient } from '../../lib/supabase'
import { periodLabel } from '../../lib/spm-data'
import './AuditPage.css'

interface AuditItem { title: string; changes: string; person: string; date: string }

const fieldLabels: Record<string, string> = {
  numerator: 'Numerator',
  denominator: 'Denominator',
  analysis: 'Analisa',
  evidence_note: 'Catatan bukti',
  period_start: 'Periode',
}

const actionTitles: Record<string, string> = {
  report_created: 'Laporan dibuat',
  report_updated: 'Laporan diperbarui',
  entry_created: 'Entri indikator dibuat',
  entry_updated: 'Entri indikator diperbarui',
}

function AuditPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [items, setItems] = useState<AuditItem[]>(auth.isPreview ? demoAudit : [])
  const [loading, setLoading] = useState(!auth.isPreview)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client || auth.isPreview) return
    const supabase = client
    let active = true
    async function loadAudit() {
      const { data, error: queryError } = await supabase
        .from('report_audit')
        .select('id, actor_id, action, old_values, new_values, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (queryError) throw queryError
      const rows = data ?? []
      const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))]
      const names = new Map<string, string>()
      if (actorIds.length) {
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name').in('id', actorIds)
        if (profileError) throw profileError
        for (const profile of profiles ?? []) names.set(profile.id, profile.full_name)
      }
      const { data: indicators } = await supabase.from('indicators').select('id, name')
      const indicatorNames = new Map((indicators ?? []).map((indicator) => [indicator.id, indicator.name]))
      const { data: units } = await supabase.from('units').select('id, name')
      const unitNames = new Map((units ?? []).map((unit) => [unit.id, unit.name]))

      const resolve = (key: string, value: unknown) => {
        if (value === null || value === undefined || value === '') return 'kosong'
        if (key === 'indicator_id') return indicatorNames.get(String(value)) ?? 'Indikator'
        if (key === 'unit_id') return unitNames.get(String(value)) ?? 'Unit'
        if (key === 'period_start') return periodLabel(String(value))
        return String(value)
      }
      const labelOf = (key: string) => fieldLabels[key] ?? key

      return rows.map((row) => {
        const oldValues = row.old_values && typeof row.old_values === 'object' ? row.old_values as Record<string, unknown> : {}
        const newValues = row.new_values && typeof row.new_values === 'object' ? row.new_values as Record<string, unknown> : {}
        const isCreated = String(row.action).endsWith('created')
        const indicatorId = newValues.indicator_id ?? oldValues.indicator_id
        const unitId = newValues.unit_id ?? oldValues.unit_id
        const context = indicatorId ? indicatorNames.get(String(indicatorId)) : unitId ? unitNames.get(String(unitId)) : undefined
        const base = actionTitles[String(row.action)] ?? 'Perubahan data'
        const keys = Object.keys(isCreated ? newValues : { ...oldValues, ...newValues })
          .filter((key) => key !== 'indicator_id' && key !== 'unit_id')
        const parts = keys.flatMap((key) => {
          const before = resolve(key, oldValues[key])
          const after = resolve(key, newValues[key])
          if (isCreated) return after === 'kosong' ? [] : [`${labelOf(key)}: ${after}`]
          return before === after ? [] : [`${labelOf(key)}: ${before} → ${after}`]
        })
        return {
          title: context ? `${base} · ${context}` : base,
          changes: parts.join(' · ') || 'Tidak ada perubahan nilai tercatat',
          person: row.actor_id ? names.get(row.actor_id) ?? 'Pengguna terautentikasi' : 'Sistem',
          date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.created_at)),
        }
      })
    }
    void loadAudit()
      .then((nextItems) => { if (active) setItems(nextItems) })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Riwayat perubahan gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview])

  return (
    <section className="audit-page">
      <div className="reports-heading"><div><span className="eyebrow">AKUNTABILITAS DATA</span><h1>Jejak perubahan</h1><p>Riwayat mencatat siapa yang mengubah, waktu perubahan, serta nilai sebelum dan sesudah.</p></div></div>
      {auth.isPreview && <div className="reports-demo-note">Riwayat berikut hanya data simulasi untuk pratinjau aplikasi.</div>}
      {error && <div className="reports-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}
      <div className="audit-list">{items.map((item, index) => <article className="audit-row" key={`${index}-${item.date}`}><span className="audit-icon"><History size={16} /></span><div className="audit-main"><div className="audit-topline"><strong>{item.title}</strong><time>{item.date}</time></div><p className="audit-changes">{item.changes}</p><small>Diubah oleh {item.person}</small></div></article>)}{items.length === 0 && <div className="audit-empty">{loading ? 'Memuat riwayat…' : 'Belum ada perubahan yang tercatat.'}</div>}</div>
      <p className="audit-retention">Riwayat tidak menyediakan kolom alasan dan tidak menghapus nilai sebelumnya.</p>
    </section>
  )
}

export default AuditPage
