import { TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={clsx(
        'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300',
        p.className
      )}
    />
  )
}
