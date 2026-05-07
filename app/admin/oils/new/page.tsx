import { QuickAddFlow } from './QuickAddFlow'

export const metadata = { title: 'Add Oil with AI — Admin' }

export default function NewOilPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Add New Oil</h1>
      <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
        Enter the oil name and type — AI will generate the full profile for your review.
      </p>
      <QuickAddFlow />
    </div>
  )
}
