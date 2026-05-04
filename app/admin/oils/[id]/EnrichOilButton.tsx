'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enrichSingleOil } from '../../actions'

export function EnrichOilButton({ oilId }: { oilId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await enrichSingleOil(oilId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-stone-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-600 dark:hover:bg-stone-500"
      >
        {pending ? 'Enriching…' : 'Enrich with AI'}
      </button>
      {result && (
        <p className={`text-xs ${result.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {result.ok ? '✓ ' : '✗ '}{result.message}
        </p>
      )}
    </div>
  )
}
