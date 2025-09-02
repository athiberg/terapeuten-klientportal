import { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={clsx(
        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300',
        p.className
      )}
    />
  )
}
