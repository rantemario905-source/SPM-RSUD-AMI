import { useEffect, useRef, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { getSupabaseClient } from './lib/supabase'
import AppShell from './components/layout/AppShell'
import { useProgress } from './components/feedback/progressContext'
import AuditPage from './features/audit/AuditPage'
import DashboardPage from './features/dashboard/DashboardPage'
import IndicatorsPage from './features/indicators/IndicatorsPage'
import InputReportPage from './features/reports/InputReportPage'
import ReportsPage from './features/reports/ReportsPage'
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

  useEffect(() => {
    if (!client || auth.isPreview) return
    void client.rpc('spm_lock_past_periods').then(() => undefined, () => undefined)
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

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
      {activePage === 'reports' && <ReportsPage />}
      {activePage === 'entry' && <InputReportPage />}
      {activePage === 'periods' && <PeriodsPage />}
      {activePage === 'audit' && <AuditPage />}
      {activePage === 'indicators' && <IndicatorsPage />}
      {activePage === 'users' && <UsersPage />}
    </AppShell>
  )
}

export default App
