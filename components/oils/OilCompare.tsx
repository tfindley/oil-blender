'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { pairingKey } from '@/lib/pairing-utils'
import { loadCompare, saveCompare, COMPARE_CHANGE_EVENT } from '@/lib/compare-storage'

type Rating = 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE'
type OilType = 'ESSENTIAL' | 'CARRIER'

interface DetailedOil {
  id: string
  name: string
  botanicalName: string
  type: OilType
  description: string
  aroma: string
  benefits: string[]
  contraindications: string[]
  origin: string
  consistency?: string | null
  absorbency?: string | null
  dilutionRateMax?: number | null
}

interface PairingData {
  rating: string
  reason: string
}

interface Props {
  oils: DetailedOil[]
  pairingMap: Record<string, PairingData>
}

const RATINGS: Record<Rating, { label: string; dot: string; text: string; bg: string; border: string }> = {
  EXCELLENT: {
    label: 'Excellent',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  GOOD: {
    label: 'Good',
    dot: 'bg-sky-400',
    text: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
  },
  CAUTION: {
    label: 'Caution',
    dot: 'bg-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  AVOID: {
    label: 'Avoid',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
  },
  UNSAFE: {
    label: 'Unsafe',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
}

// ── Slot selector: custom inline-overlay picker for the compare page ─────
// Each slot has fully isolated state (no cross-talk between A and B).
// Picking an oil closes the overlay and clears the search input.

function SlotSelector({
  side,
  oils,
  selectedOil,
  onSelect,
}: {
  side: 'A' | 'B'
  oils: DetailedOil[]
  selectedOil: DetailedOil | null
  onSelect: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'search' | 'browse'>('search')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open])

  // Focus the search input when the overlay opens in search mode
  useEffect(() => {
    if (open && mode === 'search') inputRef.current?.focus()
  }, [open, mode])

  function pick(oilId: string) {
    onSelect(oilId)
    setOpen(false)
    setSearch('')
  }

  const filtered = useMemo(() => {
    if (!search) return oils
    const q = search.toLowerCase()
    return oils.filter(
      (o) => o.name.toLowerCase().includes(q) || o.botanicalName.toLowerCase().includes(q),
    )
  }, [oils, search])

  return (
    <div ref={ref} className="relative">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Oil {side}</p>
          {selectedOil ? (
            <p className="truncate font-serif text-base font-semibold text-stone-900 dark:text-stone-100">{selectedOil.name}</p>
          ) : (
            <p className="text-sm italic text-stone-400 dark:text-stone-500">No oil selected</p>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-stone-600 dark:text-stone-300 dark:hover:border-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
          aria-expanded={open}
        >
          {selectedOil ? 'Change' : 'Choose oil'}
        </button>
        {selectedOil && (
          <button
            onClick={() => onSelect(null)}
            aria-label={`Clear oil ${side}`}
            className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>

      {/* Overlay picker (sits above the profile / placeholder below) */}
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800">
          {/* Mode toggle */}
          <div className="flex items-stretch border-b border-stone-100 dark:border-stone-700">
            <button
              onClick={() => setMode('search')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                mode === 'search'
                  ? 'border-b-2 border-amber-500 text-amber-700 dark:text-amber-500'
                  : 'border-b-2 border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setMode('browse')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                mode === 'browse'
                  ? 'border-b-2 border-amber-500 text-amber-700 dark:text-amber-500'
                  : 'border-b-2 border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close picker"
              className="px-3 py-2 text-stone-400 hover:bg-stone-50 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-200"
            >
              ✕
            </button>
          </div>

          {mode === 'search' && (
            <div className="p-3">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or botanical name…"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base sm:text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
              />
              <ul className="mt-2 max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-2 py-3 text-center text-sm text-stone-400 dark:text-stone-500">No oils match.</li>
                ) : (
                  filtered.slice(0, 50).map((o) => {
                    const isCurrent = selectedOil?.id === o.id
                    return (
                      <li key={o.id}>
                        <button
                          onClick={() => pick(o.id)}
                          className={`flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm transition-colors ${
                            isCurrent
                              ? 'bg-stone-100 text-stone-900 dark:bg-stone-700 dark:text-stone-100'
                              : 'text-stone-800 hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-amber-950/30'
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{o.name}</span>
                            <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{o.botanicalName}</span>
                          </span>
                          <span className={`shrink-0 text-xs ${o.type === 'ESSENTIAL' ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`}>
                            {o.type === 'ESSENTIAL' ? 'EO' : 'Carrier'}
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}

          {mode === 'browse' && (
            <div className="max-h-96 overflow-y-auto p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {oils.map((o) => {
                  const isCurrent = selectedOil?.id === o.id
                  return (
                    <button
                      key={o.id}
                      onClick={() => pick(o.id)}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        isCurrent
                          ? 'border-amber-500 bg-white shadow-sm dark:bg-stone-700'
                          : 'border-stone-200 bg-white hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-amber-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-stone-800 dark:text-stone-100">{o.name}</p>
                          <p className="truncate text-xs italic text-stone-400 dark:text-stone-500">{o.botanicalName}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-medium ${o.type === 'ESSENTIAL' ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`}>
                          {o.type === 'ESSENTIAL' ? 'EO' : 'Carrier'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs italic text-stone-500 dark:text-stone-400">{o.aroma}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Oil profile card ───────────────────────────────────────────────────────

function OilProfileCard({ oil, side }: { oil: DetailedOil; side: 'A' | 'B' }) {
  const isEO = oil.type === 'ESSENTIAL'
  return (
    <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-800">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Oil {side}
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            {oil.name}
          </h2>
          <p className="mt-0.5 text-xs italic text-stone-400 dark:text-stone-500">{oil.botanicalName}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isEO
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
          }`}
        >
          {isEO ? 'Essential Oil' : 'Carrier Oil'}
        </span>
      </div>

      {/* Origin + aroma */}
      <div className="mb-3 space-y-1 text-xs text-stone-500 dark:text-stone-400">
        {oil.origin && (
          <p><span className="font-medium text-stone-600 dark:text-stone-300">Origin:</span> {oil.origin}</p>
        )}
        <p><span className="font-medium text-stone-600 dark:text-stone-300">Aroma:</span> {oil.aroma}</p>
        {isEO && oil.dilutionRateMax && (
          <p>
            <span className="font-medium text-stone-600 dark:text-stone-300">Max dilution:</span>{' '}
            {(oil.dilutionRateMax * 100).toFixed(0)}%
          </p>
        )}
        {!isEO && oil.consistency && (
          <p><span className="font-medium text-stone-600 dark:text-stone-300">Consistency:</span> {oil.consistency}</p>
        )}
        {!isEO && oil.absorbency && (
          <p><span className="font-medium text-stone-600 dark:text-stone-300">Absorbency:</span> {oil.absorbency}</p>
        )}
      </div>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {oil.description}
      </p>

      {/* Benefits */}
      {oil.benefits.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Benefits
          </p>
          <ul className="space-y-0.5">
            {oil.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contraindications */}
      {oil.contraindications.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Cautions
          </p>
          <ul className="space-y-0.5">
            {oil.contraindications.map((c, i) => (
              <li key={i} className="text-xs text-amber-800 dark:text-amber-300">⚠ {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Link */}
      <div className="mt-auto pt-2">
        <Link
          href={`/oils/${oil.id}`}
          className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          Full profile →
        </Link>
      </div>
    </div>
  )
}

// ── Compatibility result ───────────────────────────────────────────────────

function CompatibilityResult({
  pairing,
  oilA,
  oilB,
}: {
  pairing: PairingData | null | undefined
  oilA: DetailedOil | null
  oilB: DetailedOil | null
}) {
  const bothSelected = oilA && oilB

  if (!bothSelected) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-700 dark:bg-stone-900/40">
        <div className="mb-3 h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-700" />
        <p className="text-sm text-stone-400 dark:text-stone-500">
          Select both oils to see compatibility
        </p>
      </div>
    )
  }

  if (pairing === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-700 dark:bg-stone-900/40">
        <div className="mb-3 h-10 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />
        <p className="mb-1 font-serif font-semibold text-stone-500 dark:text-stone-400">No Data</p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          No pairing data recorded for this combination.
        </p>
      </div>
    )
  }

  const rating = pairing?.rating as Rating
  const info = RATINGS[rating] ?? RATINGS.GOOD

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border p-6 text-center ${info.bg} ${info.border}`}
    >
      <div className={`mb-3 h-12 w-12 rounded-full ${info.dot}`} />
      <p className={`font-serif text-2xl font-bold ${info.text}`}>{info.label}</p>
      <div className="my-3 w-8 border-t border-stone-300 dark:border-stone-600" />
      <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {pairing?.reason}
      </p>
    </div>
  )
}

function OilSlotPlaceholder({ side }: { side: 'A' | 'B' }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center dark:border-stone-700 dark:bg-stone-900/40">
      <p className="text-sm text-stone-400 dark:text-stone-500">Select Oil {side} above</p>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

export function OilCompare({ oils, pairingMap }: Props) {
  const [aId, setAId] = useState<string | null>(null)
  const [bId, setBId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount + listen for external changes (e.g. AddToCompareButton on the same page in another mounted location)
  useEffect(() => {
    const apply = () => {
      const slots = loadCompare()
      setAId(slots?.slotA?.id ?? null)
      setBId(slots?.slotB?.id ?? null)
    }
    apply()
    setHydrated(true)
    window.addEventListener('storage', apply)
    window.addEventListener(COMPARE_CHANGE_EVENT, apply)
    return () => {
      window.removeEventListener('storage', apply)
      window.removeEventListener(COMPARE_CHANGE_EVENT, apply)
    }
  }, [])

  // Persist on change (skip writes that came from the listener — those are already in storage)
  useEffect(() => {
    if (!hydrated) return
    const current = loadCompare()
    const aSame = (current?.slotA?.id ?? null) === aId
    const bSame = (current?.slotB?.id ?? null) === bId
    if (aSame && bSame) return
    const next: { v: 2; slotA?: { id: string; name: string }; slotB?: { id: string; name: string } } = { v: 2 }
    if (aId) {
      const oil = oils.find((o) => o.id === aId)
      if (oil) next.slotA = { id: oil.id, name: oil.name }
    }
    if (bId) {
      const oil = oils.find((o) => o.id === bId)
      if (oil) next.slotB = { id: oil.id, name: oil.name }
    }
    saveCompare(next)
  }, [hydrated, aId, bId, oils])

  const oilA = useMemo(() => oils.find((o) => o.id === aId) ?? null, [oils, aId])
  const oilB = useMemo(() => oils.find((o) => o.id === bId) ?? null, [oils, bId])

  const pairing = useMemo<PairingData | null | undefined>(() => {
    if (!aId || !bId || aId === bId) return undefined
    return pairingMap[pairingKey(aId, bId)] ?? null
  }, [aId, bId, pairingMap])

  const sameOilSelected = aId && bId && aId === bId

  return (
    <div>
      {/* Selectors */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <SlotSelector side="A" oils={oils} selectedOil={oilA} onSelect={setAId} />
        <div className="flex items-center justify-center lg:pt-7">
          <button
            onClick={() => { const t = aId; setAId(bId); setBId(t) }}
            title="Swap oils"
            disabled={!aId && !bId}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            ⇄
          </button>
        </div>
        <SlotSelector side="B" oils={oils} selectedOil={oilB} onSelect={setBId} />
      </div>

      {sameOilSelected ? (
        <div className="py-16 text-center text-stone-400 dark:text-stone-500">
          <p>Select two <em>different</em> oils to compare.</p>
        </div>
      ) : !aId && !bId ? (
        <div className="py-20 text-center">
          <div className="mb-4 text-5xl">⚗️</div>
          <p className="text-lg text-stone-500 dark:text-stone-400">
            Select two oils above to compare them
          </p>
          <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
            You&apos;ll see their full profiles side by side along with the compatibility rating.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_220px_1fr]">
          {oilA ? <OilProfileCard oil={oilA} side="A" /> : <OilSlotPlaceholder side="A" />}

          <CompatibilityResult pairing={pairing} oilA={oilA} oilB={oilB} />

          {oilB ? <OilProfileCard oil={oilB} side="B" /> : <OilSlotPlaceholder side="B" />}
        </div>
      )}
    </div>
  )
}
