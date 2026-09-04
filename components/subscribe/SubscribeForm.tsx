'use client'

import { useState } from 'react'

type SubscribeFormProps = {
  buttonLabel?: string
  className?: string
  dark?: boolean
  onSuccess?: () => void
}

export function SubscribeForm({
  buttonLabel = 'Subscribe ->',
  className = '',
  dark = false,
  onSuccess,
}: SubscribeFormProps) {
  const [email, setEmail] = useState('')
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
      const params = new URLSearchParams(window.location.search)
      const attribution = {
        page_url: window.location.href,
        referrer: document.referrer || undefined,
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        utm_content: params.get('utm_content') || undefined,
        utm_term: params.get('utm_term') || undefined,
      }

      const res = await fetch('/api/newsletter-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, ...attribution }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
      onSuccess?.()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`border p-4 ${dark ? 'border-beat-green bg-ink-2 text-white' : 'bg-beat-green-light border-beat-green'}`}>
        <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-beat-green'}`}>Request received.</p>
        <p className={`text-xs ${dark ? 'text-ink-4' : 'text-ink-2'}`}>Your subscription request has been received.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-0">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={`min-w-0 flex-1 bg-transparent border text-sm px-3 py-2.5 outline-none transition-colors ${
            dark
              ? 'border-ink-3 text-white placeholder:text-ink-4 focus:border-white'
              : 'border-border text-ink placeholder:text-ink-4 focus:border-ink-2'
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-beat-red text-white text-xs font-semibold px-4 py-2.5 hover:bg-red-700 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? '...' : buttonLabel}
        </button>
      </div>
      {error && <p className="text-xs text-beat-red mt-2">{error}</p>}
    </form>
  )
}
