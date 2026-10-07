import { useState } from 'react'
import AppShell from './components/layout/AppShell'
import AuditPage from './features/audit/AuditPage'
import DashboardPage from './features/dashboard/DashboardPage'
import IndicatorsPage from './features/indicators/IndicatorsPage'
import InputReportPage from './features/reports/InputReportPage'
import ReportsPage from './features/reports/ReportsPage'
import PeriodsPage from './features/settings/PeriodsPage'
import type { AppPage } from './types/spm'
import './styles/app.css'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard')

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
      {activePage === 'reports' && <ReportsPage />}
      {activePage === 'entry' && <InputReportPage />}
      {activePage === 'periods' && <PeriodsPage />}
      {activePage === 'audit' && <AuditPage />}
      {activePage === 'indicators' && <IndicatorsPage />}
      {activePage === 'users' && (
        <section className="coming-soon">
          <span className="eyebrow">AKSES APLIKASI</span>
          <h1>Unit &amp; Pengguna</h1>
          <p>Pengaturan akun dan pembagian akses per unit akan tersedia setelah Supabase dikonfigurasi.</p>
          <div className="coming-soon-note">Jangan gunakan data simulasi ini untuk laporan resmi.</div>
        </section>
      )}
    </AppShell>
  )
}

export default App
