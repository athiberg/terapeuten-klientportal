import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terapeuten – Klientportal',
  description: 'Booking, delte noter, opslag og opgaver.'
}

export default function RootLayout({ children }:{ children: React.ReactNode }) {
  return (
    <html lang='da'>
      <body>
        <div className='container py-6'>{children}</div>
      </body>
    </html>
  )
}
