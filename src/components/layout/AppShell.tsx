import type { ReactNode } from 'react'
import { Activity, BarChart3, CalendarClock, ClipboardList, FileSpreadsheet, History, LayoutDashboard, LogOut, Settings2, ShieldCheck, Table2, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { allowedPages } from '../../lib/access'
import NotificationBell from './NotificationBell'
import logoRsudAmi from '../../assets/logo-rsud-ami.png'
import type { AppPage } from '../../types/spm'
import './AppShell.css'

const roleNames: Record<string, string> = {
  admin: 'Administrator', officer: 'Petugas unit', unit_head: 'Kepala unit', quality: 'Mutu', leadership: 'Pimpinan',
}

interface AppShellProps { activePage: AppPage; onNavigate: (page: AppPage) => void; children: ReactNode }

const navigation: { section: string; items: { id: AppPage; label: string; icon: typeof Activity }[] }[] = [
  { section: 'RUANG KERJA', items: [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'entry', label: 'Input laporan', icon: ClipboardList },
    { id: 'reports', label: 'Rekap & unduh', icon: FileSpreadsheet },
    { id: 'crossunit', label: 'Rekap lintas unit', icon: Table2 },
  ] },
  { section: 'PENGELOLAAN', items: [
    { id: 'indicators', label: 'Indikator SPM', icon: BarChart3 },
    { id: 'periods', label: 'Periode', icon: CalendarClock },
    { id: 'audit', label: 'Perubahan', icon: History },
    { id: 'users', label: 'Unit & pengguna', icon: Users },
  ] },
]

function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const activeLabel = navigation.flatMap((group) => group.items).find((item) => item.id === activePage)?.label ?? 'Ringkasan'
  const auth = useAuth()
  const displayName = auth.email?.split('@')[0] ?? 'Pratinjau'
  const visiblePages = allowedPages(auth.role, auth.isPreview)
  const visibleGroups = navigation
    .map((group) => ({ ...group, items: group.items.filter((item) => visiblePages.includes(item.id)) }))
    .filter((group) => group.items.length > 0)
  const roleLabel = auth.isPreview ? 'Pratinjau' : roleNames[auth.role ?? ''] ?? 'Pengguna'

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => onNavigate('dashboard')} aria-label="Ke ringkasan SPM"><span className="brand-mark"><img src={logoRsudAmi} alt="Logo RSUD AMI" /></span><span className="brand-copy"><strong>RSUD AMI</strong><small>STANDAR PELAYANAN MINIMAL</small></span></button>
        <nav className="side-navigation" aria-label="Navigasi utama">
          {visibleGroups.map((group) => <div className="nav-group" key={group.section}>
            <p className="nav-section-label">{group.section}</p>
            {group.items.map(({ id, label, icon: Icon }) => <button className={`nav-link${activePage === id ? ' is-active' : ''}`} key={id} type="button" onClick={() => onNavigate(id)} aria-current={activePage === id ? 'page' : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={17} /><span>{auth.isPreview ? 'Mode simulasi' : 'Sesi terlindungi'}<br /><strong>{auth.isPreview ? 'Data contoh saja' : 'Pengguna terautentikasi'}</strong></span></div><button className="profile-button" type="button" onClick={() => void auth.signOut()} aria-label="Keluar dari akun"><span className="profile-avatar">{displayName.slice(0, 2).toUpperCase()}</span><span className="profile-copy"><strong>{displayName}</strong><small>{roleLabel}</small></span>{!auth.isPreview && <LogOut size={16} />}</button></div>
      </aside>
      <div className="main-column">
        <header className="topbar"><div className="breadcrumb"><span>SPM RSUD</span><span className="breadcrumb-divider">/</span><strong>{activeLabel}</strong></div><div className="topbar-actions"><span className={`preview-pill${auth.isPreview ? '' : ' session-pill'}`}><span />{auth.isPreview ? 'MODE PRATINJAU' : 'SESI AKTIF'}</span><NotificationBell onNavigate={onNavigate} /></div></header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>RSUD AMI · Pelaporan Standar Pelayanan Minimal</span><span><Settings2 size={13} /> Sistem internal</span></footer>
      </div>
    </div>
  )
}

export default AppShell