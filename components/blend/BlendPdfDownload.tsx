'use client'

import { createElement, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { BlendDetail } from '@/types'

interface BlendPdfDownloadProps {
  blend: BlendDetail
  baseUrl: string
}

export function BlendPdfDownload({ blend, baseUrl }: BlendPdfDownloadProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      // Lazy runtime imports — @react-pdf/renderer never resolved by the bundler at compile time
      const [{ pdf }, { BlendReport }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/BlendReport'),
      ])

      const doc = createElement(BlendReport, { blend, baseUrl })
      const blob = await pdf(doc as any).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${blend.name.toLowerCase().replace(/\s+/g, '-')}-blend.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" onClick={handleDownload} disabled={loading}>
      {loading ? 'Preparing PDF…' : '↓ Download PDF'}
    </Button>
  )
}
