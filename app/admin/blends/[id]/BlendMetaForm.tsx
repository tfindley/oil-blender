'use client'

import { useState, useTransition } from 'react'
import { updateBlendMeta, deleteBlend } from '../actions'

interface Props {
  id: string
  initial: {
    authorName: string
    about: string
    isFeatured: boolean
    isPinned: boolean
    isHidden: boolean
  }
}

export function BlendMetaForm({ id, initial }: Props) {
  const [authorName, setAuthorName] = useState(initial.authorName)
  const [about, setAbout] = useState(initial.about)
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured)
  const [isPinned, setIsPinned] = useState(initial.isPinned)
  const [isHidden, setIsHidden] = useState(initial.isHidden)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateBlendMeta(id, {
        authorName: authorName.trim() || null,
        about: about.trim() || null,
        isFeatured,
        isPinned,
        isHidden,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleDelete() {
    if (!confirm('Delete this blend permanently? This cannot be undone.')) return
    startTransition(() => deleteBlend(id))
  }

  const inputCls = 'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100'
  const labelCls = 'mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300'

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Author name</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="e.g. Tristan Findley"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>About this blend</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Describe the purpose, mood, or therapeutic intent of this blend…"
          rows={4}
          className={inputCls}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-stone-200 p-4 dark:border-stone-700">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Visibility &amp; Promotion</p>
        {[
          { id: 'featured', label: '⭐ Featured', desc: 'Show on homepage and /blends listing', val: isFeatured, set: setIsFeatured },
          { id: 'pinned',   label: '📌 Pinned',   desc: 'Always shown first on homepage',      val: isPinned,   set: setIsPinned },
          { id: 'hidden',   label: '🙈 Hidden',   desc: 'Hidden from all public pages',         val: isHidden,   set: setIsHidden },
        ].map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={opt.val}
              onChange={(e) => opt.set(e.target.checked)}
              className="mt-0.5 rounded border-stone-300"
            />
            <div>
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{opt.label}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-stone-100 pt-4 dark:border-stone-700">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete blend
        </button>

        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded-md bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
