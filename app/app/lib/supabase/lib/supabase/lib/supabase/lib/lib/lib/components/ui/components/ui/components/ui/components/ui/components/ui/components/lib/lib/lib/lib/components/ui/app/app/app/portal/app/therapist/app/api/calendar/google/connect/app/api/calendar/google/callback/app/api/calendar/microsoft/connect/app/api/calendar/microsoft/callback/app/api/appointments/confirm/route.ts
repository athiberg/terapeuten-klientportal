import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEventForTherapist } from '@/lib/calendar'
import { sendEmail } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const s = createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { data: appt, error } = await s.from('appointments').select('*').eq('id', id).single()
  if (error || !appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  const { data: me } = await s.from('profiles').select('role,name').eq('id', user.id).single()
  if (!me || !['therapist', 'admin'].includes(me.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const startISO = new Date(appt.start_time).toISOString()
  const endISO = new Date(appt.end_time).toISOString()

  await s.from('appointments').update({ status: 'confirmed', therapist_id: user.id }).eq('id', id)

  // Kalender-event
  await createEventForTherapist(user.id, startISO, endISO, 'Terapi-session', 'Bekræftet via klientportalen')

  // Email til klient
  const { data: clientUser } = await s.auth.admin.getUserById(appt.client_id)
  const toEmail = (clientUser as any)?.user?.email
  if (toEmail) await sendEmail({ to: toEmail, subject: 'Din tid er bekræftet', text: `Din tid er bekræftet: ${startISO}` })

  return NextResponse.json({ ok: true })
}
