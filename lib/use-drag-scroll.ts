'use client'

import { useEffect, type RefObject } from 'react'

// Pointer-event drag-to-scroll for horizontally overflowing containers.
// Skips drag when the user starts on a button/link/input so existing
// click handlers continue to work.
export function useDragScroll(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let isDown = false
    let startX = 0
    let startScroll = 0
    let activePointerId: number | null = null

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, select, textarea, label')) return
      isDown = true
      activePointerId = e.pointerId
      startX = e.clientX
      startScroll = el.scrollLeft
      el.classList.add('cursor-grabbing')
    }

    const onMove = (e: PointerEvent) => {
      if (!isDown) return
      el.scrollLeft = startScroll - (e.clientX - startX)
    }

    const onUp = () => {
      if (!isDown) return
      isDown = false
      activePointerId = null
      el.classList.remove('cursor-grabbing')
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onUp)
    }
  }, [ref])
}
