'use client'

import { useActionState } from 'react'
import { adminLogin } from './actions'

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, null)

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">🌿</span>
          <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Admin Access</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Enter your admin secret to continue.</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state != null && typeof state === 'object' && 'error' in (state as object) && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {String((state as Record<string, unknown>).error)}
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
              Secret
            </label>
            <input
              name="secret"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
