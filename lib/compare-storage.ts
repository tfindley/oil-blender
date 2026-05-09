// Client-side persistence for the oil compare slots.

export interface CompareSlot {
  id: string
  name: string
}

export interface CompareSlots {
  v: 2
  slotA?: CompareSlot
  slotB?: CompareSlot
}

const KEY = 'oil-blender:compare-slots'
const CHANGE_EVENT = 'oil-blender:compare-changed'

export const COMPARE_CHANGE_EVENT = CHANGE_EVENT

export function loadCompare(): CompareSlots | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.v !== 2) return null
    return parsed as CompareSlots
  } catch {
    return null
  }
}

function dispatchChange(): void {
  if (typeof window === 'undefined') return
  try { window.dispatchEvent(new Event(CHANGE_EVENT)) } catch { /* */ }
}

export function saveCompare(slots: CompareSlots): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slots))
    dispatchChange()
  } catch { /* */ }
}

export function clearCompare(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
    dispatchChange()
  } catch { /* */ }
}

// Add to first available slot. No-op if oil is already in either slot.
// Returns 'A' / 'B' on success, 'full' when both slots are taken, 'already' when oil is already present.
export type PushResult = 'A' | 'B' | 'full' | 'already'

export function pushToCompare(oil: CompareSlot): PushResult {
  const current = loadCompare() ?? { v: 2 as const }
  if (current.slotA?.id === oil.id || current.slotB?.id === oil.id) return 'already'
  if (!current.slotA) {
    saveCompare({ ...current, slotA: oil })
    return 'A'
  }
  if (!current.slotB) {
    saveCompare({ ...current, slotB: oil })
    return 'B'
  }
  return 'full'
}

// Replace the chosen slot with the given oil.
export function replaceInCompare(slot: 'A' | 'B', oil: CompareSlot): void {
  const current = loadCompare() ?? { v: 2 as const }
  if (slot === 'A') saveCompare({ ...current, slotA: oil })
  else saveCompare({ ...current, slotB: oil })
}

// Remove a single slot.
export function removeFromCompare(slot: 'A' | 'B'): void {
  const current = loadCompare()
  if (!current) return
  const next: CompareSlots = { v: 2 }
  if (slot === 'A' && current.slotB) next.slotB = current.slotB
  if (slot === 'B' && current.slotA) next.slotA = current.slotA
  if (!next.slotA && !next.slotB) {
    clearCompare()
    return
  }
  saveCompare(next)
}
