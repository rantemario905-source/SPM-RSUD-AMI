import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CircleAlert, Search, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadUnits, periodLabel, type SpmIndicator, type SpmPeriod, type SpmUnit } from '../../lib/spm-data'
import { achievement, formatAchievement, meetsStandard, parseTarget } from '../../lib/spm-achievement'
import './CrossUnitPage.css'

interface CrossEntry { numerator: number | null; denominator: number | null; analysis: string }
interface RawEntry extends CrossEntry { report_id: string; indicator_id: string }
interface RawReport { id: string; unit_id: string }
interface UnitSummary { unit: SpmUnit; total: number; completed: number; completion: number; met: number; metPercent: number; status: UnitStatus }
type UnitStatus = 'baik' | 'cukup' | 'perhatian' | 'kosong'
type CellTone = 'good' | 'bad' | 'empty' | 'na'

const statusLabel: Record<UnitStatus, string> = { baik: 'Baik', cukup: 'Cukup', perhatian: 'Perlu perhatian', kosong: 'Belum diisi' }
const statusRank: Record<UnitStatus, number> = { kosong: 0, perhatian: 1, cukup: 2, baik: 3 }
const previewPeriod: SpmPeriod = { period_start: '2026-10-01', period_end: '2026-10-31', state: 'open' }

function buildPreview() {
  const units: SpmUnit[] = sampleUnits.map((unit) => ({ id: unit.id, code: unit.id.toUpperCase(), name: unit.name }))
  const indicators: SpmIndicator[] = []
  const reports: RawReport[] = []
  const entries: RawEntry[] = []
  for (const unit of sampleUnits) {
    const reportId = `report-${unit.id}`
    reports.push({ id: reportId, unit_id: unit.id })
    const items: IndicatorEntry[] = unit.indicators
    for (const item of items) {
      const calculation: SpmIndicator['calculation_method'] = item.calculation ?? (item.type === 'duration' ? 'average' : item.type === 'category' ? 'numerator' : item.scale ? 'scaled' : 'percentage')
      const indicatorId = `${unit.id}-${item.code}`
      indicators.push({
        id: indicatorId, code: item.code, service_name: unit.name, name: item.name,
        operational_definition: item.definition, standard: item.standard, calculation_method: calculation,
        unit_label: item.unit, calculation_scale: item.scale ?? null, result_unit: item.resultUnit ?? '%',
        unit_id: unit.id, effective_from: '2026-01-01', effective_until: null, active: true,
      })
      entries.push({
        report_id: reportId, indicator_id: indicatorId,
        numerator: item.numerator === '' ? null : Number(item.numerator),
        denominator: item.denominator === '' ? null : Number(item.denominator),
        analysis: item.analysis,
      })
    }
  }
  return { units, indicators, reports, entries }
}

function unitStatus(total: number, completed: number, met: number): UnitStatus {
  if (!total || completed === 0) return 'kosong'
  const completion = completed / total
  if (completion >= 1 && met >= total) return 'baik'
  if (completion >= 0.8) return 'cukup'
  return 'perhatian'
}

function CrossUnitPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const previewData = useMemo(() => (auth.isPreview ? buildPreview() : null), [auth.isPreview])
  const [units, setUnits] = useState<SpmUnit[]>(() => previewData?.units ?? [])
  const [periods, setPeriods] = useState<SpmPeriod[]>(() => (auth.isPreview ? [previewPeriod] : []))
  const [indicators, setIndicators] = useState<SpmIndicator[]>(() => previewData?.indicators ?? [])
  const [reports, setReports] = useState<RawReport[]>(() => previewData?.reports ?? [])
  const [entries, setEntries] = useState<RawEntry[]>(() => previewData?.entries ?? [])
  const [periodStart, setPeriodStart] = useState(() => (auth.isPreview ? previewPeriod.period_start : ''))
  const [unitFilter, setUnitFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!auth.isPreview)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client || auth.isPreview || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadPeriods(client), loadIndicators(client)])
      .then(([nextUnits, nextPeriods, nextIndicators]) => {
        if (!active) return
        setUnits(nextUnits)
        setPeriods(nextPeriods)
        setIndicators(nextIndicators)
        const now = new Date()
        const running = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        setPeriodStart((current) => current || nextPeriods.find((period) => period.period_start === running)?.period_start || nextPeriods[0]?.period_start || '')
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Data lintas unit gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId])

  useEffect(() => {
    if (!client || auth.isPreview || !periodStart) return
    const supabase = client
    let active = true
    async function loadReportData() {
      const { data: reportData, error: reportError } = await supabase.from('reports').select('id, unit_id').eq('period_start', periodStart)
      if (reportError) throw reportError
      const nextReports = reportData ?? []
      let nextEntries: RawEntry[] = []
      if (nextReports.length) {
        const { data, error: entryError } = await supabase.from('report_entries').select('report_id, indicator_id, numerator, denominator, analysis').in('report_id', nextReports.map((report) => report.id))
        if (entryError) throw entryError
        nextEntries = data ?? []
      }
      if (active) { setError(''); setReports(nextReports); setEntries(nextEntries) }
    }
    void loadReportData().catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Data capaian gagal dimuat.') })
    return () => { active = false }
  }, [client, auth.isPreview, periodStart])

  const activeIndicators = useMemo(() => indicators.filter((indicator) => indicator.active), [indicators])
  const unitByReport = useMemo(() => new Map(reports.map((report) => [report.id, report.unit_id])), [reports])
  const entryMap = useMemo(() => {
    const map = new Map<string, CrossEntry>()
    for (const entry of entries) {
      const unitId = unitByReport.get(entry.report_id)
      if (unitId) map.set(`${unitId}|${entry.indicator_id}`, entry)
    }
    return map
  }, [entries, unitByReport])

  const visibleUnits = useMemo(() => (unitFilter === 'all' ? units : units.filter((unit) => unit.id === unitFilter)), [units, unitFilter])

  const summary = useMemo(() => visibleUnits.map((unit): UnitSummary => {
    const unitIndicators = activeIndicators.filter((indicator) => indicator.unit_id === null || indicator.unit_id === unit.id)
    let completed = 0
    let met = 0
    for (const indicator of unitIndicators) {
      const entry = entryMap.get(`${unit.id}|${indicator.id}`)
      if (!entry) continue
      if (entry.numerator !== null && entry.denominator !== null && entry.analysis.trim() !== '') completed += 1
      const value = achievement(entry, indicator)
      const target = parseTarget(indicator.standard)
      if (value !== null && target && meetsStandard(value, target)) met += 1
    }
    const total = unitIndicators.length
    return {
      unit, total, completed,
      completion: total ? Math.round((completed / total) * 100) : 0,
      met, metPercent: total ? Math.round((met / total) * 100) : 0,
      status: unitStatus(total, completed, met),
    }
  }).sort((left, right) => statusRank[left.status] - statusRank[right.status] || left.completion - right.completion), [visibleUnits, activeIndicators, entryMap])

  const matrixRows = useMemo(() => activeIndicators.filter((indicator) => `${indicator.name} ${indicator.code} ${indicator.service_name}`.toLowerCase().includes(query.toLowerCase())), [activeIndicators, query])

  const detailUnit = selectedUnitId ? units.find((unit) => unit.id === selectedUnitId) ?? null : null
  const detailRows = useMemo(() => {
    if (!detailUnit) return []
    return activeIndicators
      .filter((indicator) => indicator.unit_id === null || indicator.unit_id === detailUnit.id)
      .map((indicator) => {
        const entry = entryMap.get(`${detailUnit.id}|${indicator.id}`) ?? null
        const value = entry ? achievement(entry, indicator) : null
        const target = parseTarget(indicator.standard)
        const met = value !== null && target ? meetsStandard(value, target) : null
        return { indicator, entry, value, met }
      })
  }, [detailUnit, activeIndicators, entryMap])

  function cellFor(indicator: SpmIndicator, unitId: string): { text: string; tone: CellTone } {
    if (indicator.unit_id !== null && indicator.unit_id !== unitId) return { text: '–', tone: 'na' }
    const entry = entryMap.get(`${unitId}|${indicator.id}`)
    if (!entry) return { text: '–', tone: 'empty' }
    const value = achievement(entry, indicator)
    if (value === null) return { text: '–', tone: 'empty' }
    const target = parseTarget(indicator.standard)
    const tone: CellTone = target ? (meetsStandard(value, target) ? 'good' : 'bad') : 'empty'
    return { text: formatAchievement(value, indicator), tone }
  }

  const periodName = periodStart ? periodLabel(periodStart) : 'Belum ada periode'

  return (
    <section className="cross-page">
      <div className="cross-heading">
        <div><span className="eyebrow">PERBANDINGAN UNIT</span><h1>Rekap lintas unit</h1><p>Bandingkan kelengkapan dan capaian indikator antar unit pada satu bulan.</p></div>
      </div>
      {auth.isPreview && <div className="cross-note"><CircleAlert size={15} /> Data simulasi untuk pratinjau; bukan data laporan resmi.</div>}
      {error && <div className="cross-note" role="alert"><CircleAlert size={15} /> {error}</div>}

      <div className="cross-filters">
        <label className="cross-filter"><span>PERIODE</span><select value={periodStart} onChange={(event) => { setSelectedUnitId(null); setPeriodStart(event.target.value) }} aria-label="Pilih periode">{(periods.length ? periods : [previewPeriod]).map((period) => <option key={period.period_start} value={period.period_start}>{periodLabel(period.period_start)}</option>)}</select></label>
        <label className="cross-filter"><span>UNIT</span><select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} aria-label="Filter unit"><option value="all">Semua unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        <label className="cross-search"><span className="sr-only">Cari indikator</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari indikator" /></label>
      </div>

      <section className="cross-section">
        <div className="cross-section-head"><h2>Ringkasan per unit</h2><span>{periodName} · {summary.length} unit</span></div>
        <div className="cross-table-wrap">
          <table className="cross-summary-table">
            <thead><tr><th>UNIT</th><th>INDIKATOR</th><th>TERISI</th><th>KELENGKAPAN</th><th>MEMENUHI STANDAR</th><th>STATUS</th></tr></thead>
            <tbody>{summary.map((row) => (
              <tr key={row.unit.id} className={selectedUnitId === row.unit.id ? 'is-selected' : ''} onClick={() => setSelectedUnitId((current) => current === row.unit.id ? null : row.unit.id)}>
                <td><strong>{row.unit.name}</strong></td>
                <td>{row.total}</td>
                <td>{row.completed}<small>/{row.total}</small></td>
                <td><div className="cross-progress"><span><i style={{ width: `${row.completion}%` }} /></span><small>{row.completion}%</small></div></td>
                <td>{row.met}<small>/{row.total} ({row.metPercent}%)</small></td>
                <td><span className={`cross-status status-${row.status}`}>{statusLabel[row.status]}</span></td>
              </tr>
            ))}</tbody>
          </table>
          {!summary.length && <div className="cross-empty">{loading ? 'Memuat data…' : 'Belum ada unit.'}</div>}
        </div>
      </section>

      <section className="cross-section">
        <div className="cross-section-head"><h2>Matriks indikator × unit</h2><span>{matrixRows.length} indikator · {visibleUnits.length} unit</span></div>
        <div className="cross-table-wrap">
          <table className="cross-matrix-table">
            <thead><tr><th className="cross-indicator-col">INDIKATOR</th><th>STANDAR</th>{visibleUnits.map((unit) => <th key={unit.id}>{unit.name}</th>)}</tr></thead>
            <tbody>{matrixRows.map((indicator) => (
              <tr key={indicator.id}>
                <td className="cross-indicator-cell"><strong>{indicator.name}</strong><small>{indicator.service_name}</small></td>
                <td className="cross-standard-cell">{indicator.standard}</td>
                {visibleUnits.map((unit) => { const cell = cellFor(indicator, unit.id); return <td key={unit.id} className={`cross-cell tone-${cell.tone}`}>{cell.text}</td> })}
              </tr>
            ))}</tbody>
          </table>
          {!matrixRows.length && <div className="cross-empty">{loading ? 'Memuat data…' : 'Belum ada indikator atau hasil yang cocok.'}</div>}
        </div>
      </section>

      {detailUnit && (
        <section className="cross-section">
          <div className="cross-section-head"><h2>Detail unit · {detailUnit.name}</h2><button className="cross-close" type="button" onClick={() => setSelectedUnitId(null)}><X size={14} /> Tutup</button></div>
          <div className="cross-table-wrap">
            <table className="cross-detail-table">
              <thead><tr><th>INDIKATOR</th><th>STANDAR</th><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>STATUS</th><th>ANALISA</th></tr></thead>
              <tbody>{detailRows.map(({ indicator, entry, value, met }) => (
                <tr key={indicator.id}>
                  <td className="cross-indicator-cell"><strong>{indicator.name}</strong><small>{indicator.code}</small></td>
                  <td className="cross-standard-cell">{indicator.standard}</td>
                  <td>{entry?.numerator ?? '—'}</td>
                  <td>{entry?.denominator ?? '—'}</td>
                  <td>{value === null ? '—' : formatAchievement(value, indicator)}</td>
                  <td>{met === null ? '—' : <span className={`cross-status status-${met ? 'baik' : 'perhatian'}`}>{met ? 'Memenuhi' : 'Di bawah standar'}</span>}</td>
                  <td className="cross-analysis-cell">{entry?.analysis || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
            {!detailRows.length && <div className="cross-empty">Belum ada indikator untuk unit ini.</div>}
          </div>
        </section>
      )}

      <div className="cross-footnote"><CalendarDays size={14} /> Klik baris pada ringkasan untuk melihat detail per unit. Sel matriks: <b>hijau</b> memenuhi standar, <b>merah</b> di bawah standar, <b>–</b> belum ada data atau tidak berlaku.</div>
    </section>
  )
}

export default CrossUnitPage
