'use client'

import { useState } from 'react'
import { SubscribeForm } from './SubscribeForm'

export function DailyBriefButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        {'Get the daily brief ->'}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-paper border-2 border-ink max-w-sm w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 text-ink-3 hover:text-ink font-mono text-sm"
            >
              x
            </button>
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">
              Free newsletter
            </div>
            <h3 className="font-serif text-xl font-bold text-ink mb-3">
              The AI Beat. Daily.
            </h3>
            <SubscribeForm
              buttonLabel="Get brief ->"
              onSuccess={() => setTimeout(() => setOpen(false), 1500)}
            />
          </div>
        </div>
      )}
    </>
  )
}
