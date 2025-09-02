import { InputHTMLAttributes } from 'react'

export function Checkbox(p: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type='checkbox'
      {...p}
      className='h-4 w-4 rounded border-gray-300 align-middle'
    />
  )
}
