import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, CircleAlert, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { sampleUnits, type IndicatorCalculation, type IndicatorEntry } from '../../data/sample-indicators'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { indicatorColumns, loadIndicators, loadProfile, loadUnits, scopedUnitIds, type SpmIndicator, type SpmProfile, type SpmUnit } from '../../lib/spm-data'
import ConfirmDialog from '../../components/feedback/ConfirmDialog'
import './IndicatorsPage.css'

interface CatalogIndicator extends IndicatorEntry {
  id?: string
  unitId: string
  effectiveYear: number
  enabled: boolean
}

interface IndicatorForm {
  unitId: string
  code: string
  name: string
  definition: string
  standard: string
  calculation: IndicatorCalculation
  unit: string
  scale: string
  resultUnit: string
  effectiveYear: string
}

const emptyForm: IndicatorForm = {
  unitId: sampleUnits[0].id,
  code: '',
  name: '',
  definition: '',
  standard: '',
  calculation: 'percentage',
  unit: '%',
  scale: '1000',
  resultUnit: 'per 1.000 pasien',
  effectiveYear: '2026',
}

const calculationLabel: Record<IndicatorCalculation, string> = {
  percentage: 'Numerator ÷ denominator × 100%',
  average: 'Numerator ÷ denominator (rerata)',
  scaled: 'Rasio × skala',
  numerator: 'Nilai numerator',
  direct: 'Nilai capaian langsung',
}

const tablePreviewRows = 10

function getCalculation(indicator: IndicatorEntry): IndicatorCalculation {
  return indicator.calculation ?? (indicator.type === 'duration' ? 'average' : indicator.type === 'category' ? 'numerator' : indicator.scale ? 'scaled' : 'percentage')
}

function initialCatalog(): CatalogIndicator[] {
  return sampleUnits.flatMap((unit) => unit.indicators.map((indicator) => ({
    ...indicator,
    unitId: unit.id,
    calculation: getCalculation(indicator),
    effectiveYear: 2026,
    enabled: true,
  })))
}

function fromDatabase(indicator: SpmIndicator): CatalogIndicator {
  const calculation = indicator.calculation_method
  return {
    id: indicator.id,
    code: indicator.code,
    name: indicator.name,
    definition: indicator.operational_definition,
    standard: indicator.standard,
    type: calculation === 'average' ? 'duration' : calculation === 'numerator' || calculation === 'direct' ? 'number' : 'ratio',
    calculation,
    unit: indicator.unit_label,
    scale: indicator.calculation_scale ?? undefined,
    resultUnit: indicator.result_unit,
    numerator: '',
    denominator: '',
    value: '',
    analysis: '',
    unitId: indicator.unit_id ?? '',
    effectiveYear: Number(indicator.effective_from.slice(0, 4)),
    enabled: indicator.active,
  }
}

function describeIndicatorError(error: unknown, code: string) {
  const candidate = error as { code?: string; message?: string } | null
  if (candidate?.code === '23505') {
    return `Kode indikator "${code}" sudah digunakan — bisa jadi oleh indikator nonaktif atau unit lain yang tidak tampil di daftar Anda. Gunakan kode yang berbeda.`
  }
  if (candidate?.code === 'PGRST116') {
    return 'Indikator tidak tersimpan: data tidak ditemukan atau unit Anda tidak berwenang mengubahnya. Muat ulang halaman lalu coba lagi.'
  }
  if (error instanceof Error) return error.message
  return 'Indikator gagal disimpan.'
}

