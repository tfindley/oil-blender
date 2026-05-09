import type { BlendGrade } from '@/lib/blend-scorer'

export const GRADE_STYLES: Record<BlendGrade, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  B: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  C: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  F: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}
