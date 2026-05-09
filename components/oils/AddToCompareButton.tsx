'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  loadCompare,
  pushToCompare,
  replaceInCompare,
  COMPARE_CHANGE_EVENT,
  type CompareSlots,
} from '@/lib/compare-storage'

interface AddToCompareButtonProps {
  oilId: string
  oilName: string
}

export function AddToCompareButton({ oilId, oilName }: AddToCompareButtonProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [slots, setSlots] = useState<CompareSlots | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setSlots(loadCompare())
    update()
    setMounted(true)
    window.addEventListener('storage', update)
    window.addEventListener(COMPARE_CHANGE_EVENT, update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(COMPARE_CHANGE_EVENT, update)
    }
  }, [])

  useEffect(() => {
    if (!popoverOpen) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPopoverOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [popoverOpen])

  const inA = mounted && slots?.slotA?.id === oilId
  const inB = mounted && slots?.slotB?.id === oilId
  const inEither = inA || inB
  const slotsFull = mounted && !!slots?.slotA && !!slots?.slotB && !inEither

  let label = 'Compare this oil'
  if (mounted) {
    if (inA) label = 'In compare A ✓'
    else if (inB) label = 'In compare B ✓'
    else if (slotsFull) label = 'Replace in compare ▾'
  }

  function handleClick() {
    if (!mounted) return
    if (inEither) {
      router.push('/oils/compare')
      return
    }
    if (slotsFull) {
      setPopoverOpen((o) => !o)
      return
    }
    pushToCompare({ id: oilId, name: oilName })
  }

  function handleReplace(slot: 'A' | 'B') {
    replaceInCompare(slot, { id: oilId, name: oilName })
    setPopoverOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={handleClick}>
        {label}
      </Button>
      {popoverOpen && slots?.slotA && slots?.slotB && (
        <div className="absolute right-0 top-full z-30 mt-1 w-60 rounded-lg border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-800">
          <p className="mb-2 text-xs text-stone-600 dark:text-stone-300">
            Compare slots are full. Replace which?
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleReplace('A')}
              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <span className="text-stone-700 dark:text-stone-200">Replace A</span>
              <span className="truncate text-xs italic text-stone-400 dark:text-stone-500">{slots.slotA.name}</span>
            </button>
            <button
              onClick={() => handleReplace('B')}
              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <span className="text-stone-700 dark:text-stone-200">Replace B</span>
              <span className="truncate text-xs italic text-stone-400 dark:text-stone-500">{slots.slotB.name}</span>
            </button>
            <button
              onClick={() => setPopoverOpen(false)}
              className="w-full rounded px-2 py-1.5 text-left text-sm text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
