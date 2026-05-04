import Link from 'next/link'
import { OilForm } from '../../OilForm'
import { createOil } from '../../actions'

export const metadata = { title: 'Add Oil — Admin' }

export default function NewOilPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
        ← Admin
      </Link>
      <h1 className="mb-8 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Add New Oil</h1>
      <OilForm action={createOil} submitLabel="Create Oil" />
    </div>
  )
}
