export type PairingRating = 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE'
export type BlendGrade = 'A' | 'B' | 'C' | 'F'

export interface ScoredPairing {
  oilAName: string
  oilBName: string
  rating: PairingRating
  reason: string
}

export interface BlendScore {
  grade: BlendGrade
  label: string
  summary: string
  pairings: ScoredPairing[]
}

const GRADE_META: Record<BlendGrade, { label: string; color: string }> = {
  A: { label: 'Excellent', color: 'green' },
  B: { label: 'Good', color: 'amber' },
  C: { label: 'Fair — review warnings', color: 'orange' },
  F: { label: 'Not allowed', color: 'red' },
}

export function scoreBlend(pairings: ScoredPairing[]): BlendScore {
  if (pairings.some((p) => p.rating === 'UNSAFE')) {
    return {
      grade: 'F',
      label: GRADE_META.F.label,
      summary: 'This blend contains an unsafe combination and cannot be saved.',
      pairings,
    }
  }

  const avoidCount = pairings.filter((p) => p.rating === 'AVOID').length
  const cautionCount = pairings.filter((p) => p.rating === 'CAUTION').length
  const excellentCount = pairings.filter((p) => p.rating === 'EXCELLENT').length

  if (avoidCount > 0) {
    return {
      grade: 'C',
      label: GRADE_META.C.label,
      summary:
        avoidCount === 1
          ? 'One pairing is not recommended. You can still save this blend after acknowledging the warning.'
          : `${avoidCount} pairings are not recommended. Review the warnings before saving.`,
      pairings,
    }
  }

  if (cautionCount > 0) {
    return {
      grade: 'B',
      label: GRADE_META.B.label,
      summary:
        cautionCount === 1
          ? 'One pairing needs attention — check the note below.'
          : `${cautionCount} pairings have notes worth reviewing.`,
      pairings,
    }
  }

  if (excellentCount > 0) {
    return {
      grade: 'A',
      label: GRADE_META.A.label,
      summary:
        excellentCount === pairings.length
          ? 'All pairings in this blend are excellent together.'
          : `${excellentCount} excellent pairing${excellentCount > 1 ? 's' : ''} — this is a well-balanced blend.`,
      pairings,
    }
  }

  return {
    grade: 'A',
    label: GRADE_META.A.label,
    summary: 'All oils in this blend are compatible — no issues found.',
    pairings,
  }
}

export function gradeColor(grade: BlendGrade): string {
  return GRADE_META[grade].color
}
