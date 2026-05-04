import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BlendMetaForm } from './BlendMetaForm'

export const dynamic = 'force-dynamic'

export default async function AdminBlendEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const blend = await prisma.blend.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { oil: { select: { name: true, type: true } } },
        orderBy: [{ oil: { type: 'asc' } }],
      },
    },
  })

  if (!blend) notFound()

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const essentials = blend.ingredients.filter((i) => i.oil.type === 'ESSENTIAL')
  const carriers = blend.ingredients.filter((i) => i.oil.type === 'CARRIER')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">{blend.name}</h1>
      <div className="mb-8 flex flex-wrap gap-4 text-sm text-stone-500 dark:text-stone-400">
        <span>Grade {blend.grade}</span>
        <span>·</span>
        <span>{blend.totalVolumeMl}ml · {(blend.dilutionRate * 100).toFixed(0)}% dilution</span>
        <span>·</span>
        <span>{blend.viewCount} view{blend.viewCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>Created {fmt(blend.createdAt)}</span>
        <span>·</span>
        <span>Last accessed {fmt(blend.lastAccessedAt)}</span>
      </div>

      {/* Ingredients (read-only) */}
      <div className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Ingredients</p>
        <div className="space-y-1">
          {carriers.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-700 dark:text-stone-300">{i.oil.name}</span>
              <span className="text-xs text-stone-400">carrier · {i.percentagePct.toFixed(1)}% · {i.volumeMl.toFixed(2)}ml</span>
            </div>
          ))}
          {essentials.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-700 dark:text-stone-300">{i.oil.name}</span>
              <span className="text-xs text-stone-400">EO · {i.percentagePct.toFixed(1)}% · {i.volumeMl.toFixed(2)}ml · ~{Math.round(i.volumeMl * 20)} drops</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editable metadata */}
      <BlendMetaForm
        id={blend.id}
        initial={{
          authorName: blend.authorName ?? '',
          about: blend.about ?? '',
          isFeatured: blend.isFeatured,
          isPinned: blend.isPinned,
          isHidden: blend.isHidden,
        }}
      />
    </div>
  )
}
