import { OilForm } from '../../OilForm'
import { createOil } from '../../actions'
import { QuickAddFlow } from './QuickAddFlow'

export const metadata = { title: 'Add Oil — Admin' }

export default function NewOilPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Add New Oil</h1>
      {hasApiKey ? (
        <>
          <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
            Enter the oil name and type — AI will generate the full profile for your review.
          </p>
          <QuickAddFlow />
        </>
      ) : (
        <>
          <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
            Set <code className="rounded bg-stone-100 px-1 py-0.5 font-mono dark:bg-stone-800">ANTHROPIC_API_KEY</code> to enable AI-assisted entry.
          </p>
          <OilForm action={createOil} submitLabel="Create Oil" />
        </>
      )}
    </div>
  )
}
