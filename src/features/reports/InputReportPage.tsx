import { useEffect, useMemo, useState } from 'react'
import { Building2, CalendarDays, Check, CircleAlert, Info, LockKeyhole, Save, Wrench } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { sampleUnits, type IndicatorCalculation, type IndicatorEntry } from '../../data/sample-indicators'
import { getSupabaseClient } from '../../lib/supabase'
import { calculationOption } from '../../lib/spm-calculation'
import { achievement, formatAchievement } from '../../lib/spm-achievement'
import type { HelperKind } from '../../lib/spm-helper'
import { currentMonthStart, loadIndicators, loadPeriods, loadProfile, loadUnits, periodLabel, profileUnitIds, scopedUnitIds, type SpmIndicator, type SpmPeriod, type SpmProfile, type SpmUnit } from '../../lib/spm-data'
import HelperRecordsModal from './HelperRecordsModal'
import './InputReportPage.css'

interface InputEntry extends IndicatorEntry { indicatorId: string; helperKind?: HelperKind | null; helperMinSample?: number | null }

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
    type: calculation === 'average' ? 'duration' : calculation === 'numerator' || calculation === 'direct' ? 'number' : calculation === 'free_text' ? 'text' : 'ratio',
    calculation, unit: indicator.unit_label, scale: indicator.calculation_scale ?? undefined,
    resultUnit: indicator.result_unit, numerator: numeric(saved?.numerator),
    denominator: numeric(saved?.denominator), resultText: typeof saved?.result_text === 'string' ? saved.result_text : '', value: '',
    analysis: typeof saved?.analysis === 'string' ? saved.analysis : '',
    helperKind: indicator.helper_kind ?? null,
    helperMinSample: indicator.helper_min_sample ?? null,
  }
}

