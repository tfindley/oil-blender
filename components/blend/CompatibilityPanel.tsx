'use client'

import { PairingBadge } from './PairingBadge'
import type { BlendGrade, PairingRating } from '@/types'

interface Pairing {
  oilAId: string
  oilAName: string
  oilBId: string
  oilBName: string
  rating: PairingRating
  reason: string
}

const GRADE_STYLES: Record<BlendGrade, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  B: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  C: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  F: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
}

const GRADE_LABELS: Record<BlendGrade, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  F: 'Not Allowed',
}

interface CompatibilityPanelProps {
  grade: BlendGrade
  summary: string
  pairings: Pairing[]
}

export function CompatibilityPanel({ grade, summary, pairings }: CompatibilityPanelProps) {
  const notable = pairings.filter((p) => p.rating !== 'GOOD')
  const good = pairings.filter((p) => p.rating === 'GOOD')

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-lg border p-4 ${GRADE_STYLES[grade]}`}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-current text-2xl font-bold">
          {grade}
        </div>
        <div>
          <p className="font-semibold">{GRADE_LABELS[grade]} Blend</p>
          <p className="text-sm">{summary}</p>
        </div>
      </div>

      {notable.length > 0 && (
        <div className="space-y-2">
          {notable.map((p) => (
            <div key={`${p.oilAId}-${p.oilBId}`} className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {p.oilAName} + {p.oilBName}
                </span>
                <PairingBadge rating={p.rating} />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400">{p.reason}</p>
            </div>
          ))}
        </div>
      )}

      {good.length > 0 && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          + {good.length} compatible pairing{good.length !== 1 ? 's' : ''}
        </p>
      )}

      {pairings.length === 0 && (
        <p className="text-sm italic text-stone-400 dark:text-stone-500">No pairing data on record for this combination.</p>
      )}
    </div>
  )
}
