import { useEffect, useRef, useState } from 'react'
import { Bell, CircleAlert, Info } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { loadIndicators, loadPeriods, loadProfile, loadUnits, periodLabel } from '../../lib/spm-data'
import { achievement, formatValue, meetsStandard, parseTarget } from '../../lib/spm-achievement'
import type { AppPage } from '../../types/spm'
import './NotificationBell.css'

interface NotificationBellProps { onNavigate: (page: AppPage) => void }
interface NotificationItem { id: string; tone: 'danger' | 'warning' | 'info'; title: string; detail: string; target: AppPage }

const previewNotifications: NotificationItem[] = [
  { id: 'p1', tone: 'danger', title: 'Radiologi belum mengisi', detail: 'Oktober 2026 · belum ada input', target: 'entry' },
  { id: 'p2', tone: 'warning', title: 'Farmasi belum lengkap', detail: '10 dari 13 indikator · Oktober 2026', target: 'entry' },
  { id: 'p3', tone: 'warning', title: 'Gawat Darurat: waktu tanggap di bawah standar', detail: 'Capaian 6 vs standar ≤ 5 menit', target: 'reports' },
  { id: 'p4', tone: 'info', title: 'Periode Oktober 2026 akan dikunci', detail: 'dalam 22 hari', target: 'periods' },
]

const toneIcon = { danger: CircleAlert, warning: CircleAlert, info: Info }

function NotificationBell({ onNavigate }: NotificationBellProps) {
  const auth = useAuth()
  const client = getSupabaseClient()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>(auth.isPreview ? previewNotifications : [])
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!client || auth.isPreview || !auth.userId) return
    const supabase = client
    let active = true
    async function loadNotifications() {
      const [profile, periods, allUnits, allIndicators] = await Promise.all([
        loadProfile(supabase, auth.userId as string),
        loadPeriods(supabase),
        loadUnits(supabase),
        loadIndicators(supabase),
      ])
      if (!active) return
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const currentPeriod = periods.find((period) => period.period_start === monthStart) ?? periods.find((period) => period.state === 'open') ?? periods[0]
      const scopedUnits = profile.unit_id ? allUnits.filter((unit) => unit.id === profile.unit_id) : allUnits
      const activeIndicators = allIndicators.filter((indicator) => indicator.active)
      const next: NotificationItem[] = []

      if (currentPeriod) {
        const reports = scopedUnits.length
          ? (await supabase.from('reports').select('id, unit_id').eq('period_start', currentPeriod.period_start).in('unit_id', scopedUnits.map((unit) => unit.id))).data ?? []
          : []
        const reportIds = reports.map((report) => report.id)
        const entries = reportIds.length
          ? (await supabase.from('report_entries').select('report_id, indicator_id, numerator, denominator, analysis').in('report_id', reportIds)).data ?? []
          : []
        if (!active) return
        const reportByUnit = new Map(reports.map((report) => [report.unit_id, report]))
        const entriesByReport = new Map<string, typeof entries>()
        for (const entry of entries) entriesByReport.set(entry.report_id, [...(entriesByReport.get(entry.report_id) ?? []), entry])
        const inPeriod = periodLabel(currentPeriod.period_start)

        let incomplete = 0
        let belowStandard = 0
        for (const unit of scopedUnits) {
          const report = reportByUnit.get(unit.id)
          const reportEntries = report ? entriesByReport.get(report.id) ?? [] : []
          const unitIndicators = activeIndicators.filter((indicator) => indicator.unit_id === null || indicator.unit_id === unit.id)
          const completed = reportEntries.filter((entry) => entry.numerator !== null && entry.denominator !== null && entry.analysis.trim()).length
          if (unitIndicators.length && completed < unitIndicators.length) {
            incomplete += 1
            if (incomplete <= 4) {
              const missing = unitIndicators.length - completed
              next.push({
                id: `unit-${unit.id}`,
                tone: completed === 0 ? 'danger' : 'warning',
                title: completed === 0 ? `${unit.name} belum mengisi` : `${unit.name} belum lengkap`,
                detail: completed === 0 ? `${inPeriod} · belum ada input` : `${missing} dari ${unitIndicators.length} indikator · ${inPeriod}`,
                target: 'entry',
              })
            }
          }
          const entryByIndicator = new Map(reportEntries.map((entry) => [entry.indicator_id, entry]))
          for (const indicator of unitIndicators) {
            const entry = entryByIndicator.get(indicator.id)
            if (!entry) continue
            const target = parseTarget(indicator.standard)
            const value = achievement(entry, indicator)
            if (!target || value === null) continue
            const failing = !meetsStandard(value, target)
            if (!failing) continue
            belowStandard += 1
            if (belowStandard <= 4) {
              next.push({
                id: `std-${unit.id}-${indicator.id}`,
                tone: 'warning',
                title: `${unit.name}: ${indicator.name} di bawah standar`,
                detail: `Capaian ${formatValue(value)} vs standar ${indicator.standard}`,
                target: 'reports',
              })
            }
          }
        }

        const periodTarget: AppPage = auth.role === 'admin' ? 'periods' : 'reports'
        if (currentPeriod.state === 'locked') {
          next.push({ id: 'period-locked', tone: 'info', title: `Periode ${inPeriod} terkunci`, detail: 'Data hanya bisa dikoreksi sesuai izin.', target: periodTarget })
        } else {
          const end = new Date(`${currentPeriod.period_end}T00:00:00`)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const days = Math.round((end.getTime() - today.getTime()) / 86400000)
          if (days >= 0 && days <= 7) {
            next.push({ id: 'period-soon', tone: 'info', title: `Periode ${inPeriod} akan dikunci`, detail: `dalam ${days} hari`, target: periodTarget })
          }
        }
      }

      if (active) setItems(next)
    }
    void loadNotifications().catch(() => { if (active) setItems([]) })
    return () => { active = false }
  }, [client, auth.isPreview, auth.userId, auth.role])

  const alertCount = items.filter((item) => item.tone !== 'info').length

  function goTo(page: AppPage) {
    setOpen(false)
    onNavigate(page)
  }

  return (
    <div className="notification-bell" ref={wrapper}>
      <button className="icon-button notification-button" type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifikasi${alertCount ? `, ${alertCount} perlu perhatian` : ''}`} aria-expanded={open}>
        <Bell size={18} />
        {alertCount > 0 && <i className="notification-badge">{alertCount}</i>}
      </button>
      {open && <div className="notification-panel" role="dialog" aria-label="Daftar notifikasi">
        <div className="notification-head"><strong>Notifikasi</strong><span>{items.length}</span></div>
        <div className="notification-list">
          {items.map((item) => { const Icon = toneIcon[item.tone]; return <button className={`notification-item tone-${item.tone}`} key={item.id} type="button" onClick={() => goTo(item.target)}><span className="notification-item-icon"><Icon size={15} /></span><span className="notification-item-copy"><strong>{item.title}</strong><small>{item.detail}</small></span></button> })}
          {items.length === 0 && <p className="notification-empty">{auth.isPreview ? 'Simulasi notifikasi.' : 'Tidak ada notifikasi. Semua periode terkini sudah lengkap.'}</p>}
        </div>
      </div>}
    </div>
  )
}

export default NotificationBell
