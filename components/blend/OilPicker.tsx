'use client'

import type { ReactNode } from 'react'
import type { OilSummary, PairingRating } from '@/types'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export interface PickerPairing {
  oilAId: string
  oilBId: string
  rating: PairingRating
  reason: string
}

interface OilPickerProps {
  title: string
  noun: string
  oils: OilSummary[]
  selectedOils: OilSummary[]
  maxCount: number
  findUnsafe: (oil: OilSummary) => PickerPairing | undefined
  onToggle: (oil: OilSummary) => void

  isOpen: boolean
  onOpen: () => void

  mode: 'search' | 'browse'
  onModeChange: (m: 'search' | 'browse') => void
  searchValue: string
  onSearchChange: (s: string) => void

  footer?: ReactNode
}

function buildSubtitle(selected: OilSummary[], maxCount: number, noun: string, isOpen: boolean): string {
  const n = selected.length
  if (isOpen) return n === 0 ? `Select up to ${maxCount} ${noun}.` : `${n} of ${maxCount} selected`
  if (n === 0) return 'None selected'
  if (n <= 2) return selected.map((s) => s.name).join(' + ')
  return `${n} ${noun}`
}

export function OilPicker({
  title,
  noun,
  oils,
  selectedOils,
  maxCount,
  findUnsafe,
  onToggle,
  isOpen,
  onOpen,
  mode,
  onModeChange,
  searchValue,
  onSearchChange,
  footer,
}: OilPickerProps) {
  const selectedIds = new Set(selectedOils.map((o) => o.id))
  const subtitle = buildSubtitle(selectedOils, maxCount, noun, isOpen)
  const filtered = oils.filter((o) =>
    !searchValue ||
    o.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (o.botanicalName ?? '').toLowerCase().includes(searchValue.toLowerCase())
  )

  const atMax = selectedIds.size >= maxCount

  function handleClick(oil: OilSummary, isSelected: boolean, unsafe: PickerPairing | undefined) {
    if (unsafe) return
    if (!isSelected && atMax) return
    onToggle(oil)
  }

  return (
    <Card>
      <CardHeader>
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={onOpen}
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">{title}</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isOpen && (
              <div className="flex rounded-md border border-stone-200 text-xs dark:border-stone-600">
                <button
                  onClick={() => onModeChange('search')}
                  className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                    mode === 'search'
                      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                      : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => onModeChange('browse')}
                  className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                    mode === 'browse'
                      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                      : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700'
                  }`}
                >
                  Browse
                </button>
              </div>
            )}
            <span className="text-stone-400 dark:text-stone-500">{isOpen ? '▲' : '▼'}</span>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardBody className="space-y-3">
          {atMax && (
            <p className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-500 dark:bg-stone-700 dark:text-stone-400">
              Maximum {maxCount} {noun} reached — deselect one to add another.
            </p>
          )}

          {mode === 'search' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or botanical name…"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
              />
              {searchValue && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-600 dark:bg-stone-800">
                  {filtered.slice(0, 8).map((o) => {
                    const isSelected = selectedIds.has(o.id)
                    const unsafe = !isSelected ? findUnsafe(o) : undefined
                    const blockedByMax = !isSelected && !unsafe && atMax
                    return (
                      <button
                        key={o.id}
                        onClick={() => handleClick(o, isSelected, unsafe)}
                        disabled={!!unsafe || blockedByMax}
                        title={unsafe ? `Cannot add: ${unsafe.reason}` : o.description}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                          unsafe
                            ? 'cursor-not-allowed bg-red-50 text-red-400 dark:bg-red-950/50 dark:text-red-500'
                            : blockedByMax
                              ? 'cursor-not-allowed text-stone-400 dark:text-stone-500'
                              : isSelected
                                ? 'bg-stone-50 text-stone-900 dark:bg-stone-700 dark:text-stone-100'
                                : 'text-stone-800 hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-amber-950/30'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{o.name}</span>
                          <span className="ml-2 text-xs italic text-stone-400 dark:text-stone-500">{o.botanicalName}</span>
                        </div>
                        {unsafe ? (
                          <span className="text-xs text-red-500">🚫 Unsafe</span>
                        ) : isSelected ? (
                          <span className="text-xs text-amber-700 dark:text-amber-400">✓ Selected</span>
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500">{o.aroma}</span>
                        )}
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <p className="px-3 py-2.5 text-sm text-stone-400 dark:text-stone-500">No oils found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'browse' && (
            <div>
              <input
                type="text"
                placeholder="Filter…"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="mb-3 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((o) => {
                  const isSelected = selectedIds.has(o.id)
                  const unsafe = !isSelected ? findUnsafe(o) : undefined
                  const blockedByMax = !isSelected && !unsafe && atMax
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleClick(o, isSelected, unsafe)}
                      disabled={!!unsafe || blockedByMax}
                      title={unsafe ? `Cannot add: ${unsafe.reason}` : undefined}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        unsafe
                          ? 'cursor-not-allowed border-red-100 bg-red-50/50 opacity-60 dark:border-red-900 dark:bg-red-950/20'
                          : blockedByMax
                            ? 'cursor-not-allowed border-stone-200 bg-stone-50 opacity-60 dark:border-stone-700 dark:bg-stone-800'
                            : isSelected
                              ? 'border-amber-500 bg-white shadow-sm dark:border-amber-500 dark:bg-stone-700'
                              : 'border-stone-200 bg-white hover:bg-amber-50/40 dark:border-stone-600 dark:bg-stone-700 dark:hover:bg-amber-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-stone-800 dark:text-stone-100">{o.name}</p>
                          <p className="text-xs italic text-stone-400 dark:text-stone-500">{o.botanicalName}</p>
                        </div>
                        {unsafe && <span className="shrink-0 text-xs text-red-500">🚫</span>}
                        {isSelected && !unsafe && <span className="shrink-0 text-xs text-amber-700 dark:text-amber-400">✓</span>}
                      </div>
                      <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">{o.aroma}</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {o.benefits.slice(0, 2).map((b, i) => (
                          <li key={i} className="text-xs text-stone-500 dark:text-stone-400">• {b}</li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-stone-400 dark:text-stone-500">No oils found.</p>
                )}
              </div>
            </div>
          )}

          {footer}
        </CardBody>
      )}
    </Card>
  )
}
