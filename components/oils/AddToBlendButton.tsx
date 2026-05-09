'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  loadDraft,
  draftContainsOil,
  addCarrierToDraft,
  addEOToDraft,
  DRAFT_CHANGE_EVENT,
  type BlendDraft,
  MAX_CARRIERS,
  MAX_EOS,
} from '@/lib/blend-storage'

interface AddToBlendButtonProps {
  oilId: string
  oilName: string
  oilType: 'CARRIER' | 'ESSENTIAL'
}

export function AddToBlendButton({ oilId, oilName, oilType }: AddToBlendButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [draft, setDraft] = useState<BlendDraft | null>(null)

  useEffect(() => {
    const update = () => setDraft(loadDraft())
    update()
    setMounted(true)
    window.addEventListener('storage', update)
    window.addEventListener(DRAFT_CHANGE_EVENT, update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(DRAFT_CHANGE_EVENT, update)
    }
  }, [])

  const inProgress = draft != null
  const alreadyAdded = mounted && draft != null && draftContainsOil(draft, oilId)
  const cap = oilType === 'CARRIER' ? MAX_CARRIERS : MAX_EOS
  const currentTypeCount = oilType === 'CARRIER'
    ? draft?.carriers.length ?? 0
    : draft?.essentials.length ?? 0
  const atMax = mounted && !alreadyAdded && currentTypeCount >= cap

  let label = 'Start a blend'
  let disabled = false
  if (mounted) {
    if (alreadyAdded) {
      label = 'In your blend ✓'
      disabled = true
    } else if (atMax) {
      label = `Blend full (${cap} max)`
      disabled = true
    } else if (inProgress) {
      label = 'Add to current blend'
    }
  }

  function handleClick() {
    if (disabled) return
    if (oilType === 'CARRIER') addCarrierToDraft(oilId, oilName)
    else addEOToDraft(oilId, oilName)
    // The DRAFT_CHANGE_EVENT will fire on save and re-render this button as "In your blend ✓".
  }

  return (
    <Button onClick={handleClick} disabled={disabled}>
      {label}
    </Button>
  )
}
