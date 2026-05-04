import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CompatibilityMatrix } from '@/components/oils/CompatibilityMatrix'
import { buildPairingMap } from '@/lib/pairing-utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Compatibility Matrix',
  description: 'See how every oil pairs with every other oil — colour-coded by compatibility rating.',
}

export default async function MatrixPage() {
  const [oils, pairings] = await Promise.all([
    prisma.oil.findMany({
      select: { id: true, name: true, botanicalName: true, type: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }),
    prisma.oilPairing.findMany({
      select: { oilAId: true, oilBId: true, rating: true, reason: true },
    }),
  ])

  const pairingMap = buildPairingMap(pairings)

  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Compatibility Matrix</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            {oils.length} oils · {pairings.length} recorded pairings. Hover a cell to see why.
          </p>
        </div>
        <Link
          href="/oils/compare"
          className="shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          ← Compare two oils
        </Link>
      </div>
      <CompatibilityMatrix oils={oils} pairingMap={pairingMap} />
    </div>
  )
}
