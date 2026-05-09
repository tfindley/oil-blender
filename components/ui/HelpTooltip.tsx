'use client'

import { useEffect, useState } from 'react'

// A dismissable hint banner. Three independent off-switches:
//
//   1. `siteEnabled = false`  — admin-controlled global kill (e.g. when "Help
//      tooltips" is turned off in /admin/settings). Renders nothing site-wide.
//   2. `interacted = true`    — page-level signal that the user is now using
//      the tool the hint describes; auto-dismisses without a click.
//   3. localStorage[`oil-blender:tip:${id}`] = '1'  — per-browser "✕ closed"
//      flag set when the user dismisses manually OR when `interacted` flips.
//
// Each `id` is its own dismissal scope.

const STORAGE_PREFIX = 'oil-blender:tip:'

export interface HelpTooltipProps {
  id: string
  siteEnabled: boolean
  interacted?: boolean
  children: React.ReactNode
}

export function HelpTooltip({ id, siteEnabled, interacted, children }: HelpTooltipProps) {
  const [show, setShow] = useState(false)
  const storageKey = STORAGE_PREFIX + id

  function dismiss() {
    try { window.localStorage.setItem(storageKey, '1') } catch {}
    setShow(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(storageKey) !== '1') setShow(true)
  }, [storageKey])

  // Auto-dismiss when the tool reports interaction; persist so the user
  // doesn't see it again next visit.
  useEffect(() => {
    if (interacted && show) dismiss()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interacted, show])

  if (!siteEnabled || !show) return null

  return (
    <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex-1 text-xs leading-relaxed sm:text-sm">{children}</div>
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
