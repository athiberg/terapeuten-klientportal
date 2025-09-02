'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import { Card, CardContent } from '@/components/ui/card'

export default function TherapistDashboard(){
  const [session,setSession]=useState<any>(null)
  const [appointments,setAppointments]=useState<any[]>([])
  const [notes,setNotes]=useState<any[]>([])

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const { data: l } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return ()=>l.subscription.unsubscribe()
  },[])

  useEffect(()=>{ (async()=>{
    if(!session) return
    const { data: appts } = await supabase
      .from('appointments')
      .select('id,start_time,end_time,status,clients:client_id (profiles(name))')
      .order('start_time',{ascending:true})
      .limit(50)
    setAppointments(appts||[])

    const { data: ns } = await supabase
      .from('notes')
      .select('id,created_at,title,body,visibility,clients:client_id (profiles(name))')
      .order('created_at',{ascending:false})
      .limit(20)
    setNotes(ns||[])
  })() },[session])

  const approve=async(id:string)=>{
    const res = await fetch('/api/appointments/confirm',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id})
    })
    if(!res.ok){
      const j=await res.json().catch(()=>({}))
      alert('Fejl: '+(j.error||'ukendt'))
      return
    }
    setAppointments(prev=>prev.map(a=>a.id===id?{...a,status:'confirmed'}:a))
  }

  return (
    <main>
      <h1 className='text-xl font-semibold mb-2'>Terapeut-dashboard</h1>

      <div className='flex gap-2 mb-4'>
        <a href='/api/calendar/google/connect' className='underline text-sm'>Forbind Google Kalender</a>
        <a href='/api/calendar/microsoft/connect' className='underline text-sm'>Forbind Outlook Kalender</a>
      </div>

      <div className='grid md:grid-cols-2 gap-4'>
        <Card><CardContent>
          <h2 className='text-base font-medium mb-2'>Foreslåede tider</h2>
          <div className='space-y-2'>
            {appointments.filter(a=>a.status==='proposed').map(a=>(
              <div key={a.id} className='flex items-center justify-between rounded-xl border p-3'>
                <div>
                  <div className='text-sm'>
                    {new Date(a.start_time).toLocaleString()} – {new Date(a.end_time).toLocaleTimeString()}
                  </div>
                  <div className='text-xs text-gray-500'>Klient: {a.clients?.profiles?.name||'Ukendt'}</div>
                </div>
                <button onClick={()=>approve(a.id)} className='rounded-2xl bg-gray-900 text-white px-3 py-1.5 text-sm'>Godkend</button>
              </div>
            ))}
            {appointments.filter(a=>a.status==='proposed').length===0&&(
              <div className='text-sm text-gray-500'>Ingen foreslåede tider.</div>
            )}
          </div>
        </CardContent></Card>

        <Card><CardContent>
          <h2 className='text-base font-medium mb-2'>Noter (seneste)</h2>
          <div className='space-y-2 max-h-[420px] overflow-auto'>
            {notes.map((n:any)=>(
              <div key={n.id} className='rounded-xl border p-3'>
                <div className='text-xs text-gray-500'>
                  {new Date(n.created_at).toLocaleString()} • {n.clients?.profiles?.name||'Klient'}
                </div>
                <div className='text-sm font-medium'>
                  {n.title} {n.visibility==='shared'?'• Delt':'• Intern'}
                </div>
                <div className='text-sm text-gray-700 mt-1'>{n.body}</div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </main>
  )
}
