'use client'

import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  'AI Writing', 'AI Coding', 'CRM', 'Project Management', 'Invoicing',
  'Accounting', 'SEO', 'Productivity', 'Email Marketing', 'Design',
  'Analytics', 'Customer Support', 'HR & Recruiting', 'Other',
]

const TYPES = [
  { value: 'new-tool', label: 'Submit a new tool for review' },
  { value: 'comparison', label: 'Request a comparison' },
  { value: 'update', label: 'Update an existing listing' },
  { value: 'bug', label: 'Report incorrect information' },
]

export default function SubmitPage() {
  const [type, setType] = useState('new-tool')
  const [form, setForm] = useState({ name: '', url: '', category: '', description: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // TODO: Wire up form submission (Resend, Formspree, etc.)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 900)
  }

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Submit</span>
      </div>

      {/* HEADER */}
      <div className="px-6 py-6 border-b-2 border-ink">
        <h1 className="font-serif text-3xl font-bold text-ink mb-1">Submit a Tool</h1>
        <p className="text-sm text-ink-3">
          We review 10–15 new tools per month. Submissions are free and there's no guarantee of coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">

        {/* FORM */}
        <div className="p-6 border-r border-border">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="font-serif text-2xl font-bold text-ink mb-2">Thanks — we got it.</div>
              <p className="text-sm text-ink-3 mb-6 max-w-sm mx-auto leading-relaxed">
                We review every submission. If it's a good fit, we'll reach out within 2–4 weeks.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/directory" className="font-mono text-xs text-white bg-ink px-5 py-2.5 hover:bg-beat-red transition-colors">
                  Browse the directory →
                </Link>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', url: '', category: '', description: '', email: '' }) }}
                  className="font-mono text-xs border border-border px-5 py-2.5 hover:bg-paper-2 transition-colors"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Submission type */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-2">
                  Type of submission
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`text-left text-xs p-3 border transition-colors ${
                        type === t.value
                          ? 'border-ink bg-paper-2 font-semibold text-ink'
                          : 'border-border text-ink-3 hover:bg-paper-2'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool name */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-1.5">
                  Tool name *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Notion, Jasper AI, Cursor…"
                  className="w-full bg-transparent border border-border text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
                />
              </div>

              {/* URL */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-1.5">
                  Tool URL *
                </label>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="https://yourtool.com"
                  className="w-full bg-transparent border border-border text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full bg-paper border border-border text-ink text-sm px-3 py-2.5 outline-none focus:border-ink-2 transition-colors"
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-1.5">
                  Why should we review this? *
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What makes this tool unique? Who is it for? Any notable customers or case studies?"
                  rows={4}
                  className="w-full bg-transparent border border-border text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors resize-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-mono text-[10px] text-ink-4 uppercase tracking-widest block mb-1.5">
                  Your email (optional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="If you'd like us to follow up"
                  className="w-full bg-transparent border border-border text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-white text-sm font-semibold py-3 hover:bg-beat-red transition-colors disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit →'}
              </button>

              <p className="font-mono text-[10px] text-ink-4">
                Submissions are reviewed weekly. We do not guarantee coverage or respond to every submission.
              </p>
            </form>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="p-5 space-y-5">
          <div>
            <div className="section-label">What we look for</div>
            <ul className="mt-3 space-y-2">
              {[
                'Genuinely useful for founders or freelancers',
                'Has a free plan or fair trial',
                'Actively maintained and updated',
                'Honest, transparent pricing',
                'Not a pure copycat with no differentiation',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-xs text-ink-2">
                  <span className="text-beat-green shrink-0">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <div className="section-label">Timeline</div>
            <div className="mt-3 space-y-3">
              {[
                { step: '1', label: 'You submit', desc: 'Takes 2 minutes' },
                { step: '2', label: 'We review', desc: '2–4 weeks' },
                { step: '3', label: 'If accepted', desc: 'We reach out' },
                { step: '4', label: 'Published', desc: 'In the directory + newsletter' },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <span className="font-mono text-[10px] text-ink-4 min-w-[16px]">{s.step}.</span>
                  <div>
                    <div className="text-xs font-semibold text-ink">{s.label}</div>
                    <div className="font-mono text-[10px] text-ink-4">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="section-label">Advertising</div>
            <p className="text-xs text-ink-3 mt-2 leading-relaxed">
              Want guaranteed placement? We offer sponsored listings and newsletter placements.
            </p>
            <a
              href="mailto:hello@aibeat.dev"
              className="font-mono text-[11px] text-beat-red hover:underline mt-2 block"
            >
              Email hello@aibeat.dev →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
