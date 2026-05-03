import { prisma } from '@/lib/prisma'
import { OilCard } from '@/components/oils/OilCard'
import type { OilSummary } from '@/types'

export const metadata = {
  title: 'Oil Library — Potions & Lotions',
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
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      name: true,
      type: true,
      aroma: true,
      benefits: true,
      description: true,
      consistency: true,
      absorbency: true,
      dilutionRateMax: true,
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  const carriers = oils.filter((o) => o.type === 'CARRIER') as OilSummary[]
  const essentials = oils.filter((o) => o.type === 'ESSENTIAL') as OilSummary[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Oil Library</h1>
        <p className="mt-2 text-stone-600">
          {oils.length} oils — click any oil to see its full profile, benefits, and pairing information.
        </p>
      </div>

      {/* Filters */}
      <form className="mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search oils…"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <div className="flex rounded-md border border-stone-300 bg-white">
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
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Search
        </button>
      </form>

      {oils.length === 0 ? (
        <div className="py-20 text-center text-stone-400">
          <p className="text-lg">No oils found.</p>
          <p className="mt-1 text-sm">
            Run <code className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">npm run enrich</code> to populate the database.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {carriers.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold text-stone-700">Carrier Oils ({carriers.length})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {carriers.map((oil) => <OilCard key={oil.id} oil={oil} />)}
              </div>
            </section>
          )}
          {essentials.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold text-stone-700">Essential Oils ({essentials.length})</h2>
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
