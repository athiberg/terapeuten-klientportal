import { ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'rounded-2xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed',
        variant === 'default' &&
          'bg-gray-900 text-white hover:bg-gray-800',
        variant === 'secondary' &&
          'bg-white text-gray-900 border hover:bg-gray-50',
        variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        className
      )}
      {...props}
    />
  )
}
