'use client'

import { useState } from 'react'
import { Button } from './Button'

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" className="w-full" onClick={handleCopy}>
      {copied ? '✓ Copied!' : 'Copy Link'}
    </Button>
  )
}
