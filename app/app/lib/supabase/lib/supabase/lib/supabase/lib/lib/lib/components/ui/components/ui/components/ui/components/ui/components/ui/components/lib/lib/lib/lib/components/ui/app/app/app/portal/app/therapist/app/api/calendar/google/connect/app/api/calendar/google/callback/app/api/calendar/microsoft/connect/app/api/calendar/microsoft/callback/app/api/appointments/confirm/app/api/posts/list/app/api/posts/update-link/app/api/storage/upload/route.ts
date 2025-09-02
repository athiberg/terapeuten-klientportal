export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const s = createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const path = form.get('path') as string | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const { data: me } = await s.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['therapist', 'admin'].includes(me.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const filename = path || `uploads/${user.id}/${Date.now()}-${file.name}`
  const buf = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error } = await admin.storage.from('materials').upload(filename, buf, { upsert: true, contentType: file.type || 'application/octet-stream' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\\/$/, '')}/storage/v1/object/public/materials/${filename}`
  return NextResponse.json({ ok: true, path: filename, url: publicUrl })
}
