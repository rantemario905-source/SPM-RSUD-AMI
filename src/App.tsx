import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from './auth/AuthContext'
import { allowedPages } from './lib/access'
import { useRouter } from './lib/routerContext'
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
import './styles/app.css'

function App() {
  const { route, navigate } = useRouter()
  const auth = useAuth()
  const client = getSupabaseClient()
  const progress = useProgress()
  const firstRender = useRef(true)
  const allowed = useMemo(() => allowedPages(auth.role, auth.permissions, auth.isPreview), [auth.role, auth.permissions, auth.isPreview])
  const page = route !== 'login' && allowed.includes(route) ? route : 'dashboard'

  useEffect(() => {
    if (!client || auth.isPreview) return
    void client.rpc('spm_ensure_periods')
      .then(() => client.rpc('spm_lock_past_periods'), () => undefined)
      .then(() => undefined, () => undefined)
  }, [client, auth.isPreview])

  useEffect(() => {
    if (route === 'login' || route === page) return
    navigate('dashboard', { replace: true })
  }, [route, page, navigate])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    progress.start()
    const timer = window.setTimeout(() => progress.done(), 520)
    return () => window.clearTimeout(timer)
  }, [page, progress])

  const goTo = (next: typeof page) => navigate(next)

  return (
    <AppShell activePage={page} onNavigate={goTo}>
      {page === 'dashboard' && <DashboardPage onNavigate={goTo} />}
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
