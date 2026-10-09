import { useEffect, useMemo, useState } from 'react'
import { Building2, CalendarDays, Check, CircleAlert, LockKeyhole, Save } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { sampleUnits, type IndicatorEntry } from '../../data/sample-indicators'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadProfile, loadUnits, periodLabel, type SpmIndicator, type SpmPeriod, type SpmProfile, type SpmUnit } from '../../lib/spm-data'
import './InputReportPage.css'

interface InputEntry extends IndicatorEntry { indicatorId: string }

const previewPeriods: SpmPeriod[] = [
  { period_start: '2026-10-01', period_end: '2026-10-31', state: 'open' },
  { period_start: '2026-09-01', period_end: '2026-09-30', state: 'locked' },
  { period_start: '2026-11-01', period_end: '2026-11-30', state: 'open' },
]

function entryFromIndicator(indicator: SpmIndicator, saved?: Record<string, unknown>): InputEntry {
  const calculation = indicator.calculation_method
  const numeric = (value: unknown) => value === null || value === undefined ? '' : String(value)
  return {
    indicatorId: indicator.id, code: indicator.code, name: indicator.name,
    definition: indicator.operational_definition, standard: indicator.standard,
    type: calculation === 'average' ? 'duration' : calculation === 'numerator' ? 'number' : 'ratio',
    calculation, unit: indicator.unit_label, scale: indicator.calculation_scale ?? undefined,
    resultUnit: indicator.result_unit, numerator: numeric(saved?.numerator),
    denominator: numeric(saved?.denominator), value: '',
    analysis: typeof saved?.analysis === 'string' ? saved.analysis : '',
  }
}

function InputReportPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const previewUnits: SpmUnit[] = sampleUnits.map(({ id, name }) => ({ id, code: id.toUpperCase(), name }))
  const [units, setUnits] = useState<SpmUnit[]>(auth.isPreview ? previewUnits : [])
  const [periods, setPeriods] = useState<SpmPeriod[]>(auth.isPreview ? previewPeriods : [])
  const [profile, setProfile] = useState<SpmProfile | null>(null)
  const [unitId, setUnitId] = useState(auth.isPreview ? previewUnits[0].id : '')
  const [periodStart, setPeriodStart] = useState(auth.isPreview ? '2026-10-01' : '')
  const [entries, setEntries] = useState<InputEntry[]>(auth.isPreview ? sampleUnits[0].indicators.map((entry) => ({ ...entry, indicatorId: entry.code })) : [])
  const [reportId, setReportId] = useState<string | null>(null)
  const [loadingSetup, setLoadingSetup] = useState(!auth.isPreview)
  const [loadingEntries, setLoadingEntries] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadPeriods(client), loadProfile(client, auth.userId)])
      .then(([nextUnits, nextPeriods, nextProfile]) => {
        if (!active) return
        const availableUnits = nextProfile.unit_id ? nextUnits.filter((unit) => unit.id === nextProfile.unit_id) : nextUnits
        setUnits(availableUnits)
        setPeriods(nextPeriods)
        setProfile(nextProfile)
        setUnitId(availableUnits[0]?.id ?? '')
        const runningNow = new Date()
        const runningStart = `${runningNow.getFullYear()}-${String(runningNow.getMonth() + 1).padStart(2, '0')}-01`
        setPeriodStart(nextPeriods.find((item) => item.period_start === runningStart)?.period_start ?? nextPeriods[0]?.period_start ?? '')
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Data input gagal dimuat.')
          setLoadingEntries(false)
        }
      })
      .finally(() => { if (active) setLoadingSetup(false) })
    return () => { active = false }
  }, [client, auth.userId])

  useEffect(() => {
    if (!client || auth.isPreview || loadingSetup || !unitId || !periodStart) return
    const supabase = client
    let active = true
    async function loadReport() {
      const [indicators, reportResult] = await Promise.all([
        loadIndicators(supabase, unitId),
        supabase.from('reports').select('id').eq('unit_id', unitId).eq('period_start', periodStart).maybeSingle(),
      ])
      if (reportResult.error) throw reportResult.error
      let savedEntries: Record<string, unknown>[] = []
      if (reportResult.data) {
        setReportId(reportResult.data.id)
        const { data, error: entriesError } = await supabase.from('report_entries')
          .select('indicator_id, numerator, denominator, analysis').eq('report_id', reportResult.data.id)
        if (entriesError) throw entriesError
        savedEntries = data ?? []
      } else setReportId(null)
      const entriesByIndicator = new Map(savedEntries.map((entry) => [String(entry.indicator_id), entry]))
      if (active) {
        setError('')
        setEntries(indicators.filter((indicator) => indicator.active).map((indicator) => entryFromIndicator(indicator, entriesByIndicator.get(indicator.id))))
      }
    }
    void loadReport()
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Laporan gagal dimuat.') })
      .finally(() => { if (active) setLoadingEntries(false) })
    return () => { active = false }
  }, [client, auth.isPreview, loadingSetup, unitId, periodStart])

  const selectedPeriod = periods.find((period) => period.period_start === periodStart)
  const isLocked = selectedPeriod?.state === 'locked'
  const canInput = auth.isPreview || Boolean(profile?.permissions.input_reports)
  const completedCount = useMemo(() => entries.filter((entry) => entry.analysis.trim() && entry.numerator !== '' && entry.denominator !== '').length, [entries])

  function updateEntry(index: number, field: 'numerator' | 'denominator' | 'analysis', value: string) {
    setSaved(false)
    setEntries((current) => current.map((entry, rowIndex) => rowIndex === index ? { ...entry, [field]: value } : entry))
  }

  function getAchievement(entry: IndicatorEntry) {
    const numerator = Number(entry.numerator)
    const denominator = Number(entry.denominator)
    if (entry.numerator === '' || entry.denominator === '' || denominator <= 0) return 'Belum dihitung'
    const calculation = entry.calculation ?? (entry.type === 'duration' ? 'average' : entry.type === 'category' ? 'numerator' : entry.scale ? 'scaled' : 'percentage')
    const result = calculation === 'average' ? numerator / denominator : calculation === 'numerator' ? numerator : (numerator / denominator) * (calculation === 'scaled' ? entry.scale ?? 1000 : 100)
    const unit = calculation === 'average' || calculation === 'numerator' ? entry.unit : calculation === 'scaled' ? entry.resultUnit ?? 'per 1.000' : '%'
    return `${result.toLocaleString('id-ID', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`
  }

  async function saveEntries() {
    if (auth.isPreview) { setSaved(true); return }
    if (!client || !auth.userId || !unitId || !periodStart) return
    setSaving(true)
    setError('')
    try {
      let currentReportId = reportId
      if (!currentReportId) {
        const { data, error: createError } = await client.from('reports')
          .insert({ unit_id: unitId, period_start: periodStart, created_by: auth.userId }).select('id').single()
        if (createError) throw createError
        currentReportId = data.id
        setReportId(currentReportId)
      }
      const rows = entries.map((entry) => ({
        report_id: currentReportId,
        indicator_id: entry.indicatorId,
        numerator: entry.numerator === '' ? null : Number(entry.numerator),
        denominator: entry.denominator === '' ? null : Number(entry.denominator),
        analysis: entry.analysis,
        evidence_note: '',
        updated_at: new Date().toISOString(),
      }))
      if (rows.length) {
        const { error: saveError } = await client.from('report_entries').upsert(rows, { onConflict: 'report_id,indicator_id' })
        if (saveError) throw saveError
      }
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Laporan gagal disimpan.')
    } finally { setSaving(false) }
  }

  const saveDisabled = saving || loadingSetup || loadingEntries || isLocked || !canInput || entries.length === 0

  return (
    <section className="input-page">
      <div className="input-heading"><div><span className="eyebrow">INPUT CAPAIAN UNIT</span><h1>Laporan SPM</h1><p>Isi numerator, denominator, dan analisa. Data tersimpan langsung pada periode terbuka.</p></div><div className="input-controls"><label><span>Unit / instalasi</span><div className="input-period"><Building2 size={16} /><select value={unitId} onChange={(event) => { setLoadingEntries(true); setUnitId(event.target.value); setSaved(false) }} aria-label="Pilih unit atau instalasi" disabled={units.length <= 1}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div></label><label><span>Periode laporan</span><div className="input-period"><CalendarDays size={16} /><select value={periodStart} onChange={(event) => { setLoadingEntries(true); setPeriodStart(event.target.value); setSaved(false) }} aria-label="Pilih periode input">{periods.map((period) => <option key={period.period_start} value={period.period_start}>{periodLabel(period.period_start)}</option>)}</select></div></label></div></div>
      {auth.isPreview && <div className="input-demo-note">Mode pratinjau. Nilai contoh belum disimpan ke database RSUD.</div>}
      {error && <div className="input-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}
      {periods.length === 0 && !loadingSetup && <div className="input-demo-note">Belum ada periode pelaporan. Jalankan migration data aplikasi di Supabase.</div>}
      <div className={`period-state${isLocked ? ' is-locked' : ''}`}><span className="period-state-icon">{isLocked ? <LockKeyhole size={16} /> : <Check size={16} />}</span><div><strong>{isLocked ? 'Periode terkunci' : 'Periode terbuka'}</strong><small>{isLocked ? 'Input hanya dapat diubah oleh petugas yang memiliki akses khusus.' : 'Perubahan nilai akan dicatat pada laporan periode ini.'}</small></div><span className="completion-count">{completedCount}/{entries.length} indikator terisi</span></div>
      <div className="input-table-wrap"><table className="input-table"><thead><tr><th>INDIKATOR / DEFINISI OPERASIONAL</th><th>STANDAR</th><th>NUMERATOR</th><th>DENOMINATOR</th><th>CAPAIAN</th><th>ANALISA</th></tr></thead><tbody>{entries.map((entry, index) => <tr key={entry.indicatorId}><td className="indicator-cell"><strong>{entry.name}</strong><small>{entry.definition}</small><span>{entry.code}</span></td><td className="standard-cell">{entry.standard}</td><td><input aria-label={`Numerator ${entry.name}`} type="number" min="0" step="any" value={entry.numerator} disabled={Boolean(isLocked) || !canInput || loadingEntries} onChange={(event) => updateEntry(index, 'numerator', event.target.value)} /></td><td><input aria-label={`Denominator ${entry.name}`} type="number" min="0" step="any" value={entry.denominator} disabled={Boolean(isLocked) || !canInput || loadingEntries} onChange={(event) => updateEntry(index, 'denominator', event.target.value)} /></td><td><strong className="achievement-value">{getAchievement(entry)}</strong></td><td><textarea aria-label={`Analisa ${entry.name}`} value={entry.analysis} disabled={Boolean(isLocked) || !canInput || loadingEntries} onChange={(event) => updateEntry(index, 'analysis', event.target.value)} rows={2} /></td></tr>)}</tbody></table>{entries.length === 0 && <div className="input-demo-note">{loadingSetup || loadingEntries ? 'Memuat data input…' : 'Belum ada indikator aktif untuk unit dan periode ini.'}</div>}</div>
      <div className="input-footer"><span>{saved ? <><Check size={15} /> {auth.isPreview ? 'Tersimpan di pratinjau' : 'Tersimpan di database'}</> : !canInput ? 'Akun ini tidak memiliki izin input laporan.' : 'Simpan perubahan sebelum berpindah halaman.'}</span><button className="primary-button" type="button" disabled={saveDisabled} onClick={() => void saveEntries()}><Save size={15} /> {saving ? 'Menyimpan…' : 'Simpan input'}</button></div>
    </section>
  )
}

export default InputReportPage
