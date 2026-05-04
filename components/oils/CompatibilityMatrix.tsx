'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
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

const BADGE_STYLES: Record<string, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  GOOD:      'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  CAUTION:   'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  AVOID:     'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  UNSAFE:    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

function pairingKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

type FilterMode = 'all' | 'ESSENTIAL' | 'CARRIER'

// Searchable oil combobox
function OilCombobox({
  oils,
  selectedId,
  onSelect,
  placeholder,
}: {
  oils: Oil[]
  selectedId: string | null
  onSelect: (id: string | null) => void
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
    return pool.slice(0, 20)
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
    <div ref={containerRef} className="relative flex-1 min-w-0">
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
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 pr-8 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
      />
      {selectedOil && !open && (
        <button
          onClick={() => { onSelect(null); setQuery('') }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          aria-label="Clear"
        >
          ×
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800">
          {filtered.map((o) => (
            <li
              key={o.id}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-stone-700"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(o.id); setQuery(''); setOpen(false) }}
            >
              <span className="font-medium text-stone-800 dark:text-stone-100">{o.name}</span>
              <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">
                {o.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CompatibilityMatrix({ oils, pairingMap }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [selectedCol, setSelectedCol] = useState<string | null>(null)
  const [compareAId, setCompareAId] = useState<string | null>(null)
  const [compareBId, setCompareBId] = useState<string | null>(null)
  const [rowSearch, setRowSearch] = useState('')
  const [colSearch, setColSearch] = useState('')

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

  const comparePairing = useMemo(() => {
    if (!compareAId || !compareBId || compareAId === compareBId) return undefined
    return pairingMap[pairingKey(compareAId, compareBId)] ?? null
  }, [compareAId, compareBId, pairingMap])

  const compareOilA = useMemo(() => oils.find((o) => o.id === compareAId) ?? null, [oils, compareAId])
  const compareOilB = useMemo(() => oils.find((o) => o.id === compareBId) ?? null, [oils, compareBId])

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

  const toggleRow = useCallback((id: string) => setSelectedRow((p) => (p === id ? null : id)), [])
  const toggleCol = useCallback((id: string) => setSelectedCol((p) => (p === id ? null : id)), [])

  const hasAxisFilters = rowSearch || colSearch || selectedRow || selectedCol

  return (
    <div onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>

      {/* ── Quick Compare ─────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Quick Compare
        </h2>
        <div className="flex items-center gap-3">
          <OilCombobox oils={oils} selectedId={compareAId} onSelect={setCompareAId} placeholder="Oil A…" />
          <span className="shrink-0 text-sm text-stone-400">vs</span>
          <OilCombobox oils={oils} selectedId={compareBId} onSelect={setCompareBId} placeholder="Oil B…" />
        </div>

        {compareAId && compareBId && compareAId === compareBId && (
          <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">Select two different oils to compare.</p>
        )}

        {compareAId && compareBId && compareAId !== compareBId && (
          <div className="mt-3 rounded-lg bg-stone-50 p-3 dark:bg-stone-900/50">
            <p className="mb-2 font-semibold text-stone-800 dark:text-stone-100">
              {compareOilA?.name}{' '}
              <span className="font-normal text-stone-400">×</span>{' '}
              {compareOilB?.name}
            </p>
            {comparePairing === null ? (
              <p className="text-sm text-stone-400 dark:text-stone-500">No pairing data recorded for this combination.</p>
            ) : comparePairing ? (
              <>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[comparePairing.rating] ?? BADGE_STYLES.GOOD}`}>
                  {RATING_MAP[comparePairing.rating as Rating]?.label ?? comparePairing.rating}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  {comparePairing.reason}
                </p>
              </>
            ) : null}
            <div className="mt-2 flex gap-3 text-xs">
              {compareOilA && (
                <Link href={`/oils/${compareOilA.id}`} className="text-amber-700 hover:underline dark:text-amber-500">
                  {compareOilA.name} profile →
                </Link>
              )}
              {compareOilB && (
                <Link href={`/oils/${compareOilB.id}`} className="text-amber-700 hover:underline dark:text-amber-500">
                  {compareOilB.name} profile →
                </Link>
              )}
            </div>
          </div>
        )}
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
              className="w-36 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Columns:</span>
            <input
              type="text"
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              placeholder="Filter columns…"
              className="w-36 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
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
      <div className="overflow-auto rounded-xl border border-stone-200 dark:border-stone-700">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
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
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-white dark:bg-stone-900'
                    }`}
                    style={{ width: 160, minWidth: 160 }}
                  >
                    <Link
                      href={`/oils/${row.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`block text-[11px] font-medium leading-tight hover:text-amber-700 dark:hover:text-amber-400 ${
                        isRowHighlighted
                          ? 'text-amber-800 dark:text-amber-300'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {row.name}
                    </Link>
                    <span className="text-[9px] text-stone-400 dark:text-stone-500">
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
                          className={
                            isRowHighlighted || isColHighlighted
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-stone-100 dark:bg-stone-800'
                          }
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
                        className={`cursor-pointer transition-colors hover:brightness-95 ${cellBg}`}
                        style={{ width: 30, height: 30 }}
                        onMouseEnter={(e) => handleMouseEnter(e, row, col)}
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
          className="pointer-events-none fixed z-50 max-w-72 rounded-lg border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-800"
          style={{
            left: Math.min(
              tooltip.x + 14,
              typeof window !== 'undefined' ? window.innerWidth - 300 : tooltip.x + 14,
            ),
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
