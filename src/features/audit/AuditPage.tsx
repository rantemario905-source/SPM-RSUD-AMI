import { useEffect, useState } from 'react'
import { CircleAlert, History } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { demoAudit } from '../../data/demo'
import { getSupabaseClient } from '../../lib/supabase'
import './AuditPage.css'

function AuditPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [items, setItems] = useState(auth.isPreview ? demoAudit : [])
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
      const profileIds = [...new Set((data ?? []).map((row) => row.actor_id).filter((id): id is string => Boolean(id)))]
      let names = new Map<string, string>()
      if (profileIds.length) {
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        if (profileError) throw profileError
        names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]))
      }
      return (data ?? []).map((row) => {
        const oldValues = row.old_values && typeof row.old_values === 'object' ? row.old_values as Record<string, unknown> : {}
        const newValues = row.new_values && typeof row.new_values === 'object' ? row.new_values as Record<string, unknown> : {}
        const field = row.action === 'report_created' ? 'Laporan dibuat' : row.action === 'report_updated' ? 'Laporan diperbarui' : row.action === 'entry_created' ? 'Entri indikator dibuat' : 'Entri indikator diperbarui'
        const format = (values: Record<string, unknown>) => Object.entries(values).map(([key, value]) => `${key}: ${value ?? 'kosong'}`).join(' · ') || 'Belum ada nilai sebelumnya'
        return {
          field,
          before: format(oldValues),
          after: format(newValues),
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
      <div className="audit-list">{items.map((item) => <article className="audit-row" key={`${item.field}-${item.date}`}><span className="audit-icon"><History size={16} /></span><div className="audit-main"><div className="audit-topline"><strong>{item.field}</strong><time>{item.date}</time></div><div className="audit-values"><span>{item.before}</span><b aria-hidden="true">→</b><span>{item.after}</span></div><small>Diubah oleh {item.person}</small></div></article>)}{items.length === 0 && <div className="audit-empty">{loading ? 'Memuat riwayat…' : 'Belum ada perubahan yang tercatat.'}</div>}</div>
      <p className="audit-retention">Riwayat tidak menyediakan kolom alasan dan tidak menghapus nilai sebelumnya.</p>
    </section>
  )
}

export default AuditPage