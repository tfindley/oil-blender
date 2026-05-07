import Link from 'next/link'
import { OilForm } from '../../../OilForm'
import { createOil } from '../../../actions'

export const metadata = { title: 'Add Oil Manually — Admin' }

export default function NewOilManualPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Add New Oil</h1>
        {process.env.ANTHROPIC_API_KEY && (
          <Link
            href="/admin/oils/new"
            className="text-sm text-amber-700 hover:underline dark:text-amber-400"
          >
            Use AI instead
          </Link>
        )}
      </div>
      <OilForm action={createOil} submitLabel="Create Oil" />
    </div>
  )
}
