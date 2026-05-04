import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OilCard } from '@/components/oils/OilCard'
import type { OilSummary } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Oil Library',
  description: 'Browse 30 essential oils and 15 carrier oils with benefits, origins, and pairing information.',
}

interface OilsPageProps {
  searchParams: Promise<{ type?: string; q?: string }>
}

export default async function OilsPage({ searchParams }: OilsPageProps) {
  const { type, q } = await searchParams

  const oils = await prisma.oil.findMany({
    where: {
      ...(type === 'ESSENTIAL' || type === 'CARRIER' ? { type } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { botanicalName: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: {
      id: true,
      name: true,
      botanicalName: true,
      type: true,
      aroma: true,
      benefits: true,
      description: true,
      consistency: true,
      absorbency: true,
      dilutionRateMax: true,
      imageUrl: true,
      imageAlt: true,
      buyUrl: true,
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  const carriers = oils.filter((o) => o.type === 'CARRIER') as OilSummary[]
  const essentials = oils.filter((o) => o.type === 'ESSENTIAL') as OilSummary[]
  const isFiltered = !!(q || type)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Oil Library</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {oils.length} oil{oils.length !== 1 ? 's' : ''}{isFiltered ? ' found' : ''} — click any oil to see its full profile, benefits, and pairing information.
        </p>
      </div>

      {/* Filters */}
      <form className="mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name or botanical name…"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <div className="flex rounded-md border border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800">
          {[
            { label: 'All', value: '' },
            { label: 'Carriers', value: 'CARRIER' },
            { label: 'Essential Oils', value: 'ESSENTIAL' },
          ].map((f) => (
            <a
              key={f.value}
              href={`/oils${f.value ? `?type=${f.value}` : ''}${q ? `${f.value ? '&' : '?'}q=${q}` : ''}`}
              className={`px-4 py-2 text-sm transition-colors first:rounded-l-md last:rounded-r-md ${
                (type ?? '') === f.value
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-600 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          Search
        </button>
        {isFiltered && (
          <Link
            href="/oils"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Clear
          </Link>
        )}
      </form>

      {oils.length === 0 ? (
        <div className="py-20 text-center text-stone-400 dark:text-stone-500">
          <p className="text-lg">No oils found.</p>
          {isFiltered ? (
            <p className="mt-2 text-sm">
              Try a different search term, or{' '}
              <Link href="/oils" className="text-amber-700 underline hover:text-amber-600 dark:text-amber-500">
                clear the filter
              </Link>
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
    </div>
  )
}
