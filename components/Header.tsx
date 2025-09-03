export function Header({ name, role }:{ name?: string, role?: string }) {
  return (
    <header className='mb-6 flex items-center justify-between'>
      <div>
        <h1 className='text-2xl font-semibold'>Klientportal</h1>
        <p className='text-sm text-gray-500'>Book tider, læs delte noter, opslag og opgaver</p>
      </div>
      <div className='rounded-full bg-white px-3 py-1 shadow text-sm'>
        {name || 'Bruger'} • {role || 'Klient'}
      </div>
    </header>
  )
}
