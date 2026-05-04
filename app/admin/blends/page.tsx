import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { AdminBlendActions } from './AdminBlendActions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Blends — Admin' }

export default async function AdminBlendsPage() {
  const blends = await prisma.blend.findMany({
    select: {
      id: true,
      name: true,
      grade: true,
      authorName: true,
      viewCount: true,
      lastAccessedAt: true,
      createdAt: true,
      isFeatured: true,
      isPinned: true,
      isHidden: true,
      _count: { select: { ingredients: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Blend Admin</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{blends.length} blends in the database</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blends/import"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            + Promote Blend
          </Link>
          <Link
            href="/admin"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Oils
          </Link>
          <Link
            href="/admin/database"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Database
          </Link>
        </div>
      </div>

      <AdminBlendActions blends={blends} />
    </div>
  )
}
