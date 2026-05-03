import { ReactNode } from 'react'
import type { PairingRating, BlendGrade } from '@/types'

type BadgeVariant = 'default' | PairingRating | BlendGrade

const VARIANT_CLASSES: Record<string, string> = {
  default: 'bg-stone-100 text-stone-700',
  EXCELLENT: 'bg-emerald-100 text-emerald-800',
  GOOD: 'bg-stone-100 text-stone-700',
  CAUTION: 'bg-amber-100 text-amber-800',
  AVOID: 'bg-orange-100 text-orange-800',
  UNSAFE: 'bg-red-100 text-red-800',
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-amber-100 text-amber-800',
  C: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default} ${className}`}
    >
      {children}
    </span>
  )
}
