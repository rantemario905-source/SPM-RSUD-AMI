import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, CircleAlert, Plus, Save, TriangleAlert, Trash2, X } from 'lucide-react'
import { getSupabaseClient } from '../../lib/supabase'
import { formatHelperValue, helperRowResult, helperSummary, type HelperKind, type HelperSaveResult } from '../../lib/spm-helper'
import type { SupabaseClient } from '@supabase/supabase-js'

const helperPreviewRows = 15

interface HelperRow {
  key: string
  subject_name: string
  room: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
}

interface HelperRecordsModalProps {
  indicatorId: string
  indicatorName: string
  kind: HelperKind
  unitLabel: string
  unitId: string
  periodStart: string
  reportId: string | null
  userId: string | null
  minSample: number | null
  canEdit: boolean
  isPreview: boolean
  onClose: () => void
  onSaved: (result: HelperSaveResult) => void
}

let rowSequence = 0

function newRow(): HelperRow {
  return { key: `row-${++rowSequence}`, subject_name: '', room: '', start_date: '', start_time: '', end_date: '', end_time: '' }
}

function toRow(record: Record<string, unknown>): HelperRow {
  const text = (value: unknown) => (typeof value === 'string' ? value : '')
  return {
    key: `saved-${String(record.id ?? ++rowSequence)}`,
    subject_name: text(record.subject_name),
    room: text(record.room),
    start_date: text(record.start_date),
    start_time: text(record.start_time).slice(0, 5),
    end_date: text(record.end_date),
    end_time: text(record.end_time).slice(0, 5),
  }
}

function rowComplete(kind: HelperKind, row: HelperRow): boolean {
  if (!row.subject_name.trim() || !row.start_date) return false
  if (kind === 'date_span') return Boolean(row.end_date)
  return Boolean(row.start_time && row.end_time)
}

