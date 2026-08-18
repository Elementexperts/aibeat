'use client'

import { ArrowUpRight } from 'lucide-react'
import { BUSINESS_ANALYTICS_EVENTS } from '@/lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function BusinessSurveyCTA() {
  return (
    <section className="site-shell pb-24">
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Product research - No sales pitch</p>
            <h2 className="mt-3 text-3xl font-black text-white">Help Shape AIBeat Business</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Are you a founder, COO, finance leader, operations leader, or technology manager at a growing company? We&apos;re researching how organizations use and manage AI tools, subscriptions, spending, and workflows.
            </p>
          </div>
          <a
            href="https://tally.so/r/D4O4Pp"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => window.gtag?.('event', BUSINESS_ANALYTICS_EVENTS.surveyClicked, { event_category: 'aibeat_business' })}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
          >
            Take the 4-Minute Survey
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
