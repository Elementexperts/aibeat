'use client'

import { useState } from 'react'
import Link from 'next/link'

const BENEFITS = [
  { icon: '📰', title: 'Daily AI news digest', body: 'The 3 stories that actually matter — curated every morning before 7 am.' },
  { icon: '🛠', title: 'Weekly tool picks', body: 'One new AI tool reviewed every week. Pros, cons, pricing, and our honest verdict.' },
  { icon: '⚡', title: 'Breaking alerts', body: 'Instant notification when a major AI product drops, gets acquired, or changes pricing.' },
  { icon: '🆓', title: 'Free, always', body: 'No paid tier. No upsells. The newsletter is free and will stay free.' },
]

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // TODO: Wire up Mailchimp / ConvertKit API
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 800)
  }

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Newsletter</span>
      </div>

      {/* HERO */}
      <div className="bg-ink px-6 py-12 md:py-16 text-center border-b-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-4">Free newsletter</div>
        <h1 className="font-serif text-4xl md:text-5xl font-black text-white leading-tight mb-4">
          The AI Beat.<br />Every morning.
        </h1>
        <p className="text-sm text-ink-3 max-w-md mx-auto mb-8 leading-relaxed">
          Join 8,400+ founders and freelancers getting the daily brief on AI news, tool launches, and honest reviews.
        </p>

        {submitted ? (
          <div className="bg-beat-green-light border border-beat-green p-5 max-w-md mx-auto">
            <div className="font-serif text-xl font-bold text-beat-green mb-1">You're in.</div>
            <p className="text-sm text-ink-2">Check your inbox for a confirmation email. First brief hits tomorrow morning.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex gap-0">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-ink-3 text-white text-sm px-4 py-3 outline-none placeholder:text-ink-4 focus:border-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-beat-red text-white text-sm font-semibold px-6 py-3 hover:bg-red-700 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? 'Joining…' : 'Subscribe free →'}
              </button>
            </div>
            <p className="font-mono text-[10px] text-ink-4 mt-3">Free forever. No spam. Unsubscribe in one click.</p>
          </form>
        )}
      </div>

      {/* SOCIAL PROOF BAR */}
      <div className="grid grid-cols-3 border-b-2 border-ink">
        {[
          { stat: '8,400+', label: 'Active subscribers' },
          { stat: '42%', label: 'Average open rate' },
          { stat: 'Daily', label: 'Publishing cadence' },
        ].map((item, i) => (
          <div key={item.stat} className={`px-6 py-5 text-center ${i < 2 ? 'border-r border-border' : ''}`}>
            <div className="font-serif text-3xl font-black text-ink mb-1">{item.stat}</div>
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest">{item.label}</div>
          </div>
        ))}
      </div>

      {/* WHAT YOU GET */}
      <div className="px-6 py-8 border-b border-border">
        <div className="section-label">What you get</div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 p-4 border border-border">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <div className="font-semibold text-sm text-ink mb-1">{b.title}</div>
                <p className="text-xs text-ink-3 leading-relaxed">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECOND SIGNUP — for readers who scrolled */}
      {!submitted && (
        <div className="px-6 py-8 border-b border-border text-center">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Ready to subscribe?</h2>
          <p className="text-xs text-ink-3 mb-5">Join 8,400+ founders getting the daily AI brief.</p>
          <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex gap-0">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent border border-border text-ink text-sm px-4 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-beat-red text-white text-xs font-semibold px-5 py-2.5 hover:bg-red-700 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? '…' : 'Subscribe →'}
            </button>
          </form>
        </div>
      )}

      {/* FOOTER LINKS */}
      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-ink-4">Questions? Email us at <span className="font-mono">hello@aibeat.dev</span></p>
        <div className="flex items-center gap-4">
          <Link href="/news" className="font-mono text-[11px] text-ink-3 hover:text-beat-red">Latest news</Link>
          <Link href="/directory" className="font-mono text-[11px] text-ink-3 hover:text-beat-red">Tool directory</Link>
        </div>
      </div>
    </div>
  )
}
