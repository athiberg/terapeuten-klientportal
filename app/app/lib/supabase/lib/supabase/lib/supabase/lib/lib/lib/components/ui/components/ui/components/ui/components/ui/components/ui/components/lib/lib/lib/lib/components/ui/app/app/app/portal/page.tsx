'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import { Header } from '@/components/Header'
import { Card, CardContent } from '@/components/ui/card'

type Note={ id:string; date:string; therapist:string; title:string; content:string; visibility:'shared'|'internal' }
type Task={ id:string; title:string; due:string; done:boolean }
type Post={ id:string; date:string; title:string; teaser:string; link?:string }

const MOCK_SLOTS:Record<string,string[]>={
  '2025-09-01':['09:00','10:00','13:30','15:00'],
  '2025-09-02':['08:30','11:00','14:00']
}

export default function PortalPage(){
  const [session,setSession]=useState<any>(null)
  const [profile,setProfile]=useState<any>(null)

  const [selectedDate,setSelectedDate]=useState('')
  const [selectedTime,setSelectedTime]=useState('')

  const [notes,setNotes]=useState<Note[]>([])
  const [noteFilter,setNoteFilter]=useState('')
  const [tasks,setTasks]=useState<Task[]>([])
  const [posts,setPosts]=useState<Post[]>([])

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const { data: l } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return ()=>l.subscription.unsubscribe()
  },[])

  useEffect(()=>{ (async()=>{
    if(!session) return
    const { data: prof } = await supabase.from('profiles').select('*').eq('id',session.user.id).single()
    setProfile(prof||{ name: session.user.email, role: 'client' })

    const { data: ns } = await supabase
      .from('notes')
      .select('id, created_at, title, body, visibility, therapist_profiles(name)')
      .eq('client_id',session.user.id).eq('visibility','shared')
      .order('created_at',{ascending:false})
    if(ns) setNotes(ns.map((n:any)=>({
      id:n.id,
      date:new Date(n.created_at).toISOString().slice(0,10),
      therapist:n.therapist_profiles?.name||'Terapeut',
      title:n.title,
      content:n.body,
      visibility:'shared'
    })))

    const { data: taskData } = await supabase
      .from('tasks').select('*')
      .eq('client_id',session.user.id).order('due_date',{ascending:true})
    if(taskData) setTasks(taskData.map((t:any)=>({ id:t.id, title:t.title, due:t.due_date, done:t.is_done })))

    const { data: postData } = await supabase.from('posts').select('*').order('created_at',{ascending:false})
    if(postData) setPosts(postData.map((p:any)=>({
      id:p.id,
      date:new Date(p.created_at).toISOString().slice(0,10),
      title:p.title, teaser:p.teaser, link:p.link
    })))
  })() },[session])

  const availableSlots = useMemo(()=> selectedDate ? (MOCK_SLOTS[selectedDate]||[]) : [], [selectedDate])

  const handleBook = async()=>{
    if(!session) return alert('Log ind først.')
    if(!selectedDate||!selectedTime) return alert('Vælg dato og tidspunkt.')
    const start=new Date(`${selectedDate}T${selectedTime}:00`)
    const end=new Date(start.getTime()+50*60000)
    const { error } = await supabase.from('appointments').insert({
      client_id: session.user.id, therapist_id: null,
      start_time: start.toISOString(), end_time: end.toISOString(),
      status: 'proposed'
    })
    if(error) return alert('Kunne ikke foreslå tid: '+error.message)
    alert('Din tid er foreslået. Terapeuten bekræfter og du får besked.')
    setSelectedTime('')
  }

  const toggleTask = async(id:string,val:boolean)=>{
    setTasks(p=>p.map(t=>t.id===id?{...t,done:val}:t))
    await supabase.from('tasks').update({ is_done: val }).eq('id', id)
  }

  const filteredNotes = useMemo(()=>{
    const q=noteFilter.toLowerCase()
    return notes.filter(n=>[n.title,n.content,n.date,n.therapist].some(f=>f.toLowerCase().includes(q)))
  },[notes,noteFilter])

  return (
    <div>
      <Header name={profile?.name||'Klient'} role='Klient'/>

      {/* Booking */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='md:col-span-2'><CardContent>
          <h2 className='text-lg font-medium mb-4'>Vælg tidspunkt</h2>
          <div className='grid md:grid-cols-3 gap-4'>
            <div>
              <label className='text-sm text-gray-600'>Dato</label>
              <input type='date' value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className='w-full rounded-xl border px-3 py-2 text-sm'/>
            </div>
            <div className='md:col-span-2'>
              <label className='text-sm text-gray-600'>Ledige tider</label>
              <div className='flex flex-wrap gap-2 mt-1'>
                {availableSlots.length===0&&<div className='text-sm text-gray-500'>Vælg en dato for at se ledige tider</div>}
                {availableSlots.map(slot=>(
                  <button key={slot} onClick={()=>setSelectedTime(slot)} className={`rounded-full border px-3 py-1 text-sm ${selectedTime===slot?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-100'}`}>{slot}</button>
                ))}
              </div>
            </div>
          </div>
          <div className='mt-6 flex items-center gap-3'>
            <button onClick={handleBook} className='rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm'>Foreslå tid</button>
            <p className='text-xs text-gray-500'>Terapeuten bekræfter din tid og du får besked.</p>
          </div>
        </CardContent></Card>

        <Card><CardContent>
          <h3 className='text-base font-medium mb-2'>Praktik</h3>
          <ul className='list-disc pl-5 text-sm text-gray-600'>
            <li>Afbud senest 24 timer før.</li>
            <li>Betaling via MobilePay efter session.</li>
            <li>Adresse: Havnegade 12, 3. sal, 1058 København K.</li>
          </ul>
        </CardContent></Card>
      </div>

      {/* Noter + besked */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
        <Card className='md:col-span-2'><CardContent>
          <div className='mb-3'>
            <input placeholder='Søg i noter…' value={noteFilter} onChange={e=>setNoteFilter(e.target.value)} className='w-full rounded-xl border px-3 py-2 text-sm'/>
          </div>
          <div className='grid gap-3'>
            {filteredNotes.map(n=>(
              <div key={n.id} className='rounded-2xl border bg-white p-4'>
                <div className='text-sm text-gray-500'>{n.date} • {n.therapist} • Delte noter</div>
                <h3 className='text-base font-medium'>{n.title}</h3>
                <p className='mt-1 text-sm text-gray-700'>{n.content}</p>
              </div>
            ))}
            {filteredNotes.length===0&&<div className='text-sm text-gray-500'>Ingen noter endnu.</div>}
          </div>
        </CardContent></Card>

        <Card><CardContent>
          <h4 className='text-sm font-medium mb-2'>Spørg til en note</h4>
          <textarea className='w-full rounded-xl border px-3 py-2 text-sm' placeholder='Skriv en kort besked til terapeuten…'/>
          <div className='mt-2'>
            <button className='rounded-2xl bg-gray-900 text-white px-4 py-2 text-sm'>Send besked</button>
          </div>
        </CardContent></Card>
      </div>

      {/* Opslag */}
      <div className='grid gap-4 mt-4'>
        {posts.map(p=>(
          <Card key={p.id}><CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm text-gray-500'>{p.date}</div>
                <h3 className='text-base font-medium'>{p.title}</h3>
              </div>
              {p.link&&<a href={p.link} className='rounded-full border px-3 py-1 text-sm hover:bg-gray-50'>Åbn</a>}
            </div>
            <p className='mt-2 text-sm text-gray-700'>{p.teaser}</p>
          </CardContent></Card>
        ))}
        {posts.length===0&&<div className='text-sm text-gray-500'>Ingen opslag endnu.</div>}
      </div>

      {/* Opgaver */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
        <Card className='md:col-span-2'><CardContent>
          <h3 className='text-base font-medium mb-3'>Dine opgaver</h3>
          <div className='grid gap-3'>
            {tasks.map(t=>(
              <div key={t.id} className='flex items-center justify-between rounded-xl border bg-white p-3'>
                <div className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    checked={t.done}
                    onChange={async(e)=>{
                      const v=e.currentTarget.checked
                      setTasks(p=>p.map(x=>x.id===t.id?{...x,done:v}:x))
                      await supabase.from('tasks').update({ is_done: v }).eq('id', t.id)
                    }}
                    className='h-4 w-4 rounded border-gray-300'
                  />
                  <div>
                    <div className='text-sm font-medium'>{t.title}</div>
                    <div className='text-xs text-gray-500'>Forfald: {t.due}</div>
                  </div>
                </div>
                {t.done&&<span className='text-xs text-emerald-600'>Fuldført</span>}
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardContent>
          <h4 className='text-sm font-medium mb-2'>Ny opgave (demo)</h4>
          <input placeholder='Titel' className='w-full rounded-xl border px-3 py-2 text-sm'/>
          <input type='date' className='w-full rounded-xl border px-3 py-2 text-sm mt-2'/>
          <div className='mt-2'><button className='rounded-2xl bg-white border px-4 py-2 text-sm'>Gem (demo)</button></div>
        </CardContent></Card>
      </div>
    </div>
  )
}
