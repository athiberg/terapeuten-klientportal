import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const code = u.searchParams.get('code')
  const state = u.searchParams.get('state')
  const cs = cookies().get('oauth_state')?.value
  if (!code || !state || state !== cs) return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })

  const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_TENANT || 'common'}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID!, client_secret: process.env.MS_CLIENT_SECRET!,
    grant_type: 'authorization_code', code, redirect_uri: process.env.MS_REDIRECT_URI!
  })
  const r = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const tokens = await r.json()
  if (!r.ok) return NextResponse.json(tokens, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('calendar_tokens').upsert({
    user_id: user.id, provider: 'microsoft', access_token: encrypt(JSON.stringify(tokens))
  })

  const res = NextResponse.redirect(new URL('/therapist', req.url))
  res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
  return res
}