function entryCalculation(entry: IndicatorEntry): IndicatorCalculation {
  return entry.calculation ?? (entry.type === 'duration' ? 'average' : entry.type === 'category' ? 'numerator' : entry.scale ? 'scaled' : 'percentage')
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
  const [helperEntry, setHelperEntry] = useState<InputEntry | null>(null)
  const [loadingSetup, setLoadingSetup] = useState(!auth.isPreview)
  const [loadingEntries, setLoadingEntries] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [currentMonth] = useState(() => currentMonthStart())

  useEffect(() => {
    if (!client || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadPeriods(client), loadProfile(client, auth.userId)])
      .then(([nextUnits, nextPeriods, nextProfile]) => {
        if (!active) return
        const scope = scopedUnitIds(nextProfile)
        const scopedUnits = scope ? nextUnits.filter((unit) => scope.includes(unit.id)) : nextUnits
        setUnits(scopedUnits)
        setPeriods(nextPeriods)
        setProfile(nextProfile)
        setUnitId(nextProfile.unit_id && scopedUnits.some((unit) => unit.id === nextProfile.unit_id) ? nextProfile.unit_id : scopedUnits[0]?.id ?? '')
        const runningNow = new Date()
        const runningStart = `${runningNow.getFullYear()}-${String(runningNow.getMonth() + 1).padStart(2, '0')}-01`
        setPeriodStart(nextPeriods.find((item) => item.period_start === runningStart)?.period_start ?? nextPeriods.find((item) => item.period_start <= runningStart)?.period_start ?? nextPeriods[0]?.period_start ?? '')
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
          .select('indicator_id, numerator, denominator, result_text, analysis').eq('report_id', reportResult.data.id)
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
  const isFuture = Boolean(periodStart) && periodStart > currentMonth
  const selectedUnit = units.find((item) => item.id === unitId)
  const ownUnits = units.filter((item) => profileUnitIds(profile).includes(item.id))
  const canEditAnyUnit = Boolean(profile?.permissions.view_all_reports) || Boolean(profile?.permissions.manage_users)
  const ownsSelectedUnit = auth.isPreview || canEditAnyUnit || (Boolean(unitId) && profileUnitIds(profile).includes(unitId))
  const canInput = auth.isPreview || (Boolean(profile?.permissions.input_reports) && ownsSelectedUnit)
  const canEditLocked = auth.isPreview || Boolean(profile?.permissions.edit_locked_periods)
  const lockedReadOnly = isFuture || (Boolean(isLocked) && !canEditLocked)
  const isUnitOwner = auth.isPreview || (Boolean(unitId) && profileUnitIds(profile).includes(unitId))
  const canOpenHelper = isUnitOwner && (auth.isPreview || Boolean(profile?.permissions.input_reports)) && !isFuture && (!isLocked || canEditLocked)
  const completedCount = useMemo(() => entries.filter((entry) => {
    const calculation = entryCalculation(entry)
    if (calculation === 'free_text') return Boolean(entry.resultText?.trim())
    const direct = calculation === 'numerator' || calculation === 'direct'
    return direct ? entry.numerator !== '' : entry.numerator !== '' && entry.denominator !== ''
  }).length, [entries])

  function updateEntry(index: number, field: 'numerator' | 'denominator' | 'resultText' | 'analysis', value: string) {
    setSaved(false)
    setEntries((current) => current.map((entry, rowIndex) => rowIndex === index ? { ...entry, [field]: value } : entry))
  }

  function getAchievement(entry: IndicatorEntry) {
    const calculation = entryCalculation(entry)
    if (calculation === 'free_text') return entry.resultText?.trim() || 'Belum diisi'
    if (entry.numerator === '') return 'Belum dihitung'
    if (calculation !== 'numerator' && calculation !== 'direct' && entry.denominator === '') return 'Belum dihitung'
    const value = achievement(
      { numerator: Number(entry.numerator), denominator: entry.denominator === '' ? null : Number(entry.denominator) },
      { calculation_method: calculation, calculation_scale: entry.scale ?? null },
    )
    if (value === null) return 'Belum dihitung'
    return formatAchievement(value, { calculation_method: calculation, unit_label: entry.unit, result_unit: entry.resultUnit })
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
      const rows = entries.map((entry) => {
        const isText = entryCalculation(entry) === 'free_text'
        return {
          report_id: currentReportId,
          indicator_id: entry.indicatorId,
          numerator: isText || entry.numerator === '' ? null : Number(entry.numerator),
          denominator: isText || entry.denominator === '' ? null : Number(entry.denominator),
          result_text: isText ? entry.resultText?.trim() || null : null,
          analysis: entry.analysis,
          evidence_note: '',
          updated_at: new Date().toISOString(),
        }
      })
      if (rows.length) {
        const { error: saveError } = await client.from('report_entries').upsert(rows, { onConflict: 'report_id,indicator_id' })
        if (saveError) throw saveError
      }
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Laporan gagal disimpan.')
    } finally { setSaving(false) }
  }

  const saveDisabled = saving || loadingSetup || loadingEntries || lockedReadOnly || !canInput || entries.length === 0

  return (
    <section className="input-page">
      <div className="input-heading"><div><span className="eyebrow">INPUT CAPAIAN UNIT</span><h1>Laporan SPM</h1><p>Isi jumlah dan total sesuai rumus indikator. Indikator "Jumlah (hitung banyaknya)" cukup diisi jumlahnya, "Nilai akhir (skor/angka jadi)" cukup diisi capaiannya, dan "Teks bebas" diketik apa adanya.</p></div><div className="input-controls"><label><span>Unit / instalasi</span><div className="input-period"><Building2 size={16} /><select value={unitId} onChange={(event) => { setLoadingEntries(true); setUnitId(event.target.value); setSaved(false) }} aria-label="Pilih unit atau instalasi" disabled={units.length <= 1}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div></label><label><span>Periode laporan</span><div className="input-period"><CalendarDays size={16} /><select value={periodStart} onChange={(event) => { setLoadingEntries(true); setPeriodStart(event.target.value); setSaved(false) }} aria-label="Pilih periode input">{periods.map((period) => <option key={period.period_start} value={period.period_start}>{periodLabel(period.period_start)}</option>)}</select></div></label></div></div>
      {auth.isPreview && <div className="input-demo-note">Mode pratinjau. Nilai contoh belum disimpan ke database RSUD.</div>}
      {error && <div className="input-demo-note" role="alert"><CircleAlert size={15} /> {error}</div>}
      {periods.length === 0 && !loadingSetup && <div className="input-demo-note">Belum ada periode pelaporan. Jalankan migration data aplikasi di Supabase.</div>}
      {!ownsSelectedUnit && <div className="input-demo-note">Mode lihat saja. Anda hanya dapat menginput data unit {ownUnits.map((item) => item.name).join(', ') || 'Anda'}.</div>}
      <div className={`period-state${isLocked ? ' is-locked' : isFuture ? ' is-future' : ''}`}><span className="period-state-icon">{isLocked || isFuture ? <LockKeyhole size={16} /> : <Check size={16} />}</span><div><strong>{isFuture ? 'Periode belum berjalan' : isLocked ? 'Periode terkunci' : 'Periode terbuka'}</strong><small>{isFuture ? 'Input untuk periode mendatang belum dibuka. Pilih periode berjalan atau sebelumnya.' : isLocked ? (canEditLocked ? 'Anda memiliki akses khusus untuk mengoreksi periode terkunci.' : 'Input hanya dapat diubah oleh petugas yang memiliki akses khusus.') : 'Perubahan nilai akan dicatat pada laporan periode ini.'}</small></div><span className="completion-count">{completedCount}/{entries.length} indikator terisi</span></div>
      <div className="input-help"><Info size={14} /><span><strong>Jumlah</strong> = bagian yang dihitung (mis. 80 pasien patuh). <strong>Total</strong> = keseluruhan pembanding (mis. 100 pasien). Indikator <strong>Jumlah (hitung banyaknya)</strong> cukup diisi jumlahnya; <strong>Nilai akhir (skor/angka jadi)</strong> cukup diisi capaiannya; <strong>Teks bebas</strong> diketik langsung (mis. Biru, Hijau, Merah).</span></div>
      <div className="input-table-wrap"><table className="input-table"><thead><tr><th>INDIKATOR / DEFINISI OPERASIONAL</th><th>STANDAR</th><th>NILAI / JUMLAH</th><th>TOTAL (PENYEBUT)</th><th>CAPAIAN</th><th>ANALISA</th></tr></thead><tbody>{entries.map((entry, index) => {
        const method = entryCalculation(entry)
        const option = calculationOption(method)
        const direct = method === 'direct'
        const freeText = method === 'free_text'
        const withoutDenominator = direct || freeText || method === 'numerator'
        const disabled = Boolean(lockedReadOnly) || !canInput || loadingEntries
        return <tr key={entry.indicatorId}>
          <td className="indicator-cell"><strong>{entry.name}</strong><small>{entry.definition}</small><span className="indicator-meta">{entry.code}<span className="calculation-badge">{option.name}</span>{entry.helperKind && <span className="calculation-badge">alat bantu</span>}{entry.helperKind && canOpenHelper && <button className="helper-open" type="button" onClick={() => setHelperEntry(entry)} disabled={disabled}><Wrench size={12} /> Alat bantu</button>}</span></td>
          <td className="standard-cell">{entry.standard}</td>
          {freeText
            ? <td><input aria-label={`Capaian ${entry.name}`} title={option.inputHint} type="text" value={entry.resultText ?? ''} disabled={disabled} placeholder="Ketik capaian (mis. Biru)" onChange={(event) => updateEntry(index, 'resultText', event.target.value)} /></td>
            : direct
              ? <td><input aria-label={`Capaian ${entry.name}`} title={option.inputHint} type="number" min="0" step="any" value={entry.numerator} disabled={disabled} onChange={(event) => updateEntry(index, 'numerator', event.target.value)} /></td>
              : <td><input aria-label={`${method === 'numerator' ? 'Jumlah' : 'Jumlah (pembilang)'} ${entry.name}`} title={option.inputHint} type="number" min="0" step="any" value={entry.numerator} disabled={disabled} onChange={(event) => updateEntry(index, 'numerator', event.target.value)} /></td>}
          {withoutDenominator
            ? <td><span className="not-applicable">—</span></td>
            : <td><input aria-label={`Total (penyebut) ${entry.name}`} title={option.inputHint} type="number" min="0" step="any" value={entry.denominator} disabled={disabled} onChange={(event) => updateEntry(index, 'denominator', event.target.value)} /></td>}
          <td><strong className="achievement-value">{getAchievement(entry)}</strong></td>
          <td><textarea aria-label={`Analisa ${entry.name}`} value={entry.analysis} disabled={disabled} onChange={(event) => updateEntry(index, 'analysis', event.target.value)} rows={2} /></td>
        </tr>
      })}</tbody></table>{entries.length === 0 && <div className="input-demo-note">{loadingSetup || loadingEntries ? 'Memuat data input…' : 'Belum ada indikator aktif untuk unit dan periode ini.'}</div>}</div>
      <div className="input-footer"><span>{saved ? <><Check size={15} /> {auth.isPreview ? 'Tersimpan di pratinjau' : 'Tersimpan di database'}</> : !canInput ? (ownsSelectedUnit ? 'Akun ini tidak memiliki izin input laporan.' : `Mode lihat saja untuk ${selectedUnit?.name ?? 'unit lain'}.`) : 'Simpan perubahan sebelum berpindah halaman.'}</span><button className="primary-button" type="button" disabled={saveDisabled} onClick={() => void saveEntries()}><Save size={15} /> {saving ? 'Menyimpan…' : 'Simpan input'}</button></div>
      {helperEntry?.helperKind && <HelperRecordsModal
        indicatorId={helperEntry.indicatorId}
        indicatorName={helperEntry.name}
        kind={helperEntry.helperKind}
        unitLabel={helperEntry.unit}
        unitId={unitId}
        periodStart={periodStart}
        reportId={reportId}
        userId={auth.userId ?? null}
        minSample={helperEntry.helperMinSample ?? null}
        canEdit={canOpenHelper}
        isPreview={auth.isPreview}
        onClose={() => setHelperEntry(null)}
        onSaved={(result) => {
          if (result.reportId) setReportId(result.reportId)
          setSaved(false)
          const savedId = helperEntry.indicatorId
          setEntries((current) => current.map((entry) => entry.indicatorId === savedId
            ? { ...entry, numerator: result.numerator === null ? '' : String(result.numerator), denominator: result.denominator === null ? '' : String(result.denominator) }
            : entry))
        }}
      />}
    </section>
  )
}

export default InputReportPage
