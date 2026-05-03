import { ReactNode } from 'react'

type AlertVariant = 'info' | 'caution' | 'avoid' | 'unsafe' | 'success'

const STYLES: Record<AlertVariant, string> = {
  info: 'bg-stone-50 border-stone-300 text-stone-700',
  caution: 'bg-amber-50 border-amber-300 text-amber-800',
  avoid: 'bg-orange-50 border-orange-300 text-orange-800',
  unsafe: 'bg-red-50 border-red-300 text-red-800',
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
}

const ICONS: Record<AlertVariant, string> = {
  info: 'ℹ',
  caution: '⚠',
  avoid: '⛔',
  unsafe: '🚫',
  success: '✓',
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${STYLES[variant]} ${className}`}>
      <span className="shrink-0 text-lg leading-none">{ICONS[variant]}</span>
      <div className="flex-1 text-sm">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  )
}
