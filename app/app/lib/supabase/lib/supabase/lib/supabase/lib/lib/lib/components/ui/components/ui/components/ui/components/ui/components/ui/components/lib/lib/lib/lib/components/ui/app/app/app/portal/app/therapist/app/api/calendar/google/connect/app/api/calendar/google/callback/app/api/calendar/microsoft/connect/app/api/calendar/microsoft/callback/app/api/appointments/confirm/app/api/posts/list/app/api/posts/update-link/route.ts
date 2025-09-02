import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const s = createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, link } = await req.json()
  if (!id || !link) return NextResponse.json({ error: 'Missing id/link' }, { status: 400 })

  const { data: me } = await s.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['therapist', 'admin'].includes(me.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await s.from('posts').update({ link }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
