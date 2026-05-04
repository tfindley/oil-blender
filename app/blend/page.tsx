import { prisma } from '@/lib/prisma'
import { BlendBuilder } from '@/components/blend/BlendBuilder'
import type { OilSummary } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Build a Blend — Potions & Lotions',
  description: 'Create a custom massage oil blend with compatibility scoring and a printable recipe card.',
}

export default async function BlendPage() {
  const oils = await prisma.oil.findMany({
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
    },
    orderBy: { name: 'asc' },
  })

  const carriers = oils.filter((o: typeof oils[number]) => o.type === 'CARRIER') as OilSummary[]
  const essentials = oils.filter((o: typeof oils[number]) => o.type === 'ESSENTIAL') as OilSummary[]

  if (oils.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mb-4 text-4xl">🌿</div>
        <h1 className="mb-4 font-serif text-2xl font-bold text-stone-800">
          Oil library is empty
        </h1>
        <p className="text-stone-600">
          Run <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">npm run enrich</code> to populate the database with oil data.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Build Your Blend</h1>
        <p className="mt-2 text-stone-600">
          Choose a carrier oil, add essential oils, and see your compatibility score in real time.
        </p>
      </div>
      <BlendBuilder carriers={carriers} essentials={essentials} />
    </div>
  )
}
