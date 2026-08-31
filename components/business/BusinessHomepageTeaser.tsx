'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Layers3 } from 'lucide-react'
import { BUSINESS_ANALYTICS_EVENTS } from '@/lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const CHIPS = ['Company memory', 'Specialized agents', 'Governed workflows', 'AI spend visibility']

function trackTeaserClick() {
  window.gtag?.('event', BUSINESS_ANALYTICS_EVENTS.teaserClicked, {
    event_category: 'aibeat_business',
    destination: '/business',
  })
}

export function BusinessHomepageTeaser() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025] py-16">
      <div className="site-shell">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-cyan-300/[0.04] p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
                <BarChart3 className="h-4 w-4" />
                AIBeat Business
              </div>
              <h2 className="mt-5 max-w-3xl text-balance text-3xl font-black leading-tight text-white md:text-5xl">
                For teams operating AI inside the company
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
                AIBeat Business is separate from public discovery: one company memory, specialized AI agents, governed recurring workflows, approvals, reporting, and AI spend visibility.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {CHIPS.map((chip) => (
                  <span key={chip} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-100">
                <Layers3 className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">
                Built for growing teams that need to operate AI with context, controls, and measurable usage.
              </p>
              <Link
                href="/business"
                onClick={trackTeaserClick}
                className="gradient-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold sm:w-auto"
              >
                Explore AIBeat Business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/business/ai-spend-calculator"
                className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 sm:w-auto"
              >
                Calculate AI Spend
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
