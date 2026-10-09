import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import logoRsudAmi from '../assets/logo-rsud-ami.png'
import { useProgress } from '../components/feedback/progressContext'
import { AuthContext } from './AuthContext'
import { getSupabaseClient } from '../lib/supabase'
import './AuthGate.css'

interface AuthGateProps { children: ReactNode }

function AuthGate({ children }: AuthGateProps) {
  const client = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<{ id: string; role: string; permissions: Record<string, boolean> } | null>(null)
  const [loading, setLoading] = useState(Boolean(client))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const progress = useProgress()

  useEffect(() => {
    if (loading || submitting) progress.start()
    else progress.done()
  }, [loading, submitting, progress])

  useEffect(() => {
    if (!client) return
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    if (!client || !session?.user.id) return
    let active = true
    const userId = session.user.id
    void client.from('profiles').select('role, permissions').eq('id', userId).maybeSingle()
      .then(({ data }) => {
        if (!active) return
        const row = data as { role: string; permissions: Record<string, boolean> } | null
        setProfile(row ? { id: userId, role: row.role, permissions: row.permissions } : null)
      })
    return () => { active = false }
  }, [client, session])

  const activeProfile = profile && session?.user.id === profile.id ? profile : null
  const role = activeProfile?.role ?? null
  const permissions = activeProfile?.permissions ?? null

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setError('')
    setSubmitting(true)
    const { error: loginError } = await client.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (loginError) setError('Email atau kata sandi tidak sesuai. Periksa kembali atau hubungi administrator.')
  }

  async function signOut() {
    if (client) await client.auth.signOut()
  }

  if (!client) {
    return <AuthContext.Provider value={{ isPreview: true, email: null, userId: null, role: null, permissions: null, signOut: async () => undefined }}>{children}</AuthContext.Provider>
  }

  if (loading) return <div className="auth-loading" role="status">Memeriksa sesi pengguna...</div>

  if (!session) {
    return (
      <main className="auth-page">
        <section className="login-panel">
          <div className="login-brand"><span className="login-mark"><img src={logoRsudAmi} alt="Logo RSUD AMI" /></span><span><strong>RSUD AMI</strong><small>PELAPORAN SPM</small></span></div>
          <h1>STANDAR PELAYANAN MINIMAL</h1>
          <p>----Masukkan Email &amp; Kata Sandi Anda----</p>
          <form className="login-form" onSubmit={handleLogin}>
            <label>Email<input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Kata sandi<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={submitting}><LockKeyhole size={16} />{submitting ? 'Memeriksa...' : 'MASUK'}</button>
          </form>
          <div className="login-footnote"><ShieldCheck size={15} />Akses laporan dibatasi sesuai peran dan unit pengguna.</div>
        </section>
      </main>
    )
  }

  return <AuthContext.Provider value={{ isPreview: false, email: session.user.email ?? null, userId: session.user.id, role, permissions, signOut }}>{children}</AuthContext.Provider>
}

export default AuthGate