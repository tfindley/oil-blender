import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — Potions & Lotions' }

export default async function AdminPage() {
  const oils = await prisma.oil.findMany({
    select: { id: true, name: true, botanicalName: true, type: true, buyUrl: true, imageUrl: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Oil Admin</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{oils.length} oils in the library</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blends"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Blends
          </Link>
          <Link
            href="/admin/oils/new"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            + Add Oil
          </Link>
          <a
            href="/admin/logout"
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Sign Out
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left dark:border-stone-700 dark:bg-stone-900">
              <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Name</th>
              <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Botanical</th>
              <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Type</th>
              <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Buy link</th>
              <th className="px-4 py-3 font-semibold text-stone-700 dark:text-stone-300">Image</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
            {oils.map((oil) => (
              <tr key={oil.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/50">
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{oil.name}</td>
                <td className="px-4 py-3 italic text-stone-500 dark:text-stone-400">{oil.botanicalName}</td>
                <td className="px-4 py-3">
                  <Badge variant={oil.type === 'ESSENTIAL' ? 'GOOD' : 'default'}>
                    {oil.type === 'ESSENTIAL' ? 'Essential' : 'Carrier'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                  {oil.buyUrl ? <span className="text-emerald-600 dark:text-emerald-500">✓</span> : '—'}
                </td>
                <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                  {oil.imageUrl ? <span className="text-emerald-600 dark:text-emerald-500">✓</span> : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/oils/${oil.id}`}
                    className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-950"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
