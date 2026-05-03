import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OilForm } from '../../OilForm'
import { updateOil, deleteOil } from '../../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const oil = await prisma.oil.findUnique({ where: { id }, select: { name: true } })
  return { title: oil ? `Edit ${oil.name} — Admin` : 'Edit Oil' }
}

export default async function EditOilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const oil = await prisma.oil.findUnique({ where: { id } })
  if (!oil) notFound()

  const boundUpdate = updateOil.bind(null, id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
        ← Admin
      </Link>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">{oil.name}</h1>
          <p className="mt-1 text-sm italic text-stone-500 dark:text-stone-400">{oil.botanicalName}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/oils/${oil.id}`}
            target="_blank"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            View ↗
          </Link>
          <form action={deleteOil.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={(e) => { if (!confirm(`Delete "${oil.name}"? This cannot be undone.`)) e.preventDefault() }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>
      <OilForm oil={oil} action={boundUpdate} submitLabel="Save Changes" />
    </div>
  )
}
