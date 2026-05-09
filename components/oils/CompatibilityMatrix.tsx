'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { pairingKey } from '@/lib/pairing-utils'
import { useDragScroll } from '@/lib/use-drag-scroll'

type Rating = 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE'
type OilType = 'ESSENTIAL' | 'CARRIER'

interface Oil {
  id: string
  name: string
  botanicalName: string
  type: OilType
}

interface PairingData {
  rating: string
  reason: string
}

interface TooltipState {
  top: number
  left: number
  rowOil: Oil
  colOil: Oil
  pairing: PairingData | null
}

const TOOLTIP_W = 288 // matches max-w-72
const TOOLTIP_H_EST = 130
const VIEWPORT_MARGIN = 8

function placeTooltip(rect: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top = rect.bottom + VIEWPORT_MARGIN
  if (top + TOOLTIP_H_EST > vh - VIEWPORT_MARGIN) {
    top = rect.top - TOOLTIP_H_EST - VIEWPORT_MARGIN
  }
  top = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - TOOLTIP_H_EST - VIEWPORT_MARGIN))
  let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - TOOLTIP_W - VIEWPORT_MARGIN))
  return { top, left }
}

interface Props {
  oils: Oil[]
  pairingMap: Record<string, PairingData>
}

const RATINGS: { key: Rating; label: string; dot: string; text: string }[] = [
  { key: 'EXCELLENT', label: 'Excellent', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  { key: 'GOOD',      label: 'Good',      dot: 'bg-sky-400',     text: 'text-sky-700 dark:text-sky-400' },
  { key: 'CAUTION',   label: 'Caution',   dot: 'bg-amber-400',   text: 'text-amber-700 dark:text-amber-400' },
  { key: 'AVOID',     label: 'Avoid',     dot: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400' },
  { key: 'UNSAFE',    label: 'Unsafe',    dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-400' },
]

const RATING_MAP = Object.fromEntries(RATINGS.map((r) => [r.key, r])) as Record<Rating, (typeof RATINGS)[0]>

type FilterMode = 'all' | 'ESSENTIAL' | 'CARRIER'

export function CompatibilityMatrix({ oils, pairingMap }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [selectedCol, setSelectedCol] = useState<string | null>(null)
  const [rowSearch, setRowSearch] = useState('')
  const [colSearch, setColSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  useDragScroll(scrollRef)

  const typeFilteredOils = filter === 'all' ? oils : oils.filter((o) => o.type === filter)

  const rowOils = useMemo(() => {
    const q = rowSearch.toLowerCase()
    return q
      ? typeFilteredOils.filter(
          (o) => o.name.toLowerCase().includes(q) || o.botanicalName.toLowerCase().includes(q),
        )
      : typeFilteredOils
  }, [typeFilteredOils, rowSearch])

  const colOils = useMemo(() => {
    const q = colSearch.toLowerCase()
    return q
      ? typeFilteredOils.filter(
          (o) => o.name.toLowerCase().includes(q) || o.botanicalName.toLowerCase().includes(q),
        )
      : typeFilteredOils
  }, [typeFilteredOils, colSearch])

  const showTooltip = useCallback(
    (e: React.SyntheticEvent<HTMLElement>, row: Oil, col: Oil) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const key = pairingKey(row.id, col.id)
      setTooltip({ ...placeTooltip(rect), rowOil: row, colOil: col, pairing: pairingMap[key] ?? null })
    },
    [pairingMap],
  )

  // Dismiss tooltip on tap-outside (mobile) and on scroll (rect would be stale).
  useEffect(() => {
    if (!tooltip) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (tooltipRef.current?.contains(target)) return
      if (scrollRef.current?.contains(target)) return
      setTooltip(null)
    }
    const dismiss = () => setTooltip(null)
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [tooltip])

  const toggleRow = useCallback((id: string) => setSelectedRow((p) => (p === id ? null : id)), [])
  const toggleCol = useCallback((id: string) => setSelectedCol((p) => (p === id ? null : id)), [])

  const hasAxisFilters = rowSearch || colSearch || selectedRow || selectedCol

  return (
    <div onMouseLeave={() => setTooltip(null)}>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 md:hidden">
        Rotate to landscape for the best matrix experience.
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="mb-4 space-y-3">
        {/* Type filter + legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-md border border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800">
            {(
              [
                { label: 'All Oils', value: 'all' },
                { label: 'Carriers only', value: 'CARRIER' },
                { label: 'Essentials only', value: 'ESSENTIAL' },
              ] as { label: string; value: FilterMode }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
                  filter === opt.value
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {RATINGS.map((r) => (
              <span key={r.key} className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-full ${r.dot}`} />
                <span className="text-xs text-stone-600 dark:text-stone-400">{r.label}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-stone-300 dark:bg-stone-500" />
              <span className="text-xs text-stone-600 dark:text-stone-400">No data</span>
            </span>
          </div>
        </div>

        {/* Axis search */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Rows:</span>
            <input
              type="text"
              value={rowSearch}
              onChange={(e) => setRowSearch(e.target.value)}
              placeholder="Filter rows…"
              className="w-36 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-base md:text-sm focus:border-amber-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Columns:</span>
            <input
              type="text"
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              placeholder="Filter columns…"
              className="w-36 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-base md:text-sm focus:border-amber-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
            />
          </div>
          {hasAxisFilters && (
            <button
              onClick={() => { setRowSearch(''); setColSearch(''); setSelectedRow(null); setSelectedCol(null) }}
              className="text-xs text-amber-700 hover:underline dark:text-amber-500"
            >
              Reset
            </button>
          )}
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Click a row or column header to highlight it.
          </span>
        </div>
      </div>

      {/* ── Matrix ────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="cursor-grab select-none overflow-auto rounded-xl border border-stone-200 dark:border-stone-700">
        <table className="border-separate" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {/* corner cell */}
              <th
                className="sticky left-0 z-20 border-b border-r border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                style={{ width: 160, minWidth: 160 }}
              />
              {colOils.map((col) => {
                const isHighlighted = selectedCol === col.id
                return (
                  <th
                    key={col.id}
                    onClick={() => toggleCol(col.id)}
                    title={`Click to highlight column: ${col.name}`}
                    className={`cursor-pointer border-b border-stone-200 transition-colors dark:border-stone-700 ${
                      isHighlighted
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-white hover:bg-amber-50 dark:bg-stone-900 dark:hover:bg-amber-950/20'
                    }`}
                    style={{ width: 30, minWidth: 30, height: 140 }}
                  >
                    <div className="flex h-full items-end justify-center pb-1">
                      <span
                        className={`block max-h-32 overflow-hidden whitespace-nowrap text-[11px] font-medium transition-colors ${
                          isHighlighted
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {col.name}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rowOils.map((row) => {
              const isRowHighlighted = selectedRow === row.id
              return (
                <tr key={row.id}>
                  {/* row label */}
                  <td
                    onClick={() => toggleRow(row.id)}
                    title={`Click to highlight row: ${row.name}`}
                    className={`sticky left-0 z-10 cursor-pointer border-r border-stone-200 px-2 py-0.5 transition-colors dark:border-stone-700 ${
                      isRowHighlighted
                        ? 'bg-amber-100 dark:bg-amber-950'
                        : 'bg-white dark:bg-stone-900'
                    }`}
                    style={{ width: 160, minWidth: 160 }}
                  >
                    <span className={`text-[11px] font-medium leading-tight ${isRowHighlighted ? 'text-amber-800 dark:text-amber-300' : 'text-stone-700 dark:text-stone-300'}`}>
                      {row.name}
                    </span>
                    <Link
                      href={`/oils/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 text-[9px] text-amber-600 opacity-60 hover:opacity-100 dark:text-amber-500"
                      title={`View ${row.name} profile`}
                    >↗</Link>
                    <span className="block text-[9px] text-stone-400 dark:text-stone-500">
                      {row.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
                    </span>
                  </td>

                  {/* cells */}
                  {colOils.map((col) => {
                    const isSame = row.id === col.id
                    const isColHighlighted = selectedCol === col.id
                    const isIntersection = isRowHighlighted && isColHighlighted

                    if (isSame) {
                      return (
                        <td
                          key={col.id}
                          className={`relative z-0 ${
                            isRowHighlighted || isColHighlighted
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-stone-100 dark:bg-stone-800'
                          }`}
                          style={{ width: 30, height: 30 }}
                        />
                      )
                    }

                    const key = pairingKey(row.id, col.id)
                    const pairing = pairingMap[key]
                    const ratingInfo = pairing ? RATING_MAP[pairing.rating as Rating] : null

                    const cellBg = isIntersection
                      ? 'bg-amber-200 dark:bg-amber-800/50'
                      : isRowHighlighted || isColHighlighted
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'bg-white dark:bg-stone-900'

                    return (
                      <td
                        key={col.id}
                        className={`relative z-0 cursor-pointer transition-colors hover:brightness-95 ${cellBg}`}
                        style={{ width: 30, height: 30 }}
                        onMouseEnter={(e) => showTooltip(e, row, col)}
                        onClick={(e) => showTooltip(e, row, col)}
                      >
                        <div className="flex h-full items-center justify-center">
                          <span
                            className={`inline-block rounded-full transition-transform hover:scale-125 ${
                              ratingInfo ? ratingInfo.dot : 'bg-stone-200 dark:bg-stone-600'
                            }`}
                            style={{ width: 12, height: 12 }}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Tooltip ───────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-72 rounded-lg border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-800"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <button
            onClick={() => setTooltip(null)}
            aria-label="Close"
            className="absolute right-1.5 top-1.5 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200 md:hidden"
          >
            ✕
          </button>
          <p className="pr-6 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {tooltip.rowOil.name} &times; {tooltip.colOil.name}
          </p>
          {tooltip.pairing ? (
            <>
              <p className={`mt-0.5 text-xs font-medium ${RATING_MAP[tooltip.pairing.rating as Rating]?.text ?? ''}`}>
                {RATING_MAP[tooltip.pairing.rating as Rating]?.label ?? tooltip.pairing.rating}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {tooltip.pairing.reason}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">No pairing data recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}
