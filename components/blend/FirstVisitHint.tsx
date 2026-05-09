'use client'

import { useEffect, useState } from 'react'

const KEY = 'oil-blender:hint-dismissed'

export function FirstVisitHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(KEY) !== '1') setShow(true)
  }, [])

  if (!show) return null

  function dismiss() {
    try { window.localStorage.setItem(KEY, '1') } catch {}
    setShow(false)
  }

  return (
    <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex-1">
        <p className="font-semibold">New here?</p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          Pick a carrier oil on Tab 1, an essential oil on Tab 2, then jump to Quantities. Tap any oil to see its profile.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss hint"
        className="shrink-0 rounded-full p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
      >
        ✕
      </button>
    </div>
  )
}
