import { createClient } from 'npm:@supabase/supabase-js@2'

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Tidak terautentikasi.' })

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anonKey || !serviceKey) return json(500, { error: 'Konfigurasi Supabase tidak lengkap.' })

  const anon = createClient(url, anonKey)
  const { data: { user }, error: userError } = await anon.auth.getUser(token)
  if (userError || !user) return json(401, { error: 'Sesi tidak valid.' })

  const { data: profile } = await anon.from('profiles').select('role, permissions').eq('id', user.id).maybeSingle()
  const permissions = (profile?.permissions ?? {}) as Record<string, boolean>
  const canManage = profile?.role === 'admin' || Boolean(permissions.manage_users)
  if (!canManage) return json(403, { error: 'Tidak memiliki izin mengelola pengguna.' })

  let payload: { userId?: string; password?: string }
  try {
    payload = await req.json()
  } catch {
    return json(400, { error: 'Payload tidak valid.' })
  }
  if (!payload.userId || typeof payload.password !== 'string' || payload.password.length < 8) {
    return json(400, { error: 'Kata sandi minimal 8 karakter.' })
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: updateError } = await admin.auth.admin.updateUserById(payload.userId, { password: payload.password })
  if (updateError) return json(400, { error: updateError.message })

  return json(200, { ok: true })
})