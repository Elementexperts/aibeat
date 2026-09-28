'use client'

import Script from 'next/script'
import { useRef } from 'react'

type SchedulingWindow = Window & {
  calendar?: {
    schedulingButton: {
      load: (options: { url: string; color: string; label: string; target: HTMLElement }) => void
    }
  }
}

export function BookingPopup({ url }: { url: string }) {
  const targetRef = useRef<HTMLSpanElement>(null)
  const initialized = useRef(false)

  function initializeButton() {
    const schedulingButton = (window as SchedulingWindow).calendar?.schedulingButton
    if (!targetRef.current || !schedulingButton || initialized.current) return

    schedulingButton.load({
      url,
      color: '#039BE5',
      label: 'Book a free strategy call',
      target: targetRef.current,
    })
    initialized.current = true
  }

  return (
    <div className="booking-popup">
      <link rel="stylesheet" href="https://calendar.google.com/calendar/scheduling-button-script.css" />
      <span ref={targetRef} />
      <Script
        src="https://calendar.google.com/calendar/scheduling-button-script.js"
        strategy="afterInteractive"
        onReady={initializeButton}
      />
    </div>
  )
}
