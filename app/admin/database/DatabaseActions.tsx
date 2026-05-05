'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { seedDatabase, runEnrichment } from './actions'
import { applyPendingMigrations } from './migrations'

function StatusBanner({ result }: { result: { ok: boolean; message: string } }) {
  return (
    <div
      className={`mt-4 rounded-lg px-4 py-3 text-sm ${
        result.ok
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300'
      }`}
    >
      {result.ok ? '✓ ' : '✗ '}{result.message}
    </div>
  )
}

export function SeedButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [seeded, setSeeded] = useState(false)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await seedDatabase()
      setResult(res)
      if (res.ok) {
        setSeeded(true)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
      >
        {pending ? 'Seeding…' : seeded ? 'Re-run Seed' : 'Seed Database'}
      </button>
      {result && <StatusBanner result={result} />}
    </div>
  )
}

export function EnrichButton({ unenrichedCount }: { unenrichedCount: number }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleClick(force = false) {
    setResult(null)
    startTransition(async () => {
      const res = await runEnrichment(force)
      setResult(res)
    })
  }

  const allEnriched = unenrichedCount === 0
  const label = pending ? 'Starting…' : allEnriched ? 'All oils enriched' : `Enrich ${unenrichedCount} oil${unenrichedCount === 1 ? '' : 's'}`

  return (
    <div>
      <button
        onClick={() => handleClick(false)}
        disabled={pending || allEnriched}
        className="rounded-md bg-stone-700 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-default disabled:opacity-50 dark:bg-stone-600 dark:hover:bg-stone-500"
      >
        {label}
      </button>
      {allEnriched && !pending && (
        <button
          onClick={() => handleClick(true)}
          className="ml-3 text-sm text-stone-500 underline hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        >
          Force re-enrich all
        </button>
      )}
      {result && <StatusBanner result={result} />}
    </div>
  )
}

export function MigrationApplyButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await applyPendingMigrations()
      setResult(res)
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
      >
        {pending ? 'Applying…' : 'Apply Pending Migrations'}
      </button>
      {result && <StatusBanner result={result} />}
    </div>
  )
}
