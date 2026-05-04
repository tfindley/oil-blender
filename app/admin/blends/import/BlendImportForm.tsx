'use client'

import { useState, useTransition } from 'react'
import { lookupBlend, promoteBlend } from '../actions'

type LookedUpBlend = Awaited<ReturnType<typeof lookupBlend>>

export function BlendImportForm() {
  const [input, setInput] = useState('')
  const [blend, setBlend] = useState<NonNullable<LookedUpBlend> | null>(null)
  const [error, setError] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [about, setAbout] = useState('')
  const [isFeatured, setIsFeatured] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [lookupPending, startLookup] = useTransition()
  const [promotePending, startPromote] = useTransition()

  function handleLookup() {
    setError('')
    setBlend(null)
    startLookup(async () => {
      const result = await lookupBlend(input)
      if (!result) {
        setError('Blend not found. Check the URL or ID and try again.')
        return
      }
      setBlend(result)
      setAuthorName(result.authorName ?? '')
      setAbout(result.about ?? '')
      setIsFeatured(result.isFeatured)
      setIsPinned(result.isPinned)
      setIsHidden(result.isHidden)
    })
  }

  function handlePromote() {
    if (!blend) return
    startPromote(() =>
      promoteBlend(blend.id, {
        authorName: authorName.trim(),
        about: about.trim(),
        isFeatured,
        isPinned,
        isHidden,
      })
    )
  }

  const inputCls = 'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
  const labelCls = 'mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300'

  const essentials = blend?.ingredients.filter((i) => i.oil.type === 'ESSENTIAL') ?? []
  const carriers = blend?.ingredients.filter((i) => i.oil.type === 'CARRIER') ?? []

  return (
    <div className="space-y-6">
      {/* Step 1: lookup */}
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Blend URL or ID</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://…/blend/clxxx… or just the ID"
            className={inputCls}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
        </div>
        <button
          onClick={handleLookup}
          disabled={!input.trim() || lookupPending}
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-200 dark:text-stone-900"
        >
          {lookupPending ? 'Looking up…' : 'Look up blend'}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Step 2: preview + metadata */}
      {blend && (
        <div className="space-y-5 rounded-xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-700 dark:bg-stone-800">
          {/* Blend preview */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Blend preview</p>
            <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{blend.name}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Grade {blend.grade} · {blend.totalVolumeMl}ml · {(blend.dilutionRate * 100).toFixed(0)}% dilution
            </p>
            <div className="mt-2 space-y-0.5 text-xs text-stone-500 dark:text-stone-400">
              {carriers.map((i) => (
                <p key={i.id}>{i.oil.name} (carrier)</p>
              ))}
              {essentials.map((i) => (
                <p key={i.id}>{i.oil.name} (EO)</p>
              ))}
            </div>
          </div>

          {/* Metadata form */}
          <div>
            <label className={labelCls}>Author name</label>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. Tristan Findley" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>About this blend</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Describe the purpose, mood, or therapeutic intent…"
              rows={3}
              className={inputCls}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700">
            {[
              { label: '⭐ Featured', desc: 'Show on homepage and /blends', val: isFeatured, set: setIsFeatured },
              { label: '📌 Pinned',   desc: 'Show first on homepage',       val: isPinned,   set: setIsPinned },
              { label: '🙈 Hidden',   desc: 'Hide from public pages',        val: isHidden,   set: setIsHidden },
            ].map((opt) => (
              <label key={opt.label} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={opt.val} onChange={(e) => opt.set(e.target.checked)} className="rounded border-stone-300" />
                <span className="text-sm text-stone-700 dark:text-stone-300">{opt.label}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">{opt.desc}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handlePromote}
            disabled={promotePending}
            className="w-full rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {promotePending ? 'Promoting…' : 'Promote blend'}
          </button>
        </div>
      )}
    </div>
  )
}
