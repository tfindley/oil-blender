import { BlendImportForm } from './BlendImportForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Promote Blend — Admin' }

export default function AdminBlendsImportPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6">
        <a
          href="/admin/blends"
          className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        >
          ← Blends
        </a>
      </div>
      <h1 className="mb-2 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Promote a Blend</h1>
      <p className="mb-8 text-sm text-stone-500 dark:text-stone-400">
        Build a blend using the normal blend builder, then paste its URL or ID here to promote it to a featured blend.
      </p>
      <BlendImportForm />
    </div>
  )
}
