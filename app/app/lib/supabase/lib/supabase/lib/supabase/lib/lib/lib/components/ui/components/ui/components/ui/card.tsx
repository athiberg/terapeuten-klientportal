import { ReactNode } from 'react'
import { clsx } from 'clsx'

export function Card({ children, className }:{ children: ReactNode, className?: string }) {
  return <div className={clsx('rounded-2xl border bg-white shadow-sm', className)}>{children}</div>
}

export function CardContent({ children, className }:{ children: ReactNode, className?: string }) {
  return <div className={clsx('p-4 md:p-6', className)}>{children}</div>
}
