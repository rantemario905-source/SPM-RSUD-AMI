import { useMemo, useState, type FormEvent } from 'react'
import { Check, CircleAlert, Pencil, Plus, Search, X } from 'lucide-react'
import { sampleUnits, type IndicatorCalculation, type IndicatorEntry } from '../../data/sample-indicators'
import './IndicatorsPage.css'

interface CatalogIndicator extends IndicatorEntry {
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
}

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

function IndicatorsPage() {
  const [indicators, setIndicators] = useState(initialCatalog)
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [calculationFilter, setCalculationFilter] = useState('all')
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [form, setForm] = useState<IndicatorForm>(emptyForm)
  const [notice, setNotice] = useState('')

  const filteredIndicators = useMemo(() => indicators.filter((indicator) => {
    const matchesText = `${indicator.code} ${indicator.name} ${indicator.definition}`.toLowerCase().includes(query.toLowerCase())
    const matchesUnit = unitFilter === 'all' || indicator.unitId === unitFilter
    const matchesCalculation = calculationFilter === 'all' || indicator.calculation === calculationFilter
    return matchesText && matchesUnit && matchesCalculation
  }), [indicators, query, unitFilter, calculationFilter])

  function openCreate() {
    setEditingCode(null)
    setForm(emptyForm)
    setNotice('')
    setDialog('create')
  }

  function openEdit(indicator: CatalogIndicator) {
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
    setDialog('edit')
  }

  function saveIndicator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const unit = sampleUnits.find((item) => item.id === form.unitId)
    if (!unit) return

    const changed: CatalogIndicator = {
      code: form.code.trim(),
      name: form.name.trim(),
      definition: form.definition.trim(),
      standard: form.standard.trim(),
      type: form.calculation === 'average' ? 'duration' : form.calculation === 'numerator' ? 'number' : 'ratio',
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
      enabled: true,
    }

    if (dialog === 'edit' && editingCode) {
      setIndicators((current) => current.map((item) => item.code === editingCode ? changed : item))
    } else {
      setIndicators((current) => [...current, changed])
    }

    setNotice(`${changed.code} ${dialog === 'edit' ? 'diperbarui' : 'ditambahkan'} di simulasi.`)
    setDialog(null)
  }

  function toggleIndicator(code: string) {
    setIndicators((current) => current.map((item) => item.code === code ? { ...item, enabled: !item.enabled } : item))
  }

  return (
    <section className="indicators-page">
      <div className="indicators-heading">
        <div><span className="eyebrow">PENGELOLAAN DATA</span><h1>Indikator SPM</h1><p>Master indikator, standar, definisi operasional, dan jenis input per unit.</p></div>
        <button className="primary-button" type="button" onClick={openCreate}><Plus size={16} /> Tambah indikator</button>
      </div>

      <div className="indicator-demo-note"><CircleAlert size={16} /><span><strong>Mode simulasi.</strong> Tambah, edit, dan status aktif hanya berlaku sementara di browser. Setiap indikator memakai kolom numerator dan denominator; rumus capaian diatur per indikator.</span></div>

      <div className="indicator-summary">
        <div><span>Total indikator</span><strong>{indicators.length}</strong></div>
        <div><span>Unit dicontohkan</span><strong>{sampleUnits.length}</strong></div>
        <div><span>Rumus capaian</span><strong>4</strong></div>
      </div>

      <div className="indicator-toolbar">
        <label className="indicator-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode, nama, atau definisi" /></label>
        <label className="indicator-filter"><span className="sr-only">Filter unit</span><select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="all">Semua unit</option>{sampleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
        <label className="indicator-filter"><span className="sr-only">Filter rumus capaian</span><select value={calculationFilter} onChange={(event) => setCalculationFilter(event.target.value)}><option value="all">Semua rumus capaian</option>{Object.entries(calculationLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <span className="indicator-result-count">{filteredIndicators.length} indikator</span>
      </div>

      {notice && <div className="indicator-success" role="status"><Check size={15} />{notice}</div>}

      <div className="indicator-table-wrap">
        <table className="indicator-table">
          <thead><tr><th>KODE</th><th>UNIT / JENIS PELAYANAN</th><th>INDIKATOR &amp; DEFINISI</th><th>STANDAR</th><th>RUMUS CAPAIAN</th><th>BERLAKU</th><th>STATUS</th><th><span className="sr-only">Aksi</span></th></tr></thead>
          <tbody>{filteredIndicators.map((indicator) => {
            const owner = sampleUnits.find((unit) => unit.id === indicator.unitId)
            return <tr key={indicator.code}>
              <td className="indicator-code">{indicator.code}</td>
              <td>{owner?.name ?? 'Unit belum dipilih'}</td>
              <td className="catalog-name"><strong>{indicator.name}</strong><small>{indicator.definition}</small></td>
              <td className="catalog-standard">{indicator.standard}</td>
              <td><span className="input-type-tag">{calculationLabel[getCalculation(indicator)]}</span></td>
              <td>{indicator.effectiveYear}</td>
              <td><button className={`active-toggle${indicator.enabled ? ' is-enabled' : ''}`} type="button" role="switch" aria-checked={indicator.enabled} onClick={() => toggleIndicator(indicator.code)}><span />{indicator.enabled ? 'Aktif' : 'Nonaktif'}</button></td>
              <td><button className="edit-indicator-button" type="button" aria-label={`Edit ${indicator.code}`} onClick={() => openEdit(indicator)}><Pencil size={14} /></button></td>
            </tr>
          })}</tbody>
        </table>
        {filteredIndicators.length === 0 && <div className="indicator-empty">Tidak ada indikator yang cocok dengan filter.</div>}
      </div>

      <div className="indicator-footnote"><strong>Catatan master:</strong> perubahan standar sebaiknya memakai tahun/periode berlaku baru. Nilai periode sebelumnya tetap merujuk versi yang berlaku saat itu.</div>

      {dialog && <div className="indicator-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="indicator-modal" role="dialog" aria-modal="true" aria-labelledby="indicator-modal-title">
          <div className="indicator-modal-heading"><div><span className="eyebrow">MASTER INDIKATOR</span><h2 id="indicator-modal-title">{dialog === 'create' ? 'Tambah indikator' : 'Edit indikator'}</h2></div><button className="close-modal-button" type="button" onClick={() => setDialog(null)} aria-label="Tutup"><X size={18} /></button></div>
          <form className="indicator-form" onSubmit={saveIndicator}>
            <label>Unit / jenis pelayanan<select required value={form.unitId} onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}>{sampleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
            <div className="indicator-form-grid"><label>Kode indikator<input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="Contoh: IGD-09" /></label><label>Tahun mulai berlaku<input required type="number" min="2000" max="2100" value={form.effectiveYear} onChange={(event) => setForm((current) => ({ ...current, effectiveYear: event.target.value }))} /></label></div>
            <label>Nama indikator<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Definisi operasional<textarea required rows={3} value={form.definition} onChange={(event) => setForm((current) => ({ ...current, definition: event.target.value }))} /></label>
            <div className="indicator-form-grid"><label>Standar<input required value={form.standard} onChange={(event) => setForm((current) => ({ ...current, standard: event.target.value }))} placeholder="Contoh: ≥ 80%" /></label><label>Rumus capaian<select value={form.calculation} onChange={(event) => setForm((current) => ({ ...current, calculation: event.target.value as IndicatorCalculation }))}>{Object.entries(calculationLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <div className="indicator-form-grid"><label>Satuan hasil<input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="%, menit, jam, tim" /></label>{form.calculation === 'scaled' ? <label>Pengali skala<input type="number" min="1" step="any" value={form.scale} onChange={(event) => setForm((current) => ({ ...current, scale: event.target.value }))} placeholder="Contoh: 1.000" /></label> : <div className="formula-preview"><span>HASIL CAPAIAN</span><strong>{form.calculation === 'percentage' ? 'Persentase' : form.calculation === 'average' ? `Rerata${form.unit ? ` (${form.unit})` : ''}` : 'Nilai numerator'}</strong></div>}</div>
            {form.calculation === 'scaled' && <label>Satuan hasil skala<input value={form.resultUnit} onChange={(event) => setForm((current) => ({ ...current, resultUnit: event.target.value }))} placeholder="Contoh: per 1.000 pasien" /></label>}
            <div className="indicator-form-actions"><button className="secondary-button" type="button" onClick={() => setDialog(null)}>Batal</button><button className="primary-button" type="submit"><Check size={15} />Simpan simulasi</button></div>
          </form>
        </section>
      </div>}
    </section>
  )
}

export default IndicatorsPage