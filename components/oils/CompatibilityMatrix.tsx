'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

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
  x: number
  y: number
  rowOil: Oil
  colOil: Oil
  pairing: PairingData | null
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

function pairingKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

type FilterMode = 'all' | 'ESSENTIAL' | 'CARRIER'

export function CompatibilityMatrix({ oils, pairingMap }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')

  const visibleOils = filter === 'all' ? oils : oils.filter((o) => o.type === filter)

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, row: Oil, col: Oil) => {
      const key = pairingKey(row.id, col.id)
      setTooltip({ x: e.clientX, y: e.clientY, rowOil: row, colOil: col, pairing: pairingMap[key] ?? null })
    },
    [pairingMap],
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
  }, [])

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {/* Filter */}
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

        {/* Legend */}
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

      {/* Scrollable matrix */}
      <div className="overflow-auto rounded-xl border border-stone-200 dark:border-stone-700">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {/* corner */}
              <th
                className="sticky left-0 z-20 border-b border-r border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                style={{ width: 160, minWidth: 160 }}
              />
              {visibleOils.map((col) => (
                <th
                  key={col.id}
                  className="border-b border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
                  style={{ width: 30, minWidth: 30, height: 140 }}
                >
                  <div className="flex h-full items-end justify-center pb-1">
                    <span
                      className="block max-h-32 overflow-hidden whitespace-nowrap text-[11px] font-medium text-stone-700 dark:text-stone-300"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {col.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleOils.map((row) => (
              <tr key={row.id} className="group">
                {/* row label */}
                <td
                  className="sticky left-0 z-10 border-r border-stone-200 bg-white px-2 py-0.5 dark:border-stone-700 dark:bg-stone-900"
                  style={{ width: 160, minWidth: 160 }}
                >
                  <Link
                    href={`/oils/${row.id}`}
                    className="block text-[11px] font-medium leading-tight text-stone-700 hover:text-amber-700 dark:text-stone-300 dark:hover:text-amber-400"
                  >
                    {row.name}
                  </Link>
                  <span className="text-[9px] text-stone-400 dark:text-stone-500">
                    {row.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
                  </span>
                </td>

                {/* cells */}
                {visibleOils.map((col) => {
                  if (row.id === col.id) {
                    return (
                      <td
                        key={col.id}
                        className="bg-stone-100 dark:bg-stone-800"
                        style={{ width: 30, height: 30 }}
                      />
                    )
                  }
                  const key = pairingKey(row.id, col.id)
                  const pairing = pairingMap[key]
                  const ratingInfo = pairing ? RATING_MAP[pairing.rating as Rating] : null

                  return (
                    <td
                      key={col.id}
                      className="cursor-pointer bg-white transition-colors hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800"
                      style={{ width: 30, height: 30 }}
                      onMouseEnter={(e) => handleMouseEnter(e, row, col)}
                    >
                      <div className="flex h-full items-center justify-center">
                        <span
                          className={`inline-block rounded-full transition-transform hover:scale-110 ${
                            ratingInfo ? ratingInfo.dot : 'bg-stone-200 dark:bg-stone-600'
                          }`}
                          style={{ width: 12, height: 12 }}
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-72 rounded-lg border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-800"
          style={{
            left: Math.min(tooltip.x + 14, typeof window !== 'undefined' ? window.innerWidth - 300 : tooltip.x + 14),
            top: tooltip.y - 8,
          }}
        >
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
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
