'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/browser'
import Link from 'next/link'

export default function Page(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [session,setSession]=useState<any>(null)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const { data: l } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return ()=>l.subscription.unsubscribe()
  },[])

  const signIn=async()=>{
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) setError(error.message)
    setLoading(false)
  }

  const signUp=async()=>{
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if(error) setError(error.message)
    setLoading(false)
  }

  return (
    <main className='max-w-md mx-auto'>
      <h1 className='text-xl font-semibold mb-4'>Log ind</h1>
      <div className='space-y-3'>
        <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} className='w-full rounded-xl border px-3 py-2 text-sm'/>
        <input placeholder='Adgangskode' type='password' value={password} onChange={e=>setPassword(e.target.value)} className='w-full rounded-xl border px-3 py-2 text-sm'/>
        {error && <div className='text-sm text-red-600'>{error}</div>}
        <div className='flex gap-2'>
          <button onClick={signIn} disabled={loading} className='rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm'>Log ind</button>
          <button onClick={signUp} disabled={loading} className='rounded-2xl bg-white border px-4 py-2 text-sm'>Opret</button>
        </div>
      </div>

      {session && (
        <div className='mt-6 space-y-2 text-sm'>
          <div>Du er logget ind.</div>
          <div className='flex gap-3'>
            <Link href='/portal' className='underline'>Gå til klientportal</Link>
            <Link href='/therapist' className='underline'>Gå til terapeut-dashboard</Link>
          </div>
        </div>
      )}
    </main>
  )
}
