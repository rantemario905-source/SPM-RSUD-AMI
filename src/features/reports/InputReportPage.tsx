import { useMemo, useState } from 'react'
import { Building2, CalendarDays, Check, LockKeyhole, Save } from 'lucide-react'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
import './InputReportPage.css'

function InputReportPage() {
  const [unitId, setUnitId] = useState(sampleUnits[0].id)
  const [period, setPeriod] = useState('Oktober 2026')
  const [entriesByUnit, setEntriesByUnit] = useState<Record<string, IndicatorEntry[]>>(
    () => Object.fromEntries(sampleUnits.map((unit) => [unit.id, unit.indicators])) as Record<string, IndicatorEntry[]>,
  )
  const [saved, setSaved] = useState(false)
  const entries = entriesByUnit[unitId]
  const isLocked = period === 'September 2026'
  const completedCount = useMemo(() => entries.filter((entry) => entry.analysis.trim() && entry.numerator !== '' && entry.denominator !== '').length, [entries])

  function updateEntry(index: number, field: 'numerator' | 'denominator' | 'analysis', value: string) {
    setSaved(false)
    setEntriesByUnit((current) => ({
      ...current,
      [unitId]: current[unitId].map((entry, rowIndex) => rowIndex === index ? { ...entry, [field]: value } : entry),
    }))
  }

  function getAchievement(entry: IndicatorEntry) {
    const numerator = Number(entry.numerator)
    const denominator = Number(entry.denominator)
    if (entry.numerator === '' || entry.denominator === '' || denominator <= 0) return 'Belum dihitung'

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

  return (
    <section className="input-page">
      <div className="input-heading"><div><span className="eyebrow">INPUT CAPAIAN UNIT</span><h1>Laporan SPM</h1><p>Isi numerator, denominator, dan analisa. Data tersimpan langsung pada periode terbuka.</p></div><div className="input-controls"><label><span>Unit / instalasi</span><div className="input-period"><Building2 size={16} /><select value={unitId} onChange={(event) => { setUnitId(event.target.value); setSaved(false) }} aria-label="Pilih unit atau instalasi">{sampleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div></label><label><span>Periode laporan</span><div className="input-period"><CalendarDays size={16} /><select value={period} onChange={(event) => { setPeriod(event.target.value); setSaved(false) }} aria-label="Pilih periode input"><option>Oktober 2026</option><option>September 2026</option><option>November 2026</option></select></div></label></div></div>
      <div className="input-demo-note">Mode pratinjau. Nilai contoh belum disimpan ke database RSUD.</div>
      <div className={`period-state${isLocked ? ' is-locked' : ''}`}><span className="period-state-icon">{isLocked ? <LockKeyhole size={16} /> : <Check size={16} />}</span><div><strong>{isLocked ? 'Periode terkunci' : 'Periode terbuka'}</strong><small>{isLocked ? 'Input hanya dapat diubah oleh petugas yang memiliki akses khusus.' : 'Perubahan nilai langsung tercatat pada laporan periode ini.'}</small></div><span className="completion-count">{completedCount}/{entries.length} indikator terisi</span></div>
      <div className="input-table-wrap"><table className="input-table"><thead><tr><th>INDIKATOR / DEFINISI OPERASIONAL</th><th>STANDAR</th><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>ANALISA</th></tr></thead><tbody>{entries.map((entry, index) => <tr key={entry.code}><td className="indicator-cell"><strong>{entry.name}</strong><small>{entry.definition}</small><span>{entry.code}</span></td><td className="standard-cell">{entry.standard}</td><td><input aria-label={`Numerator ${entry.name}`} type="number" min="0" step="any" value={entry.numerator} disabled={isLocked} onChange={(event) => updateEntry(index, 'numerator', event.target.value)} /></td><td><input aria-label={`Denominator ${entry.name}`} type="number" min="0" step="any" value={entry.denominator} disabled={isLocked} onChange={(event) => updateEntry(index, 'denominator', event.target.value)} /></td><td><strong className="achievement-value">{getAchievement(entry)}</strong></td><td><textarea aria-label={`Analisa ${entry.name}`} value={entry.analysis} disabled={isLocked} onChange={(event) => updateEntry(index, 'analysis', event.target.value)} rows={2} /></td></tr>)}</tbody></table></div>
      <div className="input-footer"><span>{saved ? <><Check size={15} /> Tersimpan di pratinjau</> : 'Simpan berkala saat mengisi laporan.'}</span><button className="primary-button" type="button" disabled={isLocked} onClick={() => setSaved(true)}><Save size={15} /> Simpan input</button></div>
    </section>
  )
}

export default InputReportPage
