import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OilCompare } from '@/components/oils/OilCompare'
import { buildPairingMap } from '@/lib/pairing-utils'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Oil Compatibility',
  description: 'Compare any two oils side-by-side: see their full profiles and how well they work together.',
}

export default async function ComparePage() {
  const [oils, pairings] = await Promise.all([
    prisma.oil.findMany({
      select: {
        id: true,
        name: true,
        botanicalName: true,
        type: true,
        description: true,
        aroma: true,
        benefits: true,
        contraindications: true,
        origin: true,
        consistency: true,
        absorbency: true,
        dilutionRateMax: true,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    prisma.oilPairing.findMany({
      select: { oilAId: true, oilBId: true, rating: true, reason: true },
    }),
  ])

  const pairingMap = buildPairingMap(pairings)
  const { tooltipsEnabled } = await getSettings()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
            Oil Compatibility
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Select two oils to compare their profiles and see how well they work together.
          </p>
        </div>
        <Link
          href="/oils/matrix"
          className="shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Full Matrix →
        </Link>
      </div>

      <OilCompare oils={oils} pairingMap={pairingMap} tooltipsEnabled={tooltipsEnabled} />
    </div>
  )
}
