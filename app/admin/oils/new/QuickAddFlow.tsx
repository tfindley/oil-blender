'use client'

import { useState, useTransition } from 'react'
import { OilForm } from '../../OilForm'
import { previewEnrichment, createEnrichedOil } from '../../actions'
import type { OilEnrichment } from '@/lib/oil-enrichment'

type Step = 'input' | 'review'

const inputClass =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500'

export function QuickAddFlow() {
  const [step, setStep] = useState<Step>('input')
  const [name, setName] = useState('')
  const [type, setType] = useState<'ESSENTIAL' | 'CARRIER'>('ESSENTIAL')
  const [enrichment, setEnrichment] = useState<OilEnrichment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await previewEnrichment(name.trim(), type)
      if ('error' in result) {
        setError(result.error)
      } else {
        setEnrichment(result)
        setStep('review')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  function handleReset() {
    setStep('input')
    setEnrichment(null)
    setError(null)
  }

  if (step === 'review' && enrichment) {
    const initialValues = {
      name,
      type,
      botanicalName: enrichment.botanicalName,
      origin: enrichment.origin,
      history: enrichment.history,
      description: enrichment.description,
      aroma: enrichment.aroma,
      benefits: enrichment.benefits.join('\n'),
      contraindications: enrichment.contraindications.join('\n'),
      consistency: enrichment.consistency ?? '',
      absorbency: enrichment.absorbency ?? '',
      shelfLifeMonths: enrichment.shelfLifeMonths?.toString() ?? '',
      dilutionRateMax: enrichment.dilutionRateMax?.toString() ?? '',
    }

    return (
      <div>
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            AI generated the details below for <strong>{name}</strong>. Review and edit any fields before saving.
            {enrichment.pairings.length > 0 && (
              <> {enrichment.pairings.length} pairings will also be created.</>
            )}
          </p>
          <button
            onClick={handleReset}
            className="mt-1 text-xs text-amber-700 underline hover:no-underline dark:text-amber-400"
          >
            Start over
          </button>
        </div>
        <OilForm
          key={`${name}-${type}`}
          initialValues={initialValues}
          pairingsJson={JSON.stringify(enrichment.pairings)}
          action={createEnrichedOil}
          submitLabel="Create Oil"
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Oil Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. Frankincense"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'ESSENTIAL' | 'CARRIER')}
            disabled={isPending}
            className={inputClass}
          >
            <option value="ESSENTIAL">Essential Oil</option>
            <option value="CARRIER">Carrier Oil</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Generating…' : 'Generate with AI'}
        </button>
        {isPending && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Generating profile for {name}… this may take 15–30 seconds.
          </p>
        )}
        {!isPending && (
          <a
            href="/admin/oils/new/manual"
            className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            Add manually instead
          </a>
        )}
      </div>
    </form>
  )
}
