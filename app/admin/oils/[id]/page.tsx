import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OilForm } from '../../OilForm'
import { updateOil } from '../../actions'
import { DeleteOilButton } from '../../DeleteOilButton'
import { EnrichOilButton } from './EnrichOilButton'
import { OilPairings } from './OilPairings'

export const dynamic = 'force-dynamic'

function enrichedRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const oil = await prisma.oil.findUnique({ where: { id }, select: { name: true } })
  return { title: oil ? `Edit ${oil.name} — Admin` : 'Edit Oil' }
}

export default async function EditOilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [oil, pairingsRaw, otherOils] = await Promise.all([
    prisma.oil.findUnique({ where: { id } }),
    prisma.oilPairing.findMany({
      where: { OR: [{ oilAId: id }, { oilBId: id }] },
      include: {
        oilA: { select: { id: true, name: true } },
        oilB: { select: { id: true, name: true } },
      },
    }),
    prisma.oil.findMany({ where: { NOT: { id } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  if (!oil) notFound()

  const pairings = pairingsRaw.map((p) => ({
    id: p.id,
    otherId: p.oilAId === id ? p.oilBId : p.oilAId,
    otherName: p.oilAId === id ? p.oilB.name : p.oilA.name,
    rating: p.rating as 'EXCELLENT' | 'GOOD' | 'CAUTION' | 'AVOID' | 'UNSAFE',
    reason: p.reason,
  })).sort((a, b) => a.otherName.localeCompare(b.otherName))

  const boundUpdate = updateOil.bind(null, id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">{oil.name}</h1>
          <p className="mt-1 text-sm italic text-stone-500 dark:text-stone-400">{oil.botanicalName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-start gap-2">
            <Link
              href={`/oils/${oil.id}`}
              target="_blank"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              View ↗
            </Link>
            {process.env.ANTHROPIC_API_KEY && <EnrichOilButton oilId={oil.id} />}
            <DeleteOilButton id={oil.id} name={oil.name} />
          </div>
          {oil.enrichedAt ? (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Enriched {enrichedRelative(oil.enrichedAt)}{oil.enrichmentModel ? `, ${oil.enrichmentModel}` : ''}
            </p>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">Not enriched yet</p>
          )}
        </div>
      </div>
      <OilForm oil={oil} action={boundUpdate} submitLabel="Save Changes" />
      <OilPairings oilId={id} pairings={pairings} otherOils={otherOils} />
    </div>
  )
}
