'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { seedDatabase, runEnrichment } from './actions'

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

export function EnrichButton() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await runEnrichment()
      setResult(res)
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-stone-700 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-600 dark:hover:bg-stone-500"
      >
        {pending ? 'Starting…' : 'Run Enrichment'}
      </button>
      {result && <StatusBanner result={result} />}
    </div>
  )
}
