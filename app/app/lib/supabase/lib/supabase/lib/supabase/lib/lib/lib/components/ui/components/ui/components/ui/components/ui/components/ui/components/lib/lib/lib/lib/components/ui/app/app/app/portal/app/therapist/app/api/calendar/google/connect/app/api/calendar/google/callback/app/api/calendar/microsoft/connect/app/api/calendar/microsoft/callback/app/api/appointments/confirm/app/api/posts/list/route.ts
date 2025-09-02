import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const s = createClient()
  const { data } = await s.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data || [])
}