function IndicatorsPage() {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [units, setUnits] = useState<SpmUnit[]>(sampleUnits.map(({ id, name }) => ({ id, code: id.toUpperCase(), name })))
  const [profile, setProfile] = useState<SpmProfile | null>(null)
  const [indicators, setIndicators] = useState<CatalogIndicator[]>(auth.isPreview ? initialCatalog() : [])
  const [loading, setLoading] = useState(!auth.isPreview)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCode, setEditingCode] = useState('')
  const [form, setForm] = useState<IndicatorForm>(emptyForm)
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const [pendingDelete, setPendingDelete] = useState<CatalogIndicator | null>(null)
  const tableWrapRef = useRef<HTMLDivElement | null>(null)
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!client || auth.isPreview || !auth.userId) return
    let active = true
    Promise.all([loadUnits(client), loadProfile(client, auth.userId)])
      .then(async ([allUnits, nextProfile]) => {
        const scope = scopedUnitIds(nextProfile)
        const scopedUnits = scope ? allUnits.filter((unit) => scope.includes(unit.id)) : allUnits
        const nextIndicators = await loadIndicators(client, scope ?? undefined)
        if (!active) return
        setProfile(nextProfile)
        setUnits(scopedUnits)
        setIndicators(nextIndicators.map(fromDatabase))
        setForm((current) => ({ ...current, unitId: nextProfile.unit_id && scopedUnits.some((unit) => unit.id === nextProfile.unit_id) ? nextProfile.unit_id : scopedUnits[0]?.id ?? '' }))
        setUnitFilter('all')
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Data indikator gagal dimuat.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId])

  const filteredIndicators = useMemo(() => indicators.filter((indicator) => {
    const matchesText = `${indicator.code} ${indicator.name} ${indicator.definition}`.toLowerCase().includes(query.toLowerCase())
    const matchesUnit = unitFilter === 'all' || indicator.unitId === unitFilter
    return matchesText && matchesUnit
  }), [indicators, query, unitFilter])

  const scopedIds = profile ? scopedUnitIds(profile) : null
  const canManageAll = auth.isPreview || Boolean(profile?.permissions.view_all_reports) || Boolean(profile?.permissions.manage_users)

  function canWriteIndicator(indicator: CatalogIndicator) {
    if (canManageAll) return true
    return Boolean(indicator.unitId) && (scopedIds ?? []).includes(indicator.unitId)
  }

  useEffect(() => {
    function measureTable() {
      const wrap = tableWrapRef.current
      if (!wrap) return
      wrap.scrollTop = 0
      const rows = wrap.querySelectorAll('tbody tr')
      if (rows.length <= tablePreviewRows) {
        setTableMaxHeight(null)
        return
      }
      const firstHidden = rows[tablePreviewRows] as HTMLElement | undefined
      if (!firstHidden) {
        setTableMaxHeight(null)
        return
      }
      const offset = firstHidden.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop
      const chrome = wrap.offsetHeight - wrap.clientHeight
      setTableMaxHeight(Math.max(0, Math.round(offset) + chrome))
    }
    measureTable()
    window.addEventListener('resize', measureTable)
    return () => window.removeEventListener('resize', measureTable)
  }, [filteredIndicators])

  function openCreate() {
    setEditingId(null)
    setEditingCode('')
    setForm({ ...emptyForm, unitId: units[0]?.id ?? '' })
    setNotice('')
    setFormError('')
    setDialog('create')
  }

  function openEdit(indicator: CatalogIndicator) {
    setEditingId(indicator.id ?? null)
    setEditingCode(indicator.code)
    setForm({
      unitId: indicator.unitId,
      code: indicator.code,
      name: indicator.name,
      definition: indicator.definition,
      standard: indicator.standard,
      calculation: getCalculation(indicator),
      unit: indicator.unit,
      scale: String(indicator.scale ?? 1000),
      resultUnit: indicator.resultUnit ?? 'per 1.000 pasien',
      effectiveYear: String(indicator.effectiveYear),
    })
    setNotice('')
    setFormError('')
    setDialog('edit')
  }

  async function saveIndicator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const isEditing = dialog === 'edit'
    const unit = units.find((item) => item.id === form.unitId)
    if (!unit) {
      const message = 'Unit / jenis pelayanan tidak dikenali. Muat ulang halaman lalu coba lagi.'
      setFormError(message)
      setToast(message)
      return
    }

    const changed: CatalogIndicator = {
      id: editingId ?? undefined,
      code: form.code.trim(),
      name: form.name.trim(),
      definition: form.definition.trim(),
      standard: form.standard.trim(),
      type: form.calculation === 'average' ? 'duration' : form.calculation === 'numerator' || form.calculation === 'direct' ? 'number' : 'ratio',
      calculation: form.calculation,
      unit: form.unit.trim(),
      scale: form.calculation === 'scaled' ? Number(form.scale) : undefined,
      resultUnit: form.calculation === 'scaled' ? form.resultUnit.trim() : undefined,
      numerator: '',
      denominator: '',
      value: '',
      analysis: '',
      unitId: form.unitId,
      effectiveYear: Number(form.effectiveYear),
      enabled: isEditing ? indicators.find((item) => item.id === editingId)?.enabled ?? true : true,
    }

    const duplicate = indicators.find((item) => {
      const isEditingTarget = isEditing && (item.id === editingId || item.code === editingCode)
      return !isEditingTarget && item.code.trim().toUpperCase() === changed.code.toUpperCase()
    })
    if (duplicate) {
      const message = `Kode indikator "${changed.code}" sudah digunakan oleh ${duplicate.name}. Gunakan kode yang berbeda.`
      setFormError(message)
      setToast(message)
      return
    }

    const editingRowId = isEditing ? editingId : null
    if (client && isEditing && !editingRowId) {
      const message = 'Data indikator tidak dikenali sehingga batal disimpan. Muat ulang halaman lalu coba lagi.'
      setError(message)
      setFormError(message)
      setToast(message)
      return
    }

    setSaving(true)
    setError('')
    setFormError('')
    try {
      let saved = changed
      if (client) {
        const record = {
          code: changed.code,
          service_name: unit.name,
          name: changed.name,
          operational_definition: changed.definition,
          standard: changed.standard,
          calculation_method: changed.calculation,
          unit_label: changed.unit,
          calculation_scale: changed.scale ?? null,
          result_unit: changed.resultUnit ?? changed.unit,
          unit_id: changed.unitId,
          effective_from: `${changed.effectiveYear}-01-01`,
          active: changed.enabled,
        }
        const result = editingRowId
          ? await client.from('indicators').update(record).eq('id', editingRowId).select(indicatorColumns).single()
          : await client.from('indicators').insert(record).select(indicatorColumns).single()
        if (result.error) throw result.error
        saved = fromDatabase(result.data as SpmIndicator)
      }
      if (isEditing) {
        const targetId = editingRowId
        setIndicators((current) => current.map((item) => (targetId ? item.id === targetId : item.code === editingCode) ? saved : item))
      } else {
        setIndicators((current) => [...current, saved])
      }
      setNotice(`${saved.code} ${isEditing ? 'diperbarui' : 'ditambahkan'}${client ? ' di database.' : ' di pratinjau.'}`)
      setDialog(null)
    } catch (saveError) {
      const message = describeIndicatorError(saveError, changed.code)
      setError(message)
      setFormError(message)
      setToast(message)
    } finally {
      setSaving(false)
    }
  }

  async function removeIndicator(indicator: CatalogIndicator) {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      if (client && indicator.id) {
        const { error: deleteError } = await client.from('indicators').delete().eq('id', indicator.id)
        if (deleteError) {
          if (deleteError.code === '23503') throw new Error('Indikator tidak dapat dihapus karena sudah memiliki data entri laporan. Nonaktifkan saja indikator ini.')
          throw deleteError
        }
      }
      setIndicators((current) => current.filter((item) => !(item.id === indicator.id && item.code === indicator.code)))
      setNotice(`Indikator ${indicator.code} dihapus${client ? ' dari database.' : ' dari pratinjau.'}`)
      setToast(`Indikator ${indicator.code} dihapus.`)
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Indikator gagal dihapus.'
      setError(message)
      setToast(message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleIndicator(indicator: CatalogIndicator) {
    const enabled = !indicator.enabled
    setError('')
    if (client && indicator.id) {
      const { error: updateError } = await client.from('indicators').update({ active: enabled }).eq('id', indicator.id)
      if (updateError) {
        setError(updateError.message)
        return
      }
    }
    setIndicators((current) => current.map((item) => item.id === indicator.id && item.code === indicator.code ? { ...item, enabled } : item))
  }

  return (
    <section className="indicators-page">
      <div className="indicators-heading">
        <div><span className="eyebrow">PENGELOLAAN DATA</span><h1>Indikator SPM</h1><p>Master indikator, standar, definisi operasional, dan jenis input per unit.</p></div>
      </div>

      {auth.isPreview && <div className="indicator-demo-note"><CircleAlert size={16} /><span><strong>Mode simulasi.</strong> Perubahan hanya berlaku sementara di browser.</span></div>}
      {error && <div className="indicator-demo-note" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}

      <div className="indicator-summary">
        <div><span>Total indikator</span><strong>{loading ? '…' : indicators.length}</strong></div>
        <div><span>Unit terdaftar</span><strong>{units.length}</strong></div>
      </div>

      <div className="indicator-toolbar">
        <label className="indicator-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode, nama, atau definisi" /></label>
        <label className="indicator-filter"><span className="sr-only">Filter unit</span><select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="all">Semua unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        <span className="indicator-result-count">{filteredIndicators.length} indikator</span>
        <button className="primary-button" type="button" onClick={openCreate} disabled={saving}><Plus size={16} /> Tambah indikator</button>
      </div>

      {notice && <div className="indicator-success" role="status"><Check size={15} />{notice}</div>}

      <div className="indicator-table-wrap" ref={tableWrapRef} style={tableMaxHeight ? { maxHeight: `${tableMaxHeight}px` } : undefined}>
        <table className="indicator-table">
          <thead><tr><th>KODE</th><th>UNIT / JENIS PELAYANAN</th><th>INDIKATOR &amp; DEFINISI</th><th>STANDAR</th><th>BERLAKU</th><th>STATUS</th><th><span className="sr-only">Aksi</span></th></tr></thead>
          <tbody>{filteredIndicators.map((indicator) => {
            const owner = units.find((unit) => unit.id === indicator.unitId)
            const writable = canWriteIndicator(indicator)
            return <tr key={indicator.id ?? indicator.code}>
              <td className="indicator-code">{indicator.code}</td>
              <td>{owner?.name ?? 'Unit belum dipilih'}</td>
              <td className="catalog-name"><strong>{indicator.name}</strong><small>{indicator.definition}</small></td>
              <td className="catalog-standard">{indicator.standard}</td>
              <td>{indicator.effectiveYear}</td>
              <td><button className={`active-toggle${indicator.enabled ? ' is-enabled' : ''}${writable ? '' : ' is-readonly'}`} type="button" role="switch" aria-checked={indicator.enabled} disabled={!writable || saving} onClick={() => void toggleIndicator(indicator)}><span />{indicator.enabled ? 'Aktif' : 'Nonaktif'}</button></td>
              <td className="indicator-actions">{writable ? <><button className="edit-indicator-button" type="button" aria-label={`Edit ${indicator.code}`} title="Edit indikator" onClick={() => openEdit(indicator)} disabled={saving}><Pencil size={14} /></button><button className="delete-indicator-button" type="button" aria-label={`Hapus ${indicator.code}`} title="Hapus indikator" onClick={() => setPendingDelete(indicator)} disabled={saving}><Trash2 size={14} /></button></> : <span className="indicator-readonly">—</span>}</td>
            </tr>
          })}</tbody>
        </table>
        {filteredIndicators.length === 0 && <div className="indicator-empty">{loading ? 'Memuat data indikator…' : 'Belum ada indikator. Tambahkan indikator pertama atau periksa data unit.'}</div>}
      </div>
      {tableMaxHeight && <div className="indicator-scroll-hint">Menampilkan {tablePreviewRows} indikator pertama — gulir di dalam tabel untuk melihat sisanya.</div>}

      <div className="indicator-footnote"><strong>Catatan master:</strong> perubahan standar sebaiknya memakai tahun/periode berlaku baru. Nilai periode sebelumnya tetap merujuk versi yang berlaku saat itu.</div>

      {dialog && <div className="indicator-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="indicator-modal" role="dialog" aria-modal="true" aria-labelledby="indicator-modal-title">
          <div className="indicator-modal-heading"><div><span className="eyebrow">MASTER INDIKATOR</span><h2 id="indicator-modal-title">{dialog === 'create' ? 'Tambah indikator' : 'Edit indikator'}</h2></div><button className="close-modal-button" type="button" onClick={() => setDialog(null)} aria-label="Tutup"><X size={18} /></button></div>
          <form className="indicator-form" onSubmit={saveIndicator}>
            <label>Unit / jenis pelayanan<select required value={form.unitId} onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
            <div className="indicator-form-grid"><label>Kode indikator<input required value={form.code} onChange={(event) => { setForm((current) => ({ ...current, code: event.target.value.toUpperCase() })); setFormError('') }} placeholder="Contoh: IGD-09" /></label><label>Tahun mulai berlaku<input required type="number" min="2000" max="2100" value={form.effectiveYear} onChange={(event) => setForm((current) => ({ ...current, effectiveYear: event.target.value }))} /></label></div>
            {formError && <div className="indicator-form-error" role="alert"><CircleAlert size={15} /><span>{formError}</span></div>}
            <label>Nama indikator<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Definisi operasional<textarea required rows={3} value={form.definition} onChange={(event) => setForm((current) => ({ ...current, definition: event.target.value }))} /></label>
            <div className="indicator-form-grid"><label>Standar<input required value={form.standard} onChange={(event) => setForm((current) => ({ ...current, standard: event.target.value }))} placeholder="Contoh: ≥ 80%" /></label><label>Rumus capaian<select value={form.calculation} onChange={(event) => setForm((current) => ({ ...current, calculation: event.target.value as IndicatorCalculation }))}>{Object.entries(calculationLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <div className="indicator-form-grid"><label>Satuan hasil<input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="%, menit, jam, tim" /></label>{form.calculation === 'scaled' ? <label>Pengali skala<input type="number" min="1" step="any" value={form.scale} onChange={(event) => setForm((current) => ({ ...current, scale: event.target.value }))} placeholder="Contoh: 1.000" /></label> : <div className="formula-preview"><span>HASIL CAPAIAN</span><strong>{form.calculation === 'percentage' ? 'Persentase' : form.calculation === 'average' ? `Rerata${form.unit ? ` (${form.unit})` : ''}` : form.calculation === 'direct' ? 'Nilai capaian langsung' : 'Nilai numerator'}</strong></div>}</div>
            {form.calculation === 'scaled' && <label>Satuan hasil skala<input value={form.resultUnit} onChange={(event) => setForm((current) => ({ ...current, resultUnit: event.target.value }))} placeholder="Contoh: per 1.000 pasien" /></label>}
            <div className="indicator-form-actions"><button className="secondary-button" type="button" onClick={() => setDialog(null)}>Batal</button><button className="primary-button" type="submit" disabled={saving || units.length === 0}><Check size={15} />{saving ? 'Menyimpan…' : 'Simpan indikator'}</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="indicators-toast" role="status">{toast}</div>}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus indikator"
        message={pendingDelete ? `Hapus indikator "${pendingDelete.code} — ${pendingDelete.name}"? Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmIcon={<Trash2 size={15} />}
        onConfirm={() => { const target = pendingDelete; setPendingDelete(null); if (target) void removeIndicator(target) }}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  )
}

export default IndicatorsPage