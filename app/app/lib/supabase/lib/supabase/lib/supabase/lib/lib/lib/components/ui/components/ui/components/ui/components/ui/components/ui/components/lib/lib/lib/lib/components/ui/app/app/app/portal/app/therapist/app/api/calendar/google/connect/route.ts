import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const state = Math.random().toString(36).slice(2)
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar')
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
    `&client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}` +
    `&scope=${scope}&access_type=offline&prompt=consent&state=${state}`

  const res = NextResponse.redirect(url)
  res.cookies.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return res
}
