// Client-side persistence for the in-progress blend draft.
// Uses localStorage so users can navigate between /blend and /oils without losing work.

export interface BlendDraft {
  v: 2
  carriers: Array<{ oilId: string; name: string; volumeMl: number }>
  essentials: Array<{ oilId: string; name: string; percentagePct: number }>
  totalVolumeMl: number
  dilutionRate: number
  blendName?: string
  blendNotes?: string
}

const KEY = 'oil-blender:blend-draft'
const CHANGE_EVENT = 'oil-blender:draft-changed'

export function loadDraft(): BlendDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.v !== 2) return null
    return parsed as BlendDraft
  } catch {
    return null
  }
}

function dispatchChange(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch { /* */ }
}

export function saveDraft(draft: BlendDraft): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft))
    dispatchChange()
  } catch { /* quota exceeded or storage disabled — silently skip */ }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
    dispatchChange()
  } catch { /* */ }
}

export function draftContainsOil(draft: BlendDraft, oilId: string): boolean {
  return (
    draft.carriers.some((c) => c.oilId === oilId) ||
    draft.essentials.some((e) => e.oilId === oilId)
  )
}

// Re-rendering hook target — same-tab change notification.
export const DRAFT_CHANGE_EVENT = CHANGE_EVENT

const DEFAULT_VOLUME_ML = 50
const DEFAULT_DILUTION_RATE = 0.02
const DROPS_PER_ML = 20
const MIN_DILUTION_RATE = 0.001
export const MAX_CARRIERS = 5
export const MAX_EOS = 5

function emptyDraft(): BlendDraft {
  return {
    v: 2,
    carriers: [],
    essentials: [],
    totalVolumeMl: DEFAULT_VOLUME_ML,
    dilutionRate: DEFAULT_DILUTION_RATE,
  }
}

export type AddResult = { ok: true } | { ok: false; reason: 'already' | 'max' }

export function addCarrierToDraft(oilId: string, name: string): AddResult {
  const current = loadDraft() ?? emptyDraft()
  if (current.carriers.some((c) => c.oilId === oilId)) return { ok: false, reason: 'already' }
  if (current.carriers.length >= MAX_CARRIERS) return { ok: false, reason: 'max' }
  const next = [...current.carriers, { oilId, name, volumeMl: 0 }]
  const even = current.totalVolumeMl / next.length
  current.carriers = next.map((c) => ({ ...c, volumeMl: even }))
  saveDraft(current)
  return { ok: true }
}

export function addEOToDraft(oilId: string, name: string): AddResult {
  const current = loadDraft() ?? emptyDraft()
  if (current.essentials.some((e) => e.oilId === oilId)) return { ok: false, reason: 'already' }
  if (current.essentials.length >= MAX_EOS) return { ok: false, reason: 'max' }
  const pct = (1 / DROPS_PER_ML / current.totalVolumeMl) * 100
  current.essentials = [...current.essentials, { oilId, name, percentagePct: pct }]
  current.dilutionRate = Math.max(
    MIN_DILUTION_RATE,
    current.essentials.reduce((s, e) => s + e.percentagePct, 0) / 100
  )
  saveDraft(current)
  return { ok: true }
}

export function removeFromDraft(oilId: string): void {
  const current = loadDraft()
  if (!current) return
  current.carriers = current.carriers.filter((c) => c.oilId !== oilId)
  current.essentials = current.essentials.filter((e) => e.oilId !== oilId)
  if (current.carriers.length === 0 && current.essentials.length === 0) {
    clearDraft()
    return
  }
  current.dilutionRate = Math.max(
    MIN_DILUTION_RATE,
    current.essentials.reduce((s, e) => s + e.percentagePct, 0) / 100
  )
  saveDraft(current)
}
