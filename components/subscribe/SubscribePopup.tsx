'use client'

import { useEffect, useState } from 'react'
import { KitEmbedForm } from './KitEmbedForm'

const STORAGE_KEY = 'aibeat_popup_shown'
const DELAY_MS = 60_000

export function SubscribePopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => {
      setShow(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 px-4">
      <div className="bg-paper border-2 border-ink max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="Close"
          className="absolute top-3 right-3 text-ink-3 hover:text-ink font-mono text-sm"
        >
          ✕
        </button>
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">
          Enjoying AIBeat?
        </div>
        <h3 className="font-serif text-xl font-bold text-ink mb-2">
          Get the daily brief.
        </h3>
        <p className="text-xs text-ink-3 mb-4 leading-relaxed">
          Join 8,400+ founders and freelancers getting AI news + top tool
          picks every morning. Free.
        </p>
        <KitEmbedForm formKey="site-popup" />
      </div>
    </div>
  )
}
