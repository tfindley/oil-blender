import type { PairingRating } from '@/types'

const LABELS: Record<PairingRating, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Compatible',
  CAUTION: 'Caution',
  AVOID: 'Avoid',
  UNSAFE: 'Unsafe',
}

const CLASSES: Record<PairingRating, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  GOOD: 'bg-stone-100 text-stone-600 border-stone-200',
  CAUTION: 'bg-amber-100 text-amber-800 border-amber-200',
  AVOID: 'bg-orange-100 text-orange-800 border-orange-200',
  UNSAFE: 'bg-red-100 text-red-800 border-red-200',
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
