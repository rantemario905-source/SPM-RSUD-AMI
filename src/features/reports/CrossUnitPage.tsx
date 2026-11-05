import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CircleAlert, Search, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadUnits, periodLabel, type SpmIndicator, type SpmPeriod, type SpmUnit } from '../../lib/spm-data'
import { achievement, entryHasValue, formatAchievement, indicatorResult, meetsStandard, parseTarget, type IndicatorResultTone } from '../../lib/spm-achievement'
import './CrossUnitPage.css'

interface CrossEntry { numerator: number | null; denominator: number | null; result_text: string | null; analysis: string }
interface RawEntry extends CrossEntry { report_id: string; indicator_id: string }
interface RawReport { id: string; unit_id: string }
interface UnitSummary { unit: SpmUnit; total: number; completed: number; completion: number; comparable: number; met: number; metPercent: number; status: UnitStatus }
interface ListRow { unit: SpmUnit; indicator: SpmIndicator; value: string | null; badge: string; tone: IndicatorResultTone }
type UnitStatus = 'baik' | 'cukup' | 'perhatian' | 'kosong'

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
        helper_kind: null,
        helper_min_sample: null,
        unit_label: item.unit, calculation_scale: item.scale ?? null, result_unit: item.resultUnit ?? '%',
        unit_id: unit.id, effective_from: '2026-01-01', effective_until: null, active: true,
      })
      entries.push({
        report_id: reportId, indicator_id: indicatorId,
        numerator: item.numerator === '' ? null : Number(item.numerator),
        denominator: item.denominator === '' ? null : Number(item.denominator),
        result_text: item.resultText?.trim() || null,
        analysis: item.analysis,
      })
    }
  }
  return { units, indicators, reports, entries }
}

