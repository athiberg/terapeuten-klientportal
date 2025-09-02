import { google } from 'googleapis'
import { Client } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'
import { decrypt } from './crypto'
import { createClient } from '@/lib/supabase/server'

export async function createEventForTherapist(
  therapist_id: string,
  startISO: string,
  endISO: string,
  summary: string,
  description?: string
) {
  const supabase = createClient()
  const { data } = await supabase
    .from('calendar_tokens')
    .select('*')
    .eq('user_id', therapist_id)

  if (!data || !data.length) return { ok: false, reason: 'no_calendar' }

  const tok = data.find((t) => t.provider === 'google') || data[0]
  const tokens = JSON.parse(decrypt(tok.access_token))

  if (tok.provider === 'google') {
    const oa = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    oa.setCredentials(tokens)
    const cal = google.calendar({ version: 'v3', auth: oa })
    const res = await cal.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: startISO },
        end: { dateTime: endISO }
      }
    })
    return { ok: true, provider: 'google', id: res.data.id }
  }

  const client = Client.init({
    authProvider: (done) => done(null, tokens.access_token)
  })
  const res = await client.api('/me/events').post({
    subject: summary,
    body: { contentType: 'Text', content: description || '' },
    start: { dateTime: startISO, timeZone: 'UTC' },
    end: { dateTime: endISO, timeZone: 'UTC' }
  })
  return { ok: true, provider: 'microsoft', id: res.id }
}
