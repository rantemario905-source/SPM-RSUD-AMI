import { useEffect, useState } from 'react'
import { CalendarClock, CircleAlert, LockKeyhole, LockKeyholeOpen } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { loadPeriods, periodLabel, type SpmPeriod } from '../../lib/spm-data'
import './PeriodsPage.css'

const initialPeriods = [
  { label: 'Oktober 2026', start: '01 Okt 2026', end: '31 Okt 2026', state: 'Terbuka' },
  { label: 'September 2026', start: '01 Sep 2026', end: '30 Sep 2026', state: 'Terkunci' },
  { label: 'Agustus 2026', start: '01 Agu 2026', end: '31 Agu 2026', state: 'Terkunci' },
]

function PeriodsPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [periods, setPeriods] = useState<SpmPeriod[]>(auth.isPreview
    ? initialPeriods.map((period, index) => ({
      period_start: ['2026-10-01', '2026-09-01', '2026-08-01'][index],
      period_end: ['2026-10-31', '2026-09-30', '2026-08-31'][index],
      state: period.state === 'Terbuka' ? 'open' : 'locked',
    }))
    : [])
  const [loading, setLoading] = useState(!auth.isPreview)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client) return
    let active = true
    loadPeriods(client)
      .then((data) => { if (active) setPeriods(data) })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Periode gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client])

  async function togglePeriod(period: SpmPeriod) {
    const state = period.state === 'open' ? 'locked' : 'open'
    setSaving(period.period_start)
    setError('')
    if (client) {
      const { error: updateError } = await client.from('report_periods')
        .update({ state, updated_by: auth.userId })
        .eq('period_start', period.period_start)
      if (updateError) {
        setError(updateError.message)
        setSaving(null)
        return
      }
    }
    setPeriods((current) => current.map((item) => item.period_start === period.period_start ? { ...item, state } : item))
    setSaving(null)
  }

  return (
    <section className="periods-page">
      <div className="reports-heading"><div><span className="eyebrow">PENGATURAN DATA</span><h1>Periode pelaporan</h1><p>Periode terkunci menjadi baca-saja kecuali untuk pengguna yang memiliki akses koreksi khusus.</p></div></div>
      {auth.isPreview && <div className="reports-demo-note">Perubahan periode hanya disimpan di pratinjau.</div>}
      {error && <div className="reports-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}
      <div className="periods-toolbar"><CalendarClock size={17} /><strong>Penguncian periode bulanan</strong><span>Unit dapat mengisi data selama periode terbuka.</span></div>
      <div className="period-list">{periods.map((period) => {
        const locked = period.state === 'locked'
        const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
        return <article className="period-row" key={period.period_start}><span className={`period-icon${locked ? ' locked' : ''}`}>{locked ? <LockKeyhole size={17} /> : <LockKeyholeOpen size={17} />}</span><div className="period-name"><strong>{periodLabel(period.period_start)}</strong><small>{formatDate(period.period_start)} – {formatDate(period.period_end)}</small></div><span className={`period-badge${locked ? ' locked' : ''}`}>{locked ? 'Terkunci' : 'Terbuka'}</span><button className="period-action" type="button" disabled={saving === period.period_start || loading} onClick={() => void togglePeriod(period)}>{saving === period.period_start ? 'Menyimpan…' : locked ? 'Buka' : 'Kunci'}</button></article>
      })}{periods.length === 0 && <div className="period-empty">{loading ? 'Memuat periode…' : 'Belum ada periode tersedia.'}</div>}</div>
      <div className="periods-note"><LockKeyhole size={15} /><span>Jejak perubahan tetap mencatat pengguna, waktu, dan nilai sebelum/sesudah. Alasan perubahan tidak diminta.</span></div>
    </section>
  )
}

export default PeriodsPage