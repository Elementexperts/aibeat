'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function PublicAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-analytics-event]') : null
      const eventName = target?.dataset.analyticsEvent
      if (!eventName || typeof window.gtag !== 'function') return

      window.gtag('event', eventName, {
        event_category: target.dataset.analyticsCategory || 'public_site',
        destination: target.dataset.analyticsDestination,
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
