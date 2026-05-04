'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Oil } from '@prisma/client'

interface OilFormProps {
  oil?: Oil
  action: (prev: unknown, data: FormData) => Promise<unknown>
  submitLabel: string
}

export function OilForm({ oil, action, submitLabel }: OilFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-6">
      {state != null && typeof state === 'object' && 'error' in (state as object) && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {String((state as Record<string, unknown>).error)}
        </p>
      )}
      {state != null && typeof state === 'object' && 'success' in (state as object) && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          Saved successfully.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Common Name" name="name" defaultValue={oil?.name} required />
        <Field label="Botanical Name" name="botanicalName" defaultValue={oil?.botanicalName} required />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">Type</label>
          <select
            name="type"
            defaultValue={oil?.type ?? 'ESSENTIAL'}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          >
            <option value="ESSENTIAL">Essential Oil</option>
            <option value="CARRIER">Carrier Oil</option>
          </select>
        </div>
        <Field label="Origin" name="origin" defaultValue={oil?.origin} required />
      </div>

      <Field label="Description" name="description" defaultValue={oil?.description} textarea required />
      <Field label="History" name="history" defaultValue={oil?.history} textarea required />
      <Field label="Aroma" name="aroma" defaultValue={oil?.aroma} required />

      <Field
        label="Benefits (one per line)"
        name="benefits"
        defaultValue={oil?.benefits.join('\n')}
        textarea
        required
      />
      <Field
        label="Contraindications (one per line)"
        name="contraindications"
        defaultValue={oil?.contraindications.join('\n')}
        textarea
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Consistency" name="consistency" defaultValue={oil?.consistency ?? ''} placeholder="e.g. light" />
        <Field label="Absorbency" name="absorbency" defaultValue={oil?.absorbency ?? ''} placeholder="e.g. fast" />
        <Field label="Shelf Life (months)" name="shelfLifeMonths" type="number" defaultValue={oil?.shelfLifeMonths?.toString() ?? ''} />
        <Field label="Max Dilution (0–1)" name="dilutionRateMax" type="number" step="0.01" defaultValue={oil?.dilutionRateMax?.toString() ?? ''} placeholder="e.g. 0.03" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Buy URL (sponsored link)" name="buyUrl" type="url" defaultValue={oil?.buyUrl ?? ''} placeholder="https://…" />
        <Field label="Image URL" name="imageUrl" type="url" defaultValue={oil?.imageUrl ?? ''} placeholder="https://…" />
      </div>
      <Field label="Image description (alt text)" name="imageAlt" defaultValue={oil?.imageAlt ?? ''} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        <a href="/admin" className="text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200">
          Cancel
        </a>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  textarea?: boolean
  type?: string
  step?: string
  placeholder?: string
}

function Field({ label, name, defaultValue = '', required, textarea, type = 'text', step, placeholder }: FieldProps) {
  const base = 'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500'
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} required={required} rows={4} placeholder={placeholder} className={base} />
      ) : (
        <input name={name} type={type} step={step} defaultValue={defaultValue} required={required} placeholder={placeholder} className={base} />
      )}
    </div>
  )
}
