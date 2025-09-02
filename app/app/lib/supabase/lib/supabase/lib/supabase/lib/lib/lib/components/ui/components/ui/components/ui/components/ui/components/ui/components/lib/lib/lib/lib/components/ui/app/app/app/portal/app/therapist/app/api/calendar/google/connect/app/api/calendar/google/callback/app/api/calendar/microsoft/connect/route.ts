import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const state = Math.random().toString(36).slice(2)
  const scope = encodeURIComponent('offline_access Calendars.ReadWrite')
  const url =
    `https://login.microsoftonline.com/${process.env.MS_TENANT || 'common'}/oauth2/v2.0/authorize` +
    `?client_id=${process.env.MS_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(process.env.MS_REDIRECT_URI!)}` +
    `&response_mode=query&scope=${scope}&state=${state}`

  const res = NextResponse.redirect(url)
  res.cookies.set('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return res
}
