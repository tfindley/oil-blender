'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { loadDraft, saveDraft, removeFromDraft, DRAFT_CHANGE_EVENT, type BlendDraft } from '@/lib/blend-storage'
import { scoreBlend, type BlendGrade, type ScoredPairing } from '@/lib/blend-scorer'
import { GRADE_STYLES } from '@/lib/grade-styles'
import { isScorable } from '@/lib/blend-rules'

function GradeCircle({ grade }: { grade: BlendGrade }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-base font-bold ${GRADE_STYLES[grade]}`}
      title={`Blend grade ${grade}`}
      aria-label={`Blend grade ${grade}`}
    >
      {grade}
    </span>
  )
}

function FlaskIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      fillOpacity={filled ? 0.15 : 0}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 3h6" />
      <path d="M10 9V3" />
      <path d="M14 9V3" />
      <path d="M5 21h14a2 2 0 0 0 1.74-2.97L14 9H10L3.26 18.03A2 2 0 0 0 5 21Z" />
    </svg>
  )
}

export function BlendCart() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [draft, setDraft] = useState<BlendDraft | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setDraft(loadDraft())
    update()
    setMounted(true)
    window.addEventListener('storage', update)
    window.addEventListener(DRAFT_CHANGE_EVENT, update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(DRAFT_CHANGE_EVENT, update)
    }
  }, [])

  // Stable key for the current oil-set; effect re-runs only when membership changes.
  const idsKey = useMemo(() => {
    if (!draft) return ''
    const ids = [
      ...draft.carriers.map((c) => c.oilId),
      ...draft.essentials.map((e) => e.oilId),
    ]
    return [...ids].sort().join(',')
  }, [draft])

  // Keep `grade` fresh whenever the oil-set membership changes. On /blend the BlendBuilder is
  // the source of truth and writes its own grade — skip here to avoid a duplicate fetch.
  useEffect(() => {
    if (pathname === '/blend') return
    const current = loadDraft()
    if (!current) return
    if (!isScorable(current.carriers.length, current.essentials.length)) {
      if (current.grade !== undefined) saveDraft({ ...current, grade: undefined })
      return
    }
    const ids = [
      ...current.carriers.map((c) => c.oilId),
      ...current.essentials.map((e) => e.oilId),
    ]
    fetch(`/api/pairings?oilIds=${ids.join(',')}`)
      .then((r) => (r.ok ? (r.json() as Promise<ScoredPairing[]>) : []))
      .then((pairings) => {
        const result = scoreBlend(pairings)
        const fresh = loadDraft()
        if (!fresh) return
        const freshKey = [
          ...fresh.carriers.map((c) => c.oilId),
          ...fresh.essentials.map((e) => e.oilId),
        ].sort().join(',')
        if (freshKey !== idsKey) return // draft changed during fetch — skip stale result
        if (fresh.grade !== result.grade) saveDraft({ ...fresh, grade: result.grade })
      })
      .catch(() => {})
  }, [pathname, idsKey])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const carriers = draft?.carriers ?? []
  const essentials = draft?.essentials ?? []
  const total = carriers.length + essentials.length
  const filled = mounted && total > 0

  // Force the dropdown closed when the first oil arrives — it should only open on explicit click.
  const prevTotal = useRef(0)
  useEffect(() => {
    if (prevTotal.current === 0 && total > 0) setOpen(false)
    prevTotal.current = total
  }, [total])

  const buttonClass = `relative flex items-center justify-center rounded-md p-2.5 transition-colors ${
    filled
      ? 'text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-950/30'
      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
  }`

  // When no oils, click navigates straight to /blend (no panel needed)
  if (!filled) {
    return (
      <Link href="/blend" aria-label="Open blend builder" className={buttonClass}>
        <FlaskIcon filled={false} />
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Blend in progress: ${carriers.length} carriers, ${essentials.length} essential oils`}
        aria-expanded={open}
        className={buttonClass}
      >
        <FlaskIcon filled />
        <span className="absolute -right-1.5 -top-1 inline-flex items-center overflow-hidden rounded-full text-[10px] font-semibold leading-none">
          <span className="bg-amber-700 px-1.5 py-0.5 text-white" title={`${carriers.length} carrier${carriers.length === 1 ? '' : 's'}`}>{carriers.length}</span>
          <span className="bg-emerald-700 px-1.5 py-0.5 text-white" title={`${essentials.length} essential oil${essentials.length === 1 ? '' : 's'}`}>{essentials.length}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-800">
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 px-4 py-3 dark:border-stone-700">
            <div>
              <p className="font-serif font-semibold text-stone-800 dark:text-stone-200">Your Blend</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {carriers.length} carrier{carriers.length === 1 ? '' : 's'} · {essentials.length} essential oil{essentials.length === 1 ? '' : 's'}
              </p>
            </div>
            {draft?.grade && <GradeCircle grade={draft.grade} />}
          </div>
          <div className="max-h-72 overflow-y-auto px-4 py-3 text-sm">
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Carriers</p>
              {carriers.length === 0 ? (
                <p className="text-xs italic text-stone-400 dark:text-stone-500">None yet</p>
              ) : (
                <ul className="space-y-0.5">
                  {carriers.map((c) => (
                    <li key={c.oilId} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-stone-50 dark:hover:bg-stone-700/50">
                      <span className="truncate text-stone-700 dark:text-stone-200">{c.name}</span>
                      <button
                        onClick={() => removeFromDraft(c.oilId)}
                        aria-label={`Remove ${c.name}`}
                        className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Essentials</p>
              {essentials.length === 0 ? (
                <p className="text-xs italic text-stone-400 dark:text-stone-500">None yet</p>
              ) : (
                <ul className="space-y-0.5">
                  {essentials.map((e) => (
                    <li key={e.oilId} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-stone-50 dark:hover:bg-stone-700/50">
                      <span className="truncate text-stone-700 dark:text-stone-200">{e.name}</span>
                      <button
                        onClick={() => removeFromDraft(e.oilId)}
                        aria-label={`Remove ${e.name}`}
                        className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-red-50 hover:text-red-500 dark:text-stone-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="border-t border-stone-100 px-4 py-3 dark:border-stone-700">
            <button
              onClick={() => {
                setOpen(false)
                router.push('/blend')
              }}
              className="w-full rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Open in Builder →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
