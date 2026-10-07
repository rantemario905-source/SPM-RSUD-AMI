import { useMemo, useState } from 'react'
import { ArrowDownToLine, CalendarDays, Search } from 'lucide-react'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
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
  const [query, setQuery] = useState('')
  const [unitId, setUnitId] = useState(sampleUnits[0].id)
  const [period, setPeriod] = useState<ReportPeriod>('quarterly')
  const [month, setMonth] = useState(10)
  const [quarter, setQuarter] = useState(4)
  const [year, setYear] = useState('2026')
  const unit = sampleUnits.find((item) => item.id === unitId) ?? sampleUnits[0]
  const periodMonths = getPeriodMonths(period, month, quarter)
  const indicators = useMemo(() => unit.indicators.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())), [unit, query])
  const periodName = period === 'monthly' ? months[month - 1] : period === 'quarterly' ? `Triwulan ${quarter}` : 'Tahunan'

  function getMonthlyValue(entry: IndicatorEntry, monthNumber: number) {
    if (year !== '2026' || monthNumber !== 10) return '—'
    return getAchievement(entry)
  }

  return (
    <section className="reports-page">
      <div className="reports-heading">
        <div><span className="eyebrow">DOKUMEN LAPORAN</span><h1>Rekap &amp; unduh</h1><p>Lihat capaian indikator per bulan dalam laporan bulanan, triwulanan, atau tahunan.</p></div>
        <button className="secondary-button" type="button" disabled><ArrowDownToLine size={15} /> Unduh laporan</button>
      </div>
      <div className="reports-demo-note">Data simulasi untuk pratinjau. Hanya Oktober 2026 berisi contoh capaian; bulan lainnya belum ada data.</div>

      <div className="report-filters">
        <label className="report-filter"><span>UNIT / INSTALASI</span><select value={unitId} onChange={(event) => setUnitId(event.target.value)} aria-label="Pilih unit rekap">{sampleUnits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="report-filter"><span>TAHUN</span><select value={year} onChange={(event) => setYear(event.target.value)} aria-label="Pilih tahun"><option value="2026">2026</option><option value="2025">2025</option></select></label>
        {period === 'monthly' && <label className="report-filter"><span>BULAN</span><select value={month} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Pilih bulan">{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>}
        {period === 'quarterly' && <label className="report-filter"><span>TRIWULAN</span><select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} aria-label="Pilih triwulan"><option value={1}>Triwulan I · Jan–Mar</option><option value={2}>Triwulan II · Apr–Jun</option><option value={3}>Triwulan III · Jul–Sep</option><option value={4}>Triwulan IV · Okt–Des</option></select></label>}
        <label className="report-search"><span className="sr-only">Cari indikator</span><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari indikator" /></label>
      </div>

      <div className="period-tabs" role="tablist" aria-label="Jenis periode rekap">
        {([{ id: 'monthly', label: 'Bulanan' }, { id: 'quarterly', label: 'Triwulan' }, { id: 'yearly', label: 'Tahunan' }] as const).map((item) => <button key={item.id} className={`period-tab${period === item.id ? ' is-active' : ''}`} type="button" role="tab" aria-selected={period === item.id} onClick={() => setPeriod(item.id)}><CalendarDays size={14} />{item.label}</button>)}
      </div>

      <div className="report-period-summary"><div><strong>{unit.name}</strong><span>{periodName} {year} · {indicators.length} indikator</span></div><span className="report-columns-hint">{period === 'monthly' ? 'Rincian capaian satu bulan' : `${periodMonths.length} bulan ditampilkan terpisah`}</span></div>

      <div className="reports-table-wrap">
        <table className={`reports-table period-report-table${period === 'monthly' ? ' is-monthly' : ''}`}>
          <thead><tr><th>NO</th><th>INDIKATOR / DEFINISI OPERASIONAL</th><th>STANDAR</th>{period === 'monthly' ? <><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>ANALISA</th></> : periodMonths.map((monthNumber) => <th key={monthNumber}>{months[monthNumber - 1]}</th>)}</tr></thead>
          <tbody>{indicators.map((entry, index) => <tr key={entry.code}><td>{index + 1}</td><td className="report-indicator-cell"><strong>{entry.name}</strong><small>{entry.definition}</small><span>{entry.code}</span></td><td className="standard-cell">{entry.standard}</td>{period === 'monthly' ? <>{month === 10 && year === '2026' ? <><td>{entry.numerator || '—'}</td><td>{entry.denominator || '—'}</td><td>{getMonthlyValue(entry, month)}</td><td className="report-analysis-cell">{entry.analysis}</td></> : <td colSpan={4} className="no-period-data">Belum ada data {months[month - 1]} {year}</td>}</> : periodMonths.map((monthNumber) => <td className={getMonthlyValue(entry, monthNumber) === '—' ? 'no-period-data' : 'period-value'} key={monthNumber}>{getMonthlyValue(entry, monthNumber)}</td>)}</tr>)}</tbody>
        </table>
        {indicators.length === 0 && <div className="empty-state">Indikator tidak ditemukan.</div>}
      </div>

      <div className="report-format-note"><strong>Format rekap:</strong> bulanan memuat numerator, denominator, capaian, dan analisa. Rekap triwulan menampilkan Januari–Maret, April–Juni, Juli–September, atau Oktober–Desember sebagai kolom terpisah. Rekap tahunan menampilkan Januari–Desember.</div>
    </section>
  )
}

export default ReportsPage