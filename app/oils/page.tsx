import { prisma } from '@/lib/prisma'
import { OilLibrary } from '@/components/oils/OilLibrary'
import type { OilSummary } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Oil Library',
  description: 'Browse 30 essential oils and 25 carrier oils with benefits, origins, and pairing information.',
}

interface OilsPageProps {
  searchParams: Promise<{ type?: string; q?: string }>
}

export default async function OilsPage({ searchParams }: OilsPageProps) {
  const { type, q } = await searchParams

  const oils = (await prisma.oil.findMany({
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
  })) as OilSummary[]

  const initialType = type === 'CARRIER' || type === 'ESSENTIAL' ? type : 'all'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Oil Library</h1>
      </div>

      <OilLibrary oils={oils} initialQuery={q ?? ''} initialType={initialType} />
    </div>
  )
}
