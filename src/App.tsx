import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { allowedPages } from './lib/access'
import { getSupabaseClient } from './lib/supabase'
import AppShell from './components/layout/AppShell'
import { useProgress } from './components/feedback/progressContext'
import AuditPage from './features/audit/AuditPage'
import DashboardPage from './features/dashboard/DashboardPage'
import IndicatorsPage from './features/indicators/IndicatorsPage'
import InputReportPage from './features/reports/InputReportPage'
import ReportsPage from './features/reports/ReportsPage'
import CrossUnitPage from './features/reports/CrossUnitPage'
import PeriodsPage from './features/settings/PeriodsPage'
import UsersPage from './features/users/UsersPage'
import type { AppPage } from './types/spm'
import './styles/app.css'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const auth = useAuth()
  const client = getSupabaseClient()
  const progress = useProgress()
  const firstRender = useRef(true)
  const allowed = useMemo(() => allowedPages(auth.role, auth.isPreview), [auth.role, auth.isPreview])

  useEffect(() => {
    if (!client || auth.isPreview) return
    void client.rpc('spm_ensure_periods')
      .then(() => client.rpc('spm_lock_past_periods'), () => undefined)
      .then(() => undefined, () => undefined)
  }, [client, auth.isPreview])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    progress.start()
    const timer = window.setTimeout(() => progress.done(), 520)
    return () => window.clearTimeout(timer)
  }, [activePage, progress])

  const page = allowed.includes(activePage) ? activePage : 'dashboard'

  return (
    <AppShell activePage={page} onNavigate={setActivePage}>
      {page === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
      {page === 'reports' && <ReportsPage />}
      {page === 'crossunit' && <CrossUnitPage />}
      {page === 'entry' && <InputReportPage />}
      {page === 'periods' && <PeriodsPage />}
      {page === 'audit' && <AuditPage />}
      {page === 'indicators' && <IndicatorsPage />}
      {page === 'users' && <UsersPage />}
    </AppShell>
  )
}

export default App
