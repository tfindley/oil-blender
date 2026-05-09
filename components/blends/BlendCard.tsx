import Link from 'next/link'

interface BlendCardProps {
  id: string
  name: string
  grade: string
  authorName?: string | null
  about?: string | null
  viewCount: number
  isPinned: boolean
  topOils: string[]
}

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  B: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  C: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  F: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export function BlendCard({ id, name, grade, authorName, about, viewCount, isPinned, topOils }: BlendCardProps) {
  return (
    <Link
      href={`/blend/${id}`}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-amber-600"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isPinned && <span className="text-sm" title="Pinned blend">📌</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${GRADE_STYLES[grade] ?? GRADE_STYLES.B}`}>
            Grade {grade}
          </span>
        </div>
        <span className="text-xs text-stone-400 dark:text-stone-500">{viewCount} view{viewCount !== 1 ? 's' : ''}</span>
      </div>

      <h3 className="mb-1 font-serif text-lg font-semibold text-stone-900 group-hover:text-amber-700 dark:text-stone-100 dark:group-hover:text-amber-400">
        {name}
      </h3>

      {about && (
        <p className="mb-3 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{about}</p>
      )}

      {topOils.length > 0 && (
        <p className="mb-3 text-xs text-stone-400 dark:text-stone-500">
          {topOils.join(' · ')}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        {authorName ? (
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">by {authorName}</span>
        ) : (
          <span />
        )}
        <span className="text-xs font-medium text-amber-700 group-hover:underline dark:text-amber-500">
          Try this blend →
        </span>
      </div>
    </Link>
  )
}