function HelperRecordsModal({ indicatorId, indicatorName, kind, unitLabel, unitId, periodStart, reportId, userId, minSample, canEdit, isPreview, onClose, onSaved }: HelperRecordsModalProps) {
  const client = getSupabaseClient()
  const [rows, setRows] = useState<HelperRow[]>([newRow()])
  const shouldLoad = !isPreview && Boolean(client) && Boolean(reportId)
  const [loading, setLoading] = useState(shouldLoad)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const tableWrapRef = useRef<HTMLDivElement | null>(null)
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!shouldLoad || !client || !reportId) return
    let active = true
    const supabase: SupabaseClient = client
    supabase.from('indicator_helper_records')
      .select('id, subject_name, room, start_date, start_time, end_date, end_time')
      .eq('report_id', reportId).eq('indicator_id', indicatorId)
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) setError(loadError.message)
        else {
          const records = (data ?? []).map(toRow)
          setRows(records.length ? records : [newRow()])
        }
        setLoading(false)
      })
    return () => { active = false }
  }, [client, shouldLoad, reportId, indicatorId])

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    function measureTable() {
      const wrap = tableWrapRef.current
      if (!wrap) return
      const bodyRows = wrap.querySelectorAll('tbody tr')
      if (bodyRows.length <= helperPreviewRows) { setTableMaxHeight(null); return }
      const firstHidden = bodyRows[helperPreviewRows] as HTMLElement | undefined
      if (!firstHidden) { setTableMaxHeight(null); return }
      const offset = firstHidden.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop
      const chrome = wrap.offsetHeight - wrap.clientHeight
      setTableMaxHeight(Math.max(0, Math.round(offset) + chrome))
    }
    measureTable()
    window.addEventListener('resize', measureTable)
    return () => window.removeEventListener('resize', measureTable)
  }, [rows, loading])

  const summary = useMemo(() => helperSummary(kind, unitLabel, rows), [kind, unitLabel, rows])
  const rowErrors = useMemo(() => rows.map((row) => helperRowResult(kind, unitLabel, row).error), [kind, unitLabel, rows])
  const shortOfSample = minSample !== null && summary.filled < minSample

  function updateRow(key: string, field: keyof HelperRow, value: string) {
    setSaved(false)
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setSaved(false)
    setRows((current) => [...current, newRow()])
  }

  function removeRow(key: string) {
    setSaved(false)
    setRows((current) => (current.length <= 1 ? [newRow()] : current.filter((row) => row.key !== key)))
  }

  async function save() {
    setError('')
    const touched = (row: HelperRow) => Boolean(row.subject_name.trim() || row.start_date || row.start_time || row.end_time || row.end_date || row.room.trim())
    const invalid = rows.some((row, index) => touched(row) && (!rowComplete(kind, row) || Boolean(rowErrors[index])))
    if (invalid) {
      setError('Lengkapi nama, tanggal, dan jam/tanggal selesai pada setiap baris (selesai tidak boleh lebih awal).')
      return
    }
    const usable = rows.filter((row) => rowComplete(kind, row))
    const totals = helperSummary(kind, unitLabel, usable)
    let currentReportId = reportId
    setSaving(true)
    try {
      if (!isPreview && client && canEdit) {
        const supabase: SupabaseClient = client
        if (!currentReportId && usable.length > 0) {
          if (!userId) throw new Error('Sesi pengguna tidak dikenali. Muat ulang halaman lalu coba lagi.')
          const { data: created, error: createError } = await supabase.from('reports')
            .insert({ unit_id: unitId, period_start: periodStart, created_by: userId })
            .select('id').single()
          if (createError) throw createError
          currentReportId = String(created.id)
        }
        if (currentReportId) {
          const recordsPayload = usable.map((row) => ({
            report_id: currentReportId,
            indicator_id: indicatorId,
            subject_name: row.subject_name.trim(),
            room: kind === 'date_span' ? row.room.trim() : '',
            start_date: row.start_date,
            start_time: kind === 'time_span' ? row.start_time : null,
            end_date: kind === 'date_span' ? row.end_date : null,
            end_time: kind === 'time_span' ? row.end_time : null,
            created_by: userId,
            updated_at: new Date().toISOString(),
          }))
          // ponytail: agregasi di klien; pindahkan ke trigger DB bila kelak ada penulis selain UI ini.
          const { error: clearError } = await supabase.from('indicator_helper_records')
            .delete().eq('report_id', currentReportId).eq('indicator_id', indicatorId)
          if (clearError) throw clearError
          if (recordsPayload.length > 0) {
            const { error: insertError } = await supabase.from('indicator_helper_records').insert(recordsPayload)
            if (insertError) throw insertError
          }
          const { data: existing, error: entryError } = await supabase.from('report_entries')
            .select('analysis, evidence_note').eq('report_id', currentReportId).eq('indicator_id', indicatorId).maybeSingle()
          if (entryError) throw entryError
          const { error: saveEntryError } = await supabase.from('report_entries').upsert({
            report_id: currentReportId,
            indicator_id: indicatorId,
            numerator: usable.length > 0 ? totals.total : null,
            denominator: usable.length > 0 ? totals.filled : null,
            result_text: null,
            analysis: typeof existing?.analysis === 'string' ? existing.analysis : '',
            evidence_note: typeof existing?.evidence_note === 'string' ? existing.evidence_note : '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'report_id,indicator_id' })
          if (saveEntryError) throw saveEntryError
        }
      }
      setSaved(true)
      const result: HelperSaveResult = {
        reportId: currentReportId ?? null,
        numerator: usable.length > 0 ? totals.total : null,
        denominator: usable.length > 0 ? totals.filled : null,
      }
      onSaved(result)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Data alat bantu gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="helper-modal" role="dialog" aria-modal="true" aria-labelledby="helper-modal-title">
        <div className="helper-modal-heading">
          <div><span className="eyebrow">ALAT BANTU PERHITUNGAN</span><h2 id="helper-modal-title">{indicatorName}</h2><small>{kind === 'date_span' ? 'Isi tanggal daftar dan tanggal dilayani. Hasil dihitung otomatis dalam hari.' : `Isi jam mulai dan jam selesai. Hasil dihitung otomatis dalam ${unitLabel || 'menit'}.`}</small></div>
          <button className="close-modal-button" type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        {error && <div className="indicator-form-error" role="alert"><CircleAlert size={15} /><span>{error}</span></div>}
        {!canEdit && <div className="input-demo-note">Mode lihat saja. Data alat bantu hanya dapat diubah untuk unit Anda pada periode terbuka.</div>}
        <div className="helper-table-wrap" ref={tableWrapRef} style={tableMaxHeight ? { maxHeight: `${tableMaxHeight}px` } : undefined}>
          <table className="helper-table">
            <thead><tr><th>NO</th><th>NAMA PASIEN / NO. RM</th>{kind === 'date_span' && <th>RUANGAN</th>}<th>TANGGAL</th>{kind === 'time_span' ? <><th>JAM MULAI</th><th>JAM SELESAI</th></> : <th>TANGGAL DILAYANI</th>}<th>HASIL</th><th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>{rows.map((row, index) => {
              const result = helperRowResult(kind, unitLabel, row)
              return <tr key={row.key}>
                <td className="helper-index">{index + 1}</td>
                <td><input aria-label={`Nama pasien / No. RM baris ${index + 1}`} value={row.subject_name} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'subject_name', event.target.value)} placeholder="Nama pasien / No. RM" /></td>
                {kind === 'date_span' && <td><input aria-label={`Ruangan baris ${index + 1}`} value={row.room} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'room', event.target.value)} placeholder="Ruangan" /></td>}
                <td><input aria-label={`Tanggal baris ${index + 1}`} type="date" value={row.start_date} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'start_date', event.target.value)} /></td>
                {kind === 'time_span'
                  ? <><td><input aria-label={`Jam mulai baris ${index + 1}`} type="time" value={row.start_time} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'start_time', event.target.value)} /></td>
                    <td><input aria-label={`Jam selesai baris ${index + 1}`} type="time" value={row.end_time} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'end_time', event.target.value)} /></td></>
                  : <td><input aria-label={`Tanggal dilayani baris ${index + 1}`} type="date" value={row.end_date} disabled={!canEdit || saving} onChange={(event) => updateRow(row.key, 'end_date', event.target.value)} /></td>}
                <td className="helper-result">{result.error ? <span className="helper-result-error">{result.error}</span> : <strong>{formatHelperValue(result.value, unitLabel)}</strong>}</td>
                <td>{canEdit && <button className="helper-remove" type="button" onClick={() => removeRow(row.key)} disabled={saving} aria-label={`Hapus baris ${index + 1}`}><Trash2 size={13} /></button>}</td>
              </tr>
            })}</tbody>
          </table>
          {loading && <div className="helper-empty">Memuat data pasien…</div>}
        </div>
        {tableMaxHeight && <div className="indicator-scroll-hint">Menampilkan {helperPreviewRows} baris pertama — gulir di dalam tabel untuk melihat sisanya.</div>}
        {shortOfSample && <div className="helper-sample-warning" role="status"><TriangleAlert size={14} /><span>Sampel baru {summary.filled} dari minimal {minSample} — lengkapi sebelum periode ditutup. Data tetap boleh disimpan.</span></div>}
        <div className="helper-footer">
          <div className="helper-summary">
            <span>Sampel: <strong>{summary.filled}{minSample !== null ? ` / minimal ${minSample}` : ''}</strong></span>
            <span>Total: <strong>{formatHelperValue(summary.total, unitLabel)}</strong></span>
            <span>Rata-rata: <strong>{formatHelperValue(summary.average, unitLabel)}</strong></span>
          </div>
          <div className="helper-actions">
            {canEdit && <button className="secondary-button" type="button" onClick={addRow} disabled={saving}><Plus size={14} /> Tambah baris</button>}
            <button className="secondary-button" type="button" onClick={onClose}>Tutup</button>
            {canEdit && <button className="primary-button" type="button" onClick={() => void save()} disabled={saving || loading}><Save size={14} /> {saving ? 'Menyimpan…' : saved ? 'Tersimpan' : 'Simpan'}{saved && <Check size={14} />}</button>}
          </div>
        </div>
        <p className="helper-note">Nilai Jumlah/Total pada laporan akan diperbarui otomatis dari tabel ini. Menyimpan ulang menimpa koreksi manual sebelumnya.</p>
      </section>
    </div>
  )
}

export default HelperRecordsModal
