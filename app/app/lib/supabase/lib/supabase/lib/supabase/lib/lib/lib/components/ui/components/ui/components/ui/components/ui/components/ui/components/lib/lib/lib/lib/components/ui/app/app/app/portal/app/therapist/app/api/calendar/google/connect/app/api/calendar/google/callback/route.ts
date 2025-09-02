import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const code = u.searchParams.get('code')
  const state = u.searchParams.get('state')
  const cs = cookies().get('oauth_state')?.value
  if (!code || !state || state !== cs) return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI
  )
  const tok = await client.getToken({ code, redirect_uri: process.env.GOOGLE_REDIRECT_URI })
  const tokens = tok.tokens

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('calendar_tokens').upsert({
    user_id: user.id, provider: 'google', access_token: encrypt(JSON.stringify(tokens))
  })

  const res = NextResponse.redirect(new URL('/therapist', req.url))
  res.cookies.set('oauth_state', '', { maxAge: 0, path: '/' })
  return res
}
