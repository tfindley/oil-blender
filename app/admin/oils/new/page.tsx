import { OilForm } from '../../OilForm'
import { createOil } from '../../actions'

export const metadata = { title: 'Add Oil — Admin' }

export default function NewOilPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Add New Oil</h1>
      <OilForm action={createOil} submitLabel="Create Oil" />
    </div>
  )
}
