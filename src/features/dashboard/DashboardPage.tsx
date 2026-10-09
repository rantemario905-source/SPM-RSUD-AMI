import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Check, CircleAlert, FileDown, History, LockKeyhole, Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { demoReports, serviceProgress } from '../../data/demo'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadProfile, loadUnits, periodLabel, type SpmPeriod, type SpmUnit } from '../../lib/spm-data'
import type { AppPage, ReportStatus } from '../../types/spm'
import './DashboardPage.css'

interface DashboardPageProps { onNavigate: (page: AppPage) => void }
const statusClass: Record<ReportStatus, string> = { 'Belum diisi': 'status-empty', 'Sudah dicatat': 'status-saved', 'Periode terkunci': 'status-locked' }
const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toLocaleUpperCase('id-ID')

const previewPeriods: SpmPeriod[] = [
  { period_start: '2026-10-01', period_end: '2026-10-31', state: 'open' },
  { period_start: '2026-09-01', period_end: '2026-09-30', state: 'locked' },
  { period_start: '2026-08-01', period_end: '2026-08-31', state: 'locked' },
]

interface DashboardRow {
  id: string
  unit: string
  period: string
  completion: number
  status: ReportStatus
  updatedAt: string
  changedBy: string
  completedIndicators?: number
  totalIndicators?: number
}

function DashboardPage({ onNavigate }: DashboardPageProps) {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [periods, setPeriods] = useState<SpmPeriod[]>(auth.isPreview ? previewPeriods : [])
  const [periodStart, setPeriodStart] = useState(() => {
    if (auth.isPreview) return '2026-09-01'
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [units, setUnits] = useState<SpmUnit[]>([])
  const [rows, setRows] = useState<DashboardRow[]>(auth.isPreview ? demoReports : [])
  const [progress, setProgress] = useState(auth.isPreview ? serviceProgress : [])
  const [totals, setTotals] = useState(auth.isPreview ? { recorded: 28, total: 36, completion: 84 } : { recorded: 0, total: 0, completion: 0 })
  const [loading, setLoading] = useState(!auth.isPreview)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client || auth.isPreview || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadPeriods(client), loadProfile(client, auth.userId)])
      .then(([allUnits, nextPeriods, profile]) => {
        if (!active) return
        const scopedUnits = profile.unit_id ? allUnits.filter((unit) => unit.id === profile.unit_id) : allUnits
        setUnits(scopedUnits)
        setPeriods(nextPeriods)
        setPeriodStart((current) => nextPeriods.some((item) => item.period_start === current) ? current : nextPeriods[0]?.period_start ?? '')
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Dashboard gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId])

  useEffect(() => {
    if (!client || auth.isPreview || !periodStart || !units.length) return
    const supabase = client
    let active = true
    async function loadDashboardData() {
      const [indicators, reportResult] = await Promise.all([
        loadIndicators(supabase),
        supabase.from('reports').select('id, unit_id, updated_at').eq('period_start', periodStart).in('unit_id', units.map((unit) => unit.id)),
      ])
      if (reportResult.error) throw reportResult.error
      const reports = reportResult.data ?? []
      let entries: { report_id: string; numerator: number | null; denominator: number | null; analysis: string; updated_at: string }[] = []
      if (reports.length) {
        const { data, error: entryError } = await supabase.from('report_entries')
          .select('report_id, numerator, denominator, analysis, updated_at')
          .in('report_id', reports.map((report) => report.id))
        if (entryError) throw entryError
        entries = data ?? []
      }
      const reportByUnit = new Map(reports.map((report) => [report.unit_id, report]))
      const entryByReport = new Map<string, typeof entries>()
      for (const entry of entries) entryByReport.set(entry.report_id, [...(entryByReport.get(entry.report_id) ?? []), entry])
      const selectedPeriod = periods.find((item) => item.period_start === periodStart)
      const nextRows = units.map((unit): DashboardRow => {
        const report = reportByUnit.get(unit.id)
        const reportEntries = report ? entryByReport.get(report.id) ?? [] : []
        const unitIndicators = indicators.filter((indicator) => indicator.active && (indicator.unit_id === null || indicator.unit_id === unit.id))
        const completed = reportEntries.filter((entry) => entry.numerator !== null && entry.denominator !== null && entry.analysis.trim()).length
        const completion = unitIndicators.length ? Math.min(100, Math.round(completed / unitIndicators.length * 100)) : 0
        const latest = reportEntries.reduce((date, entry) => entry.updated_at > date ? entry.updated_at : date, report?.updated_at ?? '')
        return {
          id: report?.id ?? unit.id,
          unit: unit.name,
          period: periodLabel(periodStart),
          completion,
          status: selectedPeriod?.state === 'locked' ? 'Periode terkunci' : reportEntries.length ? 'Sudah dicatat' : 'Belum diisi',
          updatedAt: latest ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(latest)) : 'Belum ada input',
          changedBy: reportEntries.length ? 'Pengguna unit' : '-',
          completedIndicators: completed,
          totalIndicators: unitIndicators.length,
        }
      })
      const expected = nextRows.reduce((sum, row) => sum + (row.totalIndicators ?? 0), 0)
      const recorded = nextRows.reduce((sum, row) => sum + (row.completedIndicators ?? 0), 0)
      const progressRows = nextRows.map((row) => ({ name: row.unit, done: row.completedIndicators ?? 0, total: row.totalIndicators ?? 0, color: row.completion >= 80 ? 'green' : row.completion >= 40 ? 'blue' : 'amber' }))
      if (active) {
        setError('')
        setRows(nextRows.sort((left, right) => right.completion - left.completion))
        setProgress(progressRows)
        setTotals({ recorded, total: expected, completion: expected ? Math.round(recorded / expected * 100) : 0 })
      }
    }
    void loadDashboardData()
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Data dashboard gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, periodStart, periods, units])

  const selectedPeriod = periods.find((item) => item.period_start === periodStart)
  const period = selectedPeriod ? periodLabel(selectedPeriod.period_start) : 'Belum ada periode'

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><span className="eyebrow">{formattedDate}</span><h1>Ringkasan SPM</h1><p>Pantau pengumpulan dan capaian Standar Pelayanan Minimal rumah sakit.</p></div><div className="heading-actions"><label className="period-select"><CalendarDays size={15} /><select aria-label="Pilih periode laporan" value={periodStart} onChange={(event) => { setLoading(true); setPeriodStart(event.target.value) }}>{periods.map((item) => <option key={item.period_start} value={item.period_start}>{periodLabel(item.period_start)}</option>)}</select></label><button className="primary-button" type="button" onClick={() => onNavigate('entry')}><Plus size={16} /> Input laporan</button></div></div>
      {auth.isPreview && <div className="data-notice"><CircleAlert size={16} /><span><strong>Data simulasi.</strong> Angka di halaman ini hanya contoh untuk pratinjau, bukan data resmi RSUD.</span></div>}
      {error && <div className="data-notice" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}
      <section className="metric-grid" aria-label="Ringkasan periode">
        <article className="metric-card"><div className="metric-top"><span>Data sudah dicatat</span><span className="metric-icon green-icon"><FileDown size={16} /></span></div><strong className="metric-value">{loading ? '…' : totals.recorded} <small>/ {totals.total}</small></strong><div className="metric-foot"><span className="metric-subtle">indikator terisi lengkap</span></div></article>
        <article className="metric-card"><div className="metric-top"><span>Kelengkapan input</span><span className="metric-icon green-icon"><Check size={16} /></span></div><strong className="metric-value">{totals.completion}<small>%</small></strong><div className="metric-foot"><span className="metric-subtle">dari indikator aktif</span></div></article>
        <article className="metric-card"><div className="metric-top"><span>Belum lengkap</span><span className="metric-icon coral-icon"><CircleAlert size={16} /></span></div><strong className="metric-value">{Math.max(0, totals.total - totals.recorded)}</strong><div className="metric-foot"><span className="metric-subtle">indikator belum lengkap</span></div></article>
      </section>
      <div className="dashboard-columns">
        <section className="panel progress-panel"><div className="panel-heading"><div><h2>Progres pelaporan unit</h2><p>Indikator terkumpul untuk {period}</p></div><button className="text-button" type="button" onClick={() => onNavigate('reports')}>Semua unit <ArrowRight size={14} /></button></div><div className="progress-list">{progress.map((item) => { const percent = item.total ? Math.round((item.done / item.total) * 100) : 0; return <div className="progress-row" key={item.name}><div className="progress-label"><span>{item.name}</span><strong>{item.done}<small>/{item.total}</small></strong></div><div className="progress-track"><span className={`progress-fill fill-${item.color}`} style={{ width: `${percent}%` }} /></div><span className="progress-percent">{percent}%</span></div> })}{!progress.length && <p className="metric-subtle">{loading ? 'Memuat progres…' : 'Belum ada unit atau indikator aktif.'}</p>}</div><div className="progress-footnote"><span className="legend-dot" /> Data masuk <span className="legend-dot legend-pale" /> Belum masuk</div></section>
        <section className="panel attention-panel"><div className="panel-heading"><div><h2>Perlu perhatian</h2><p>Data dan periode</p></div><span className="attention-total">{rows.filter((row) => row.status === 'Belum diisi').length}</span></div>{rows.filter((row) => row.status === 'Belum diisi').slice(0, 2).map((row) => <div className="attention-item" key={row.id}><span className="attention-mark mark-coral"><CircleAlert size={15} /></span><div><strong>{row.unit} belum mengisi</strong><small>{period} · belum ada input</small></div><button type="button" aria-label={`Buka input ${row.unit}`} onClick={() => onNavigate('entry')}><ArrowRight size={15} /></button></div>)}<div className="attention-item"><span className="attention-mark mark-amber"><LockKeyhole size={15} /></span><div><strong>{selectedPeriod?.state === 'locked' ? `${period} terkunci` : 'Periode sedang terbuka'}</strong><small>{selectedPeriod?.state === 'locked' ? 'Data hanya bisa dikoreksi sesuai izin.' : 'Unit dapat mengisi data periode ini.'}</small></div><button type="button" aria-label="Buka pengaturan periode" onClick={() => onNavigate('periods')}><ArrowRight size={15} /></button></div><div className="attention-item"><span className="attention-mark mark-blue"><History size={15} /></span><div><strong>Jejak perubahan</strong><small>Audit data laporan</small></div><button type="button" aria-label="Lihat jejak perubahan" onClick={() => onNavigate('audit')}><ArrowRight size={15} /></button></div></section>
      </div>
      <section className="panel recent-panel"><div className="panel-heading"><div><h2>Data terbaru</h2><p>Input capaian langsung dari unit pelayanan</p></div><button className="text-button" type="button" onClick={() => onNavigate('reports')}>Lihat rekap <ArrowRight size={14} /></button></div><div className="table-wrap"><table className="report-table"><thead><tr><th>UNIT / INSTALASI</th><th>PERIODE</th><th>KELENGKAPAN</th><th>KONDISI</th><th>TERAKHIR DIUBAH</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{rows.slice(0, 8).map((report) => <tr key={report.id}><td><strong>{report.unit}</strong><small>{report.id.slice(0, 8)}</small></td><td>{report.period}</td><td><div className="table-progress"><span><i style={{ width: `${report.completion}%` }} /></span><small>{report.completion}%</small></div></td><td><span className={`status-badge ${statusClass[report.status]}`}>{report.status}</span></td><td className="updated-cell">{report.updatedAt}<small className="changed-by">{report.changedBy}</small></td><td><button className="row-action" type="button" aria-label={`Buka data ${report.unit}`} onClick={() => onNavigate(report.status === 'Belum diisi' ? 'entry' : 'audit')}><ArrowRight size={15} /></button></td></tr>)}</tbody></table>{!rows.length && <div className="metric-subtle">{loading ? 'Memuat laporan…' : 'Belum ada laporan untuk periode ini.'}</div>}</div></section>
      <div className="quarter-callout"><div className="quarter-icon"><CalendarDays size={18} /></div><div><strong>Rekap periode tersedia</strong><span>Rekap triwulan dan tahunan menggunakan capaian yang tersimpan.</span></div><button type="button" onClick={() => onNavigate('reports')}>Buka rekap <ArrowRight size={14} /></button></div>
    </div>
  )
}

export default DashboardPage