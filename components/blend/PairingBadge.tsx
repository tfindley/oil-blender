import type { PairingRating } from '@/types'

const LABELS: Record<PairingRating, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Compatible',
  CAUTION: 'Caution',
  AVOID: 'Avoid',
  UNSAFE: 'Unsafe',
}

const CLASSES: Record<PairingRating, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  GOOD:      'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-600',
  CAUTION:   'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  AVOID:     'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
  UNSAFE:    'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
}

interface PairingBadgeProps {
  rating: PairingRating
  className?: string
}

export function PairingBadge({ rating, className = '' }: PairingBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CLASSES[rating]} ${className}`}
    >
      {LABELS[rating]}
    </span>
  )
}
