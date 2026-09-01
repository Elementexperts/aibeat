'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { getPaidSubmissionPlans } from '@/data/founder-services'

export function SubmissionPricingCards() {
  const plans = getPaidSubmissionPlans()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const featured = plan.id === 'featured'

        return (
          <article
            key={plan.id}
            data-plan-id={plan.id}
            className={`premium-card flex h-full flex-col p-5 md:p-6 ${featured ? 'border-cyan-300/40 bg-cyan-300/[0.08]' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {plan.name}
              </span>
              {plan.badge && (
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                  {plan.badge}
                </span>
              )}
            </div>

            <div className="mt-5 text-3xl font-black text-white">{plan.priceLabel.replace(' one time', '')}</div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">One time</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">{plan.shortDescription}</p>

            <ul className="mt-5 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.turnaround && <p className="mt-5 text-xs leading-6 text-slate-400">Expected review turnaround: {plan.turnaround}</p>}
            <p className="mt-3 text-xs leading-6 text-slate-500">{plan.disclosure}</p>

            <Link
              href={`/submit?plan=${encodeURIComponent(plan.id)}`}
              data-plan-id={plan.id}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-100"
            >
              {plan.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        )
      })}
    </div>
  )
}
