'use client'

import { useState } from 'react'

export function UnsubscribeForm() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const normalizedEmail = email.trim()
    if (!normalizedEmail) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          reason: reason.trim() || undefined,
          page_url: window.location.href,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Could not unsubscribe right now. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Could not unsubscribe right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="border border-border bg-paper p-5">
        <p className="font-serif text-xl font-bold text-ink">You are unsubscribed.</p>
        <p className="text-sm text-ink-3 leading-relaxed mt-2">
          Sorry to see you go. Your email has been removed from the AIBeat daily brief.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="unsubscribe-email" className="font-mono text-[10px] uppercase tracking-widest text-ink-4">
          Email address
        </label>
        <input
          id="unsubscribe-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mt-2 w-full border border-border bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink-2"
        />
      </div>
      <div>
        <label htmlFor="unsubscribe-reason" className="font-mono text-[10px] uppercase tracking-widest text-ink-4">
          Why are you leaving? Optional
        </label>
        <textarea
          id="unsubscribe-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Too frequent, not relevant, inbox cleanup, or anything else."
          className="mt-2 w-full resize-none border border-border bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-ink-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-ink-2 disabled:opacity-60"
      >
        {loading ? 'Unsubscribing...' : 'Unsubscribe'}
      </button>
      {error && <p className="text-xs text-beat-red">{error}</p>}
    </form>
  )
}
