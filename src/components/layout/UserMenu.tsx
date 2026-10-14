import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import './UserMenu.css'

const roleNames: Record<string, string> = {
  admin: 'Administrator', officer: 'Kepala Ruangan', unit_head: 'Kepala Instalasi', leadership: 'Pimpinan',
}

interface UserMenuProps { onRequestLogout: () => void }

function initialsOf(name: string) {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
  return letters.toUpperCase() || 'RS'
}

function UserMenu({ onRequestLogout }: UserMenuProps) {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const roleLabel = auth.isPreview ? 'Pratinjau' : roleNames[auth.role ?? ''] ?? 'Pengguna'
  const name = (auth.fullName?.trim() || auth.email?.split('@')[0] || 'Pratinjau')

  return (
    <div className="user-menu" ref={wrapper}>
      <button className="user-menu-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} aria-label={`Menu pengguna ${name}`}>
        <span className="user-role-badge role-value">{roleLabel}</span>
        <span className="user-chip">
          <span className="user-avatar">{initialsOf(name)}</span>
          <span className="user-name">{name}</span>
          <ChevronDown size={15} className="user-menu-caret" />
        </span>
      </button>
      {open && <div className="user-menu-panel" role="menu" aria-label="Menu pengguna">
        <div className="user-menu-head"><strong>{name}</strong><small>{roleLabel}</small></div>
        <button className="user-menu-item" type="button" role="menuitem" onClick={() => { setOpen(false); onRequestLogout() }}><LogOut size={15} /> Log Out</button>
      </div>}
    </div>
  )
}

export default UserMenu
