import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
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
  const [recovery, setRecovery] = useState(() => typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [notice, setNotice] = useState('')
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
    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
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

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setRecoveryError('')
    if (newPassword.length < 8) { setRecoveryError('Kata sandi minimal 8 karakter.'); return }
    if (newPassword !== confirmPassword) { setRecoveryError('Konfirmasi kata sandi tidak sama.'); return }
    setSubmitting(true)
    const { error: updateError } = await client.auth.updateUser({ password: newPassword })
    setSubmitting(false)
    if (updateError) { setRecoveryError(updateError.message); return }
    setNewPassword('')
    setConfirmPassword('')
    setRecovery(false)
    setNotice('Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.')
    if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
    await client.auth.signOut()
  }

  if (!client) {
    return <AuthContext.Provider value={{ isPreview: true, email: null, userId: null, role: null, permissions: null, signOut: async () => undefined }}>{children}</AuthContext.Provider>
  }

  if (loading) return <div className="auth-loading" role="status">Memeriksa sesi pengguna...</div>

  if (recovery && session) {
    return (
      <main className="auth-page">
        <section className="login-panel">
          <div className="login-brand"><span className="login-mark"><img src={logoRsudAmi} alt="Logo RSUD AMI" /></span><span><strong>RSUD AMI</strong><small>PELAPORAN SPM</small></span></div>
          <h1>ATUR ULANG KATA SANDI</h1>
          <p>----Masukkan Kata Sandi Baru Anda----</p>
          <form className="login-form" onSubmit={handleUpdatePassword}>
            <label>Kata sandi baru<input autoComplete="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
            <label>Konfirmasi kata sandi<input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            {recoveryError && <p className="login-error" role="alert">{recoveryError}</p>}
            <button className="login-submit" type="submit" disabled={submitting}><KeyRound size={16} />{submitting ? 'Menyimpan...' : 'SIMPAN KATA SANDI'}</button>
          </form>
          <div className="login-footnote"><ShieldCheck size={15} />Gunakan kata sandi yang kuat dan mudah Anda ingat.</div>
        </section>
      </main>
    )
  }

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
            {notice && <p className="login-notice" role="status">{notice}</p>}
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