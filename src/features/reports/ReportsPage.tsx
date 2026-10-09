import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, CalendarDays, CircleAlert, Search } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadProfile, loadUnits, type SpmIndicator, type SpmUnit } from '../../lib/spm-data'
import './ReportsPage.css'

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly'

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function getAchievement(entry: IndicatorEntry) {
  const numerator = Number(entry.numerator)
  const denominator = Number(entry.denominator)
  if (entry.numerator === '' || entry.denominator === '' || denominator <= 0) return '—'

  const calculation = entry.calculation ?? (entry.type === 'duration' ? 'average' : entry.type === 'category' ? 'numerator' : entry.scale ? 'scaled' : 'percentage')
  const result = calculation === 'average'
    ? numerator / denominator
    : calculation === 'numerator'
      ? numerator
      : (numerator / denominator) * (calculation === 'scaled' ? entry.scale ?? 1000 : 100)
  const unit = calculation === 'average' || calculation === 'numerator'
    ? entry.unit
    : calculation === 'scaled'
      ? entry.resultUnit ?? 'per 1.000'
      : '%'
  return `${result.toLocaleString('id-ID', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`
}

function getPeriodMonths(period: ReportPeriod, month: number, quarter: number) {
  if (period === 'monthly') return [month]
  if (period === 'quarterly') return [quarter * 3 - 2, quarter * 3 - 1, quarter * 3]
  return months.map((_, index) => index + 1)
}

function ReportsPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const previewUnits: SpmUnit[] = sampleUnits.map(({ id, name }) => ({ id, code: id.toUpperCase(), name }))
  const [query, setQuery] = useState('')
  const [units, setUnits] = useState<SpmUnit[]>(auth.isPreview ? previewUnits : [])
  const [unitId, setUnitId] = useState(auth.isPreview ? previewUnits[0].id : '')
  const [period, setPeriod] = useState<ReportPeriod>('quarterly')
  const [month, setMonth] = useState(10)
  const [quarter, setQuarter] = useState(4)
  const [currentYear] = useState(() => new Date().getFullYear())
  const [years, setYears] = useState<string[]>(auth.isPreview ? [String(currentYear)] : [])
  const [year, setYear] = useState(String(currentYear))
  const [indicators, setIndicators] = useState<SpmIndicator[]>([])
  const [entriesByMonth, setEntriesByMonth] = useState<Record<string, { numerator: number | null; denominator: number | null; analysis: string }>>({})
  const [loading, setLoading] = useState(!auth.isPreview)
  const [error, setError] = useState('')
  const unit = units.find((item) => item.id === unitId) ?? units[0]

  useEffect(() => {
    if (!client || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadProfile(client, auth.userId), loadPeriods(client)])
      .then(([nextUnits, profile, nextPeriods]) => {
        if (!active) return
        setUnits(profile.unit_id ? nextUnits.filter((item) => item.id === profile.unit_id) : nextUnits)
        setUnitId(profile.unit_id ?? nextUnits[0]?.id ?? '')
        const availableYears = Array.from(new Set(nextPeriods.map((item) => item.period_start.slice(0, 4)))).sort((left, right) => right.localeCompare(left))
        setYears(availableYears)
        setYear((current) => {
          if (availableYears.includes(current)) return current
          const thisYear = String(currentYear)
          if (availableYears.includes(thisYear)) return thisYear
          return availableYears[0] ?? thisYear
        })
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Daftar unit gagal dimuat.')
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [client, auth.userId, currentYear])

  useEffect(() => {
    if (!client || auth.isPreview || !unitId) return
    const supabase = client
    let active = true
    async function loadReportData() {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      const [nextIndicators, reportResult] = await Promise.all([
        loadIndicators(supabase, unitId),
        supabase.from('reports').select('id, period_start').eq('unit_id', unitId).gte('period_start', yearStart).lte('period_start', yearEnd),
      ])
      if (reportResult.error) throw reportResult.error
      const reports = reportResult.data ?? []
      let nextEntries: Record<string, { numerator: number | null; denominator: number | null; analysis: string }> = {}
      if (reports.length) {
        const { data, error: entryError } = await supabase.from('report_entries')
          .select('report_id, indicator_id, numerator, denominator, analysis')
          .in('report_id', reports.map((item) => item.id))
        if (entryError) throw entryError
        const periodByReport = new Map(reports.map((item) => [item.id, item.period_start]))
        nextEntries = Object.fromEntries((data ?? []).map((item) => [
          `${periodByReport.get(item.report_id)}|${item.indicator_id}`,
          { numerator: item.numerator, denominator: item.denominator, analysis: item.analysis },
        ]))
      }
      if (active) {
        setError('')
        setIndicators(nextIndicators)
        setEntriesByMonth(nextEntries)
      }
    }
    void loadReportData()
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Rekap gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, unitId, year])

  const periodMonths = getPeriodMonths(period, month, quarter)
  const indicatorEntries = useMemo(() => auth.isPreview
    ? sampleUnits.find((item) => item.id === unitId)?.indicators ?? []
    : indicators.map((indicator): IndicatorEntry => ({
      code: indicator.code, name: indicator.name, definition: indicator.operational_definition,
      standard: indicator.standard,
      type: indicator.calculation_method === 'average' ? 'duration' : indicator.calculation_method === 'numerator' ? 'number' : 'ratio',
      calculation: indicator.calculation_method, unit: indicator.unit_label,
      scale: indicator.calculation_scale ?? undefined, resultUnit: indicator.result_unit,
      numerator: '', denominator: '', value: '', analysis: '',
    })), [auth.isPreview, indicators, unitId])
  const visibleIndicators = useMemo(() => indicatorEntries.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())), [indicatorEntries, query])
  const periodName = period === 'monthly' ? months[month - 1] : period === 'quarterly' ? `Triwulan ${quarter}` : 'Tahunan'

  function getMonthlyValue(entry: IndicatorEntry, monthNumber: number) {
    if (auth.isPreview) return year === '2026' && monthNumber === 10 ? getAchievement(entry) : '—'
    const periodStart = `${year}-${String(monthNumber).padStart(2, '0')}-01`
    const row = entriesByMonth[`${periodStart}|${indicators.find((item) => item.code === entry.code)?.id}`]
    return row ? getAchievement({ ...entry, numerator: row.numerator === null ? '' : String(row.numerator), denominator: row.denominator === null ? '' : String(row.denominator) }) : '—'
  }

  function getStoredEntry(entry: IndicatorEntry, monthNumber: number) {
    if (auth.isPreview) return entry
    const periodStart = `${year}-${String(monthNumber).padStart(2, '0')}-01`
    const id = indicators.find((item) => item.code === entry.code)?.id
    const savedEntry = id ? entriesByMonth[`${periodStart}|${id}`] : undefined
    return savedEntry ? { ...entry, numerator: savedEntry.numerator === null ? '' : String(savedEntry.numerator), denominator: savedEntry.denominator === null ? '' : String(savedEntry.denominator), analysis: savedEntry.analysis } : null
  }

  function csvCell(value: string) {
    return /[",;\\\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }

  function downloadReport() {
    const unitCode = unit?.code ?? 'unit'
    const periodName = period === 'monthly' ? months[month - 1] : period === 'quarterly' ? `Triwulan ${quarter}` : 'Tahunan'
    const lines: string[] = []
    lines.push('RSUD AMI - Rekap & Laporan SPM')
    lines.push(`Unit: ${unit?.name ?? 'Semua unit'} | Periode: ${periodName} ${year} | Diunduh: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}`)
    lines.push('')
    const baseHeaders = ['No', 'Indikator', 'Definisi operasional', 'Standar']
    const periodHeaders = period === 'monthly'
      ? ['Numerator', 'Denominator', 'Capaian', 'Analisa']
      : periodMonths.map((monthNumber) => months[monthNumber - 1])
    lines.push([...baseHeaders, ...periodHeaders].map(csvCell).join(';'))
    for (const [index, entry] of visibleIndicators.entries()) {
      const stored = getStoredEntry(entry, month)
      const row = [String(index + 1), entry.name, entry.definition, entry.standard]
      const periodCells = period === 'monthly'
        ? [
            stored?.numerator ?? '—',
            stored?.denominator ?? '—',
            getMonthlyValue(entry, month),
            stored?.analysis || '—',
          ]
        : periodMonths.map((monthNumber) => getMonthlyValue(entry, monthNumber))
      lines.push([...row, ...periodCells].map(csvCell).join(';'))
    }
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `SPM_${unitCode}_${periodName.replace(/\s+/g, '')}_${year}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <div><span className="eyebrow">DOKUMEN LAPORAN</span><h1>Rekap &amp; unduh</h1><p>Lihat capaian indikator per bulan dalam laporan bulanan, triwulanan, atau tahunan.</p></div>
        <button className="secondary-button" type="button" disabled={loading || visibleIndicators.length === 0} onClick={downloadReport}><ArrowDownToLine size={15} /> Unduh laporan</button>
      </div>
      {auth.isPreview && <div className="reports-demo-note">Data simulasi untuk pratinjau; bukan data laporan resmi.</div>}
      {error && <div className="reports-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}

      <div className="report-filters">
        <label className="report-filter"><span>UNIT / INSTALASI</span><select value={unitId} onChange={(event) => { setLoading(true); setUnitId(event.target.value) }} aria-label="Pilih unit rekap">{units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="report-filter"><span>TAHUN</span><select value={year} onChange={(event) => { setLoading(true); setYear(event.target.value) }} aria-label="Pilih tahun">{(years.length ? years : [String(currentYear)]).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        {period === 'monthly' && <label className="report-filter"><span>BULAN</span><select value={month} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Pilih bulan">{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>}
        {period === 'quarterly' && <label className="report-filter"><span>TRIWULAN</span><select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} aria-label="Pilih triwulan"><option value={1}>Triwulan I · Jan–Mar</option><option value={2}>Triwulan II · Apr–Jun</option><option value={3}>Triwulan III · Jul–Sep</option><option value={4}>Triwulan IV · Okt–Des</option></select></label>}
        <label className="report-search"><span className="sr-only">Cari indikator</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari indikator" /></label>
      </div>

      <div className="period-tabs" role="tablist" aria-label="Jenis periode rekap">
        {([{ id: 'monthly', label: 'Bulanan' }, { id: 'quarterly', label: 'Triwulan' }, { id: 'yearly', label: 'Tahunan' }] as const).map((item) => <button key={item.id} className={`period-tab${period === item.id ? ' is-active' : ''}`} type="button" role="tab" aria-selected={period === item.id} onClick={() => setPeriod(item.id)}><CalendarDays size={14} />{item.label}</button>)}
      </div>

      <div className="report-period-summary"><div><strong>{unit?.name ?? 'Pilih unit'}</strong><span>{periodName} {year} · {visibleIndicators.length} indikator</span></div><span className="report-columns-hint">{period === 'monthly' ? 'Rincian capaian satu bulan' : `${periodMonths.length} bulan ditampilkan terpisah`}</span></div>

      <div className="reports-table-wrap">
        <table className={`reports-table period-report-table${period === 'monthly' ? ' is-monthly' : ''}`}>
          <thead><tr><th>NO</th><th>INDIKATOR / DEFINISI OPERASIONAL</th><th>STANDAR</th>{period === 'monthly' ? <><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>ANALISA</th></> : periodMonths.map((monthNumber) => <th key={monthNumber}>{months[monthNumber - 1]}</th>)}</tr></thead>
          <tbody>{visibleIndicators.map((entry, index) => { const stored = getStoredEntry(entry, month); return <tr key={entry.code}><td>{index + 1}</td><td className="report-indicator-cell"><strong>{entry.name}</strong><small>{entry.definition}</small><span>{entry.code}</span></td><td className="standard-cell">{entry.standard}</td>{period === 'monthly' ? <><td>{stored?.numerator || '—'}</td><td>{stored?.denominator || '—'}</td><td>{getMonthlyValue(entry, month)}</td><td className="report-analysis-cell">{stored?.analysis || '—'}</td></> : periodMonths.map((monthNumber) => <td className={getMonthlyValue(entry, monthNumber) === '—' ? 'no-period-data' : 'period-value'} key={monthNumber}>{getMonthlyValue(entry, monthNumber)}</td>)}</tr>})}</tbody>
        </table>
        {(loading || visibleIndicators.length === 0) && <div className="empty-state">{loading ? 'Memuat rekap…' : 'Belum ada data indikator atau hasil yang cocok.'}</div>}
      </div>

      <div className="report-format-note"><strong>Format rekap:</strong> bulanan memuat numerator, denominator, capaian, dan analisa. Rekap triwulan menampilkan Januari–Maret, April–Juni, Juli–September, atau Oktober–Desember sebagai kolom terpisah. Rekap tahunan menampilkan Januari–Desember.</div>
    </section>
  )
}

export default ReportsPage