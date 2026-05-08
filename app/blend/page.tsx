import { prisma } from '@/lib/prisma'
import { BlendBuilder } from '@/components/blend/BlendBuilder'
import type { OilSummary } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Build a Blend',
  description: 'Create a custom massage oil blend with compatibility scoring and a printable recipe card.',
}

const OIL_SELECT = {
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
} as const

export default async function BlendPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams

  const [oils, fromBlendData] = await Promise.all([
    prisma.oil.findMany({ select: OIL_SELECT, orderBy: { name: 'asc' } }),
    from
      ? prisma.blend.findUnique({
          where: { id: from },
          select: {
            totalVolumeMl: true,
            dilutionRate: true,
            ingredients: {
              select: {
                percentagePct: true,
                oil: { select: OIL_SELECT },
              },
            },
          },
        })
      : Promise.resolve(null),
  ])

  const carriers = oils.filter((o) => o.type === 'CARRIER') as OilSummary[]
  const essentials = oils.filter((o) => o.type === 'ESSENTIAL') as OilSummary[]

  let initialBlend: {
    carriers: Array<{ oil: OilSummary; percentagePct: number }>
    essentials: Array<{ oil: OilSummary; percentagePct: number }>
    totalVolumeMl: number
    dilutionRate: number
  } | undefined
  if (fromBlendData) {
    const carrierIngredients = fromBlendData.ingredients.filter((i) => i.oil.type === 'CARRIER')
    const totalCarrierPct = carrierIngredients.reduce((s, c) => s + c.percentagePct, 0)
    initialBlend = {
      carriers: carrierIngredients.map((c) => ({
        oil: c.oil as OilSummary,
        percentagePct: totalCarrierPct > 0
          ? (c.percentagePct / totalCarrierPct) * 100
          : 100 / carrierIngredients.length,
      })),
      essentials: fromBlendData.ingredients
        .filter((i) => i.oil.type === 'ESSENTIAL')
        .map((i) => ({ oil: i.oil as OilSummary, percentagePct: i.percentagePct })),
      totalVolumeMl: fromBlendData.totalVolumeMl,
      dilutionRate: fromBlendData.dilutionRate,
    }
  }

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
          Choose your carrier oils, add essential oils, and see your compatibility score in real time.
        </p>
      </div>
      <BlendBuilder carriers={carriers} essentials={essentials} initialBlend={initialBlend} />
    </div>
  )
}
