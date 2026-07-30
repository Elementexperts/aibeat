'use client'

import { useState } from 'react'

export function SubscribeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
      <div className="bg-beat-green-light border border-beat-green p-4">
        <p className="text-sm font-semibold text-beat-green mb-1">You're in.</p>
        <p className="text-xs text-ink-2">Check your inbox to confirm.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-0">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-transparent border border-border text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-beat-red text-white text-xs font-semibold px-4 py-2.5 hover:bg-red-700 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? '…' : 'Subscribe →'}
        </button>
      </div>
      {error && <p className="text-xs text-beat-red mt-2">{error}</p>}
    </form>
  )
}
