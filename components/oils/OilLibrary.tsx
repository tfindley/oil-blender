'use client'

import { useMemo, useState } from 'react'
import { OilCard } from '@/components/oils/OilCard'
import type { OilSummary } from '@/types'

type TypeFilter = 'all' | 'CARRIER' | 'ESSENTIAL'

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Carriers', value: 'CARRIER' },
  { label: 'Essential Oils', value: 'ESSENTIAL' },
]

export function OilLibrary({
  oils,
  initialQuery = '',
  initialType = 'all',
}: {
  oils: OilSummary[]
  initialQuery?: string
  initialType?: TypeFilter
}) {
  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState<TypeFilter>(initialType)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return oils.filter((o) => {
      if (type !== 'all' && o.type !== type) return false
      if (!q) return true
      return (
        o.name.toLowerCase().includes(q) ||
        (o.botanicalName ?? '').toLowerCase().includes(q)
      )
    })
  }, [oils, query, type])

  const carriers = visible.filter((o) => o.type === 'CARRIER')
  const essentials = visible.filter((o) => o.type === 'ESSENTIAL')
  const isFiltered = query.trim() !== '' || type !== 'all'

  return (
    <>
      <div className="mb-2 text-stone-600 dark:text-stone-400">
        {visible.length} oil{visible.length !== 1 ? 's' : ''}{isFiltered ? ' found' : ''} — click any oil to see its full profile, benefits, and pairing information.
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or botanical name…"
          className="flex-1 min-w-[220px] rounded-md border border-stone-300 bg-white px-3 py-2 text-base sm:text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <div className="flex rounded-md border border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setType(f.value)}
              className={`px-4 py-2 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
                type === f.value
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={() => { setQuery(''); setType('all') }}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Clear
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="py-20 text-center text-stone-400 dark:text-stone-500">
          <p className="text-lg">No oils found.</p>
          {isFiltered ? (
            <p className="mt-2 text-sm">
              Try a different search term, or{' '}
              <button
                type="button"
                onClick={() => { setQuery(''); setType('all') }}
                className="text-amber-700 underline hover:text-amber-600 dark:text-amber-500"
              >
                clear the filter
              </button>
              .
            </p>
          ) : (
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-600">
              The oil library is empty. Contact the site administrator to add oils.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {carriers.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold text-stone-700 dark:text-stone-300">Carrier Oils ({carriers.length})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {carriers.map((oil) => <OilCard key={oil.id} oil={oil} />)}
              </div>
            </section>
          )}
          {essentials.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold text-stone-700 dark:text-stone-300">Essential Oils ({essentials.length})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {essentials.map((oil) => <OilCard key={oil.id} oil={oil} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
