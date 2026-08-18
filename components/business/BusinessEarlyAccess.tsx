'use client'

import { FormEvent, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { BUSINESS_ANALYTICS_EVENTS } from '@/lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const COMPANY_SIZES = ['1-9', '10-19', '20-49', '50-100', '101-250', '250+']

type FormState = {
  email: string
  company: string
  companySize: string
  designPartner: boolean
  website: string
}

const INITIAL_STATE: FormState = {
  email: '',
  company: '',
  companySize: '',
  designPartner: false,
  website: '',
}

function track(eventName: string, detail?: Record<string, unknown>) {
  window.gtag?.('event', eventName, {
    event_category: 'aibeat_business',
    ...detail,
  })
}

export function BusinessEarlyAccess() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const submittingRef = useRef(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setStatus('loading')
    setMessage('')
    track(BUSINESS_ANALYTICS_EVENTS.earlyAccessClicked, { source: 'early_access_form' })

    try {
      const response = await fetch('/api/business/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not submit right now')
      }

      setStatus('success')
      setForm(INITIAL_STATE)
      setMessage('You are on the early access list. We will follow up when AIBeat Business opens for design partners and beta teams.')
      track(BUSINESS_ANALYTICS_EVENTS.earlyAccessSubmitted, {
        company_size: form.companySize,
        design_partner: form.designPartner,
      })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Could not submit right now')
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <section id="business-early-access" className="site-shell scroll-mt-28 py-20">
      <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-6 md:p-9 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Early Access</p>
          <h2 className="mt-3 text-balance text-4xl font-black text-white md:text-5xl">
            Want to understand what&apos;s actually happening inside your AI stack?
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            AIBeat Business is being developed for growing companies that want better visibility into AI tools, subscriptions, spend, usage, and optimization opportunities.
          </p>
          {status === 'success' && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-4 text-sm leading-6 text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-black/20 p-5 md:p-6">
          <input
            type="text"
            value={form.website}
            onChange={(event) => update('website', event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Work email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Company</span>
              <input
                required
                type="text"
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                placeholder="Company name"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Company size</span>
              <select
                required
                value={form.companySize}
                onChange={(event) => update('companySize', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            <input
              type="checkbox"
              checked={form.designPartner}
              onChange={(event) => update('designPartner', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/10 accent-cyan-300"
            />
            <span>I&apos;m interested in becoming an AIBeat Business design partner.</span>
          </label>

          {status === 'error' && <p className="mt-4 text-sm text-red-200">{message}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="gradient-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? 'Joining...' : 'Join AIBeat Business Early Access'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  )
}