function unitStatus(total: number, completed: number, comparable: number, met: number): UnitStatus {
  if (!total || completed === 0) return 'kosong'
  const completion = completed / total
  if (completion >= 1 && (comparable === 0 || met >= comparable)) return 'baik'
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
  const [loading, setLoading] = useState(!auth.isPreview)
  const [error, setError] = useState('')
  const detailRef = useRef<HTMLElement | null>(null)

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
        const { data, error: entryError } = await supabase.from('report_entries').select('report_id, indicator_id, numerator, denominator, result_text, analysis').in('report_id', nextReports.map((report) => report.id))
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
  const detailUnit = unitFilter === 'all' ? null : units.find((unit) => unit.id === unitFilter) ?? null

  useEffect(() => {
    if (detailUnit) detailRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [detailUnit])

  const summary = useMemo(() => visibleUnits.map((unit): UnitSummary => {
    const unitIndicators = activeIndicators.filter((indicator) => indicator.unit_id === null || indicator.unit_id === unit.id)
    let completed = 0
    let comparable = 0
    let met = 0
    for (const indicator of unitIndicators) {
      const entry = entryMap.get(`${unit.id}|${indicator.id}`)
      if (!entry) continue
      if (entryHasValue(entry, indicator)) completed += 1
      if (indicator.calculation_method === 'free_text') continue
      const value = achievement(entry, indicator)
      const target = parseTarget(indicator.standard)
      if (!target) continue
      comparable += 1
      if (value !== null && meetsStandard(value, target)) met += 1
    }
    const total = unitIndicators.length
    return {
      unit, total, completed,
      completion: total ? Math.round((completed / total) * 100) : 0,
      comparable, met, metPercent: comparable ? Math.round((met / comparable) * 100) : 0,
      status: unitStatus(total, completed, comparable, met),
    }
  }).sort((left, right) => statusRank[left.status] - statusRank[right.status] || left.completion - right.completion), [visibleUnits, activeIndicators, entryMap])

  const listRows = useMemo(() => {
    if (unitFilter !== 'all') return []
    const search = query.trim().toLowerCase()
    const rows: ListRow[] = []
    for (const unit of units) {
      for (const indicator of activeIndicators) {
        if (indicator.unit_id !== null && indicator.unit_id !== unit.id) continue
        if (search && !`${indicator.name} ${indicator.code} ${unit.name}`.toLowerCase().includes(search)) continue
        const result = indicatorResult(indicator, entryMap.get(`${unit.id}|${indicator.id}`) ?? null)
        rows.push({ unit, indicator, ...result })
      }
    }
    return rows.sort((left, right) => left.unit.name.localeCompare(right.unit.name, 'id') || left.indicator.code.localeCompare(right.indicator.code, 'id'))
  }, [unitFilter, units, activeIndicators, entryMap, query])

  const detailRows = useMemo(() => {
    if (!detailUnit) return []
    const search = query.trim().toLowerCase()
    return activeIndicators
      .filter((indicator) => indicator.unit_id === null || indicator.unit_id === detailUnit.id)
      .filter((indicator) => !search || `${indicator.name} ${indicator.code} ${indicator.service_name}`.toLowerCase().includes(search))
      .map((indicator) => {
        const entry = entryMap.get(`${detailUnit.id}|${indicator.id}`) ?? null
        const freeText = indicator.calculation_method === 'free_text'
        const text = freeText ? entry?.result_text?.trim() || null : null
        const numeric = !freeText && entry ? achievement(entry, indicator) : null
        const target = freeText ? null : parseTarget(indicator.standard)
        const met = numeric !== null && target ? meetsStandard(numeric, target) : null
        const value = freeText ? text : numeric === null ? null : formatAchievement(numeric, indicator)
        return { indicator, entry, value, met, freeText }
      })
  }, [detailUnit, activeIndicators, entryMap, query])

  const periodName = periodStart ? periodLabel(periodStart) : 'Belum ada periode'

  return (
    <section className="cross-page">
      <div className="cross-heading">
        <div><span className="eyebrow">PERBANDINGAN UNIT</span><h1>Rekap lintas unit</h1><p>Bandingkan kelengkapan dan capaian indikator antar unit pada satu bulan.</p></div>
      </div>
      {auth.isPreview && <div className="cross-note"><CircleAlert size={15} /> Data simulasi untuk pratinjau; bukan data laporan resmi.</div>}
      {error && <div className="cross-note" role="alert"><CircleAlert size={15} /> {error}</div>}

      <div className="cross-filters">
        <label className="cross-filter"><span>PERIODE</span><select value={periodStart} onChange={(event) => { setUnitFilter('all'); setPeriodStart(event.target.value) }} aria-label="Pilih periode">{(periods.length ? periods : [previewPeriod]).map((period) => <option key={period.period_start} value={period.period_start}>{periodLabel(period.period_start)}</option>)}</select></label>
        <label className="cross-filter"><span>UNIT</span><select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} aria-label="Filter unit"><option value="all">Semua unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        <label className="cross-search"><span className="sr-only">Cari indikator atau unit</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari indikator atau unit" /></label>
      </div>

      <section className="cross-section">
        <div className="cross-section-head"><h2>Ringkasan per unit</h2><span>{periodName} · {summary.length} unit</span></div>
        <div className="cross-table-wrap">
          <table className="cross-summary-table">
            <thead><tr><th>UNIT</th><th>INDIKATOR</th><th>TERISI</th><th>KELENGKAPAN</th><th>MEMENUHI STANDAR</th><th>STATUS</th></tr></thead>
            <tbody>{summary.map((row) => (
              <tr key={row.unit.id} className={unitFilter === row.unit.id ? 'is-selected' : ''} onClick={() => setUnitFilter((current) => current === row.unit.id ? 'all' : row.unit.id)}>
                <td><strong>{row.unit.name}</strong></td>
                <td>{row.total}</td>
                <td>{row.completed}<small>/{row.total}</small></td>
                <td><div className="cross-progress"><span><i style={{ width: `${row.completion}%` }} /></span><small>{row.completion}%</small></div></td>
                <td>{row.comparable ? <>{row.met}<small>/{row.comparable} ({row.metPercent}%)</small></> : '—'}</td>
                <td><span className={`cross-status status-${row.status}`}>{statusLabel[row.status]}</span></td>
              </tr>
            ))}</tbody>
          </table>
          {!summary.length && <div className="cross-empty">{loading ? 'Memuat data…' : 'Belum ada unit.'}</div>}
        </div>
      </section>

      {unitFilter === 'all' && (
        <section className="cross-section">
          <div className="cross-section-head"><h2>Indikator per unit</h2><span>{listRows.length} indikator · {visibleUnits.length} unit</span></div>
          <div className="cross-table-wrap">
            <table className="cross-list-table">
              <thead><tr><th className="cross-indicator-col">INDIKATOR</th><th>UNIT</th><th>STANDAR</th><th>CAPAIAN</th><th>STATUS</th></tr></thead>
              <tbody>{listRows.map((row) => (
                <tr key={`${row.unit.id}|${row.indicator.id}`}>
                  <td className="cross-indicator-cell"><strong>{row.indicator.name}</strong><small>{row.indicator.code}</small></td>
                  <td className="cross-unit-cell">{row.unit.name}</td>
                  <td className="cross-standard-cell">{row.indicator.standard}</td>
                  <td className="cross-value-cell">{row.value ?? '—'}</td>
                  <td><span className={`cross-status status-${row.tone}`}>{row.badge}</span></td>
                </tr>
              ))}</tbody>
            </table>
            {!listRows.length && <div className="cross-empty">{loading ? 'Memuat data…' : query ? 'Tidak ada indikator atau unit yang cocok.' : 'Belum ada indikator aktif.'}</div>}
          </div>
        </section>
      )}

      {detailUnit && (
        <section className="cross-section" ref={detailRef}>
          <div className="cross-section-head"><h2>Detail unit · {detailUnit.name}</h2><button className="cross-close" type="button" onClick={() => setUnitFilter('all')}><X size={14} /> Tutup</button></div>
          <div className="cross-table-wrap">
            <table className="cross-detail-table">
              <thead><tr><th>INDIKATOR</th><th>STANDAR</th><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>STATUS</th><th>ANALISA</th></tr></thead>
              <tbody>{detailRows.map(({ indicator, entry, value, met, freeText }) => (
                <tr key={indicator.id}>
                  <td className="cross-indicator-cell"><strong>{indicator.name}</strong><small>{indicator.code}</small></td>
                  <td className="cross-standard-cell">{indicator.standard}</td>
                  <td>{entry?.numerator ?? '—'}</td>
                  <td>{entry?.denominator ?? '—'}</td>
                  <td>{value ?? '—'}</td>
                  <td>{freeText ? (value ? <span className="cross-status status-netral">Tercatat</span> : '—') : met === null ? '—' : <span className={`cross-status status-${met ? 'baik' : 'perhatian'}`}>{met ? 'Memenuhi' : 'Di bawah standar'}</span>}</td>
                  <td className="cross-analysis-cell">{entry?.analysis || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
            {!detailRows.length && <div className="cross-empty">{loading ? 'Memuat data…' : query ? 'Tidak ada indikator yang cocok.' : 'Belum ada indikator untuk unit ini.'}</div>}
          </div>
        </section>
      )}

      <div className="cross-footnote"><CalendarDays size={14} /> <span>Klik baris pada ringkasan untuk membuka detail unit. Mode <b>Semua unit</b> menampilkan setiap indikator pada unit pemiliknya; status <b>Memenuhi</b>, <b>Di bawah standar</b>, <b>Tercatat</b> untuk capaian teks, atau <b>Belum diisi</b>.</span></div>
    </section>
  )
}

export default CrossUnitPage
