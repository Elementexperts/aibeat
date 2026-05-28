'use client'
import { useState } from 'react'

export function NewsletterBox({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!email) return
    // TODO: connect to Mailchimp / ConvertKit API
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={`p-5 ${dark ? 'bg-ink text-white' : 'bg-beat-green-light border border-beat-green'}`}>
        <div className="font-serif text-lg font-bold mb-1">You're in! 🎉</div>
        <p className="text-xs opacity-70">First issue lands tomorrow morning. Check your inbox.</p>
      </div>
    )
  }

  return (
    <div className={`p-5 ${dark ? 'bg-ink text-white' : 'bg-paper-2 border border-border'}`}>
      <h3 className="font-serif text-xl font-bold mb-1.5 leading-tight">
        The AI Beat. Daily.
      </h3>
      <p className={`text-xs mb-4 leading-relaxed ${dark ? 'text-ink-4' : 'text-ink-3'}`}>
        Join 8,400+ founders getting AI news + top tool picks every morning. Free.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className={`w-full text-xs px-3 py-2 mb-2 outline-none ${
          dark
            ? 'bg-transparent border border-ink-3 text-white placeholder:text-ink-4 focus:border-white'
            : 'bg-white border border-border text-ink placeholder:text-ink-4 focus:border-ink'
        } transition-colors`}
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-beat-red text-white text-xs py-2 font-semibold hover:bg-red-700 transition-colors"
      >
        Get the daily brief →
      </button>
      <p className={`font-mono text-[10px] mt-2 ${dark ? 'text-ink-4' : 'text-ink-4'}`}>
        Free. No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
