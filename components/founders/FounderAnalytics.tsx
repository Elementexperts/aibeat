'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function FounderAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-founder-event]') : null
      const eventName = target?.dataset.founderEvent
      if (!eventName || typeof window.gtag !== 'function') return
      window.gtag('event', eventName, {
        event_category: 'founder_services',
        plan_id: target.dataset.planId,
      })
    }

    document.addEventListener('click', onClick)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'founder_page_view', { event_category: 'founder_services' })
    }
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
