'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { pairingKey } from '@/lib/pairing-utils'

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

// ── Searchable combobox ────────────────────────────────────────────────────

function OilCombobox({
  oils,
  selectedId,
  onSelect,
  label,
  placeholder,
}: {
  oils: DetailedOil[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  label: string
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOil = oils.find((o) => o.id === selectedId) ?? null
  const displayValue = open ? query : (selectedOil?.name ?? query)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const pool = q
      ? oils.filter(
          (o) => o.name.toLowerCase().includes(q) || o.botanicalName.toLowerCase().includes(q),
        )
      : oils
    return pool.slice(0, 15)
  }, [oils, query])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="flex-1 min-w-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onSelect(null)
          }}
          onFocus={() => { setOpen(true); setQuery('') }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
        />
        {selectedOil && !open ? (
          <button
            onClick={() => { onSelect(null); setQuery('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Clear"
          >
            ×
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">▾</span>
        )}
        {open && filtered.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800">
            {filtered.map((o) => (
              <li
                key={o.id}
                className="cursor-pointer px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-stone-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(o.id); setQuery(''); setOpen(false) }}
              >
                <span className="font-medium text-stone-800 dark:text-stone-100">{o.name}</span>
                <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{o.botanicalName}</span>
                <span className={`ml-2 text-xs ${o.type === 'ESSENTIAL' ? 'text-amber-600' : 'text-sky-600'}`}>
                  {o.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <OilCombobox
          oils={oils}
          selectedId={aId}
          onSelect={setAId}
          label="Oil A"
          placeholder="Search by name or botanical…"
        />
        <div className="hidden sm:flex sm:items-end sm:pb-2.5">
          <button
            onClick={() => { setAId(bId); setBId(aId) }}
            title="Swap oils"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            ⇄
          </button>
        </div>
        <OilCombobox
          oils={oils}
          selectedId={bId}
          onSelect={setBId}
          label="Oil B"
          placeholder="Search by name or botanical…"
        />
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
