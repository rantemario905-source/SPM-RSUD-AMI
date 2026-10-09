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
  const [canManagePeriods, setCanManagePeriods] = useState(auth.isPreview)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client) return
    let active = true
    Promise.all([
      loadPeriods(client),
      client.from('profiles').select('role, permissions').eq('id', auth.userId).maybeSingle(),
    ])
      .then(([data, selfResult]) => {
        if (!active) return
        setPeriods(data)
        const self = selfResult.data as { role: string; permissions: Record<string, boolean> } | null
        setCanManagePeriods(self?.role === 'admin' || Boolean(self?.permissions?.manage_periods))
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Periode gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.userId])

  async function togglePeriod(period: SpmPeriod) {
    if (!canManagePeriods) return
    const state = period.state === 'open' ? 'locked' : 'open'
    setSaving(period.period_start)
    setError('')
    if (client) {
      const { error: updateError } = await client.from('report_periods')
        .update({ state, manually_opened: state === 'open', updated_by: auth.userId })
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
      <div className="reports-heading"><div><span className="eyebrow">PENGATURAN DATA</span><h1>Periode pelaporan</h1><p>Bulan yang sudah lewat otomatis terkunci. Hanya pengelola periode yang dapat membukanya kembali untuk input atau koreksi.</p></div></div>
      {auth.isPreview && <div className="reports-demo-note">Perubahan periode hanya disimpan di pratinjau.</div>}
      {error && <div className="reports-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}
      <div className="periods-toolbar"><CalendarClock size={17} /><strong>Penguncian periode bulanan</strong><span>Sistem mengunci bulan yang telah berakhir; pengelola dapat membuka kembali bila perlu.</span></div>
      <div className="period-list">{periods.map((period) => {
        const locked = period.state === 'locked'
        const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
        return <article className="period-row" key={period.period_start}><span className={`period-icon${locked ? ' locked' : ''}`}>{locked ? <LockKeyhole size={17} /> : <LockKeyholeOpen size={17} />}</span><div className="period-name"><strong>{periodLabel(period.period_start)}</strong><small>{formatDate(period.period_start)} – {formatDate(period.period_end)}</small></div><span className={`period-badge${locked ? ' locked' : ''}`}>{locked ? 'Terkunci' : 'Terbuka'}</span>{canManagePeriods && <button className="period-action" type="button" disabled={saving === period.period_start || loading} onClick={() => void togglePeriod(period)}>{saving === period.period_start ? 'Menyimpan…' : locked ? 'Buka' : 'Kunci'}</button>}</article>
      })}{periods.length === 0 && <div className="period-empty">{loading ? 'Memuat periode…' : 'Belum ada periode tersedia.'}</div>}</div>
      <div className="periods-note"><LockKeyhole size={15} /><span>Jejak perubahan tetap mencatat pengguna, waktu, dan nilai sebelum/sesudah. Alasan perubahan tidak diminta.</span></div>
    </section>
  )
}

export default PeriodsPage