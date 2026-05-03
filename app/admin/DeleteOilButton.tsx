'use client'

import { useTransition } from 'react'
import { deleteOil } from './actions'

interface DeleteOilButtonProps {
  id: string
  name: string
}

export function DeleteOilButton({ id, name }: DeleteOilButtonProps) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(() => deleteOil(id))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
