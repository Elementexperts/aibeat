import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { DISCLOSURE_RULES, FEATURE_MATRIX_COLUMNS, FEATURE_MATRIX_ROWS, FOUNDER_PROCESS, FOUNDER_SERVICE_PLANS, PAID_SUBMISSION_PLAN_IDS, formatPlanPrice, inquiryHref, type FounderServicePlan } from '@/lib/founder-services'
import { founderEventForPlan, FOUNDER_ANALYTICS_EVENTS, type FounderAnalyticsEvent } from '@/lib/analytics'
import { FounderAnalytics } from './FounderAnalytics'

const categoryTone: Record<FounderServicePlan['category'], string> = {
  listing: 'border-green-300/20 bg-green-300/10 text-green-100',
  spotlight: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
  launch: 'border-purple-300/20 bg-purple-300/10 text-purple-100',
  newsletter: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  article: 'border-orange-300/20 bg-orange-300/10 text-orange-100',
  partnership: 'border-blue-300/20 bg-blue-300/10 text-blue-100',
}

export function FounderHero({
  eyebrow,
  title,
  description,
  primaryHref = '/submit',
  primaryLabel = 'Submit a Tool',
  secondaryHref = '/advertise',
  secondaryLabel = 'Discuss Promotion',
  viewEvent,
}: {
  eyebrow: string
  title: string
  description: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  viewEvent?: FounderAnalyticsEvent
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <FounderAnalytics viewEvent={viewEvent} />
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-12 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl" />
      </div>
      <div className="site-shell grid gap-10 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-black leading-[0.98] tracking-tight text-white md:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">{description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} data-founder-event={FOUNDER_ANALYTICS_EVENTS.pricingPlanSelect} className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={secondaryHref} data-founder-event={FOUNDER_ANALYTICS_EVENTS.mediaKitRequest} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40">
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <div className="text-sm font-semibold text-white">Founder pathways</div>
            <div className="mt-6 grid gap-3">
              {FOUNDER_SERVICE_PLANS.slice(0, 5).map((item) => (
                <Link key={item.id} href={item.ctaHref} data-founder-event={founderEventForPlan(item.id)} data-plan-id={item.id} className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{formatPlanPrice(item)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-200" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ServiceCard({ item, compact = false }: { item: FounderServicePlan; compact?: boolean }) {
  const isPaidSubmissionPlan = PAID_SUBMISSION_PLAN_IDS.includes(item.id as typeof PAID_SUBMISSION_PLAN_IDS[number])
  const ctaHref = isPaidSubmissionPlan ? `/submit?plan=${encodeURIComponent(item.id)}` : item.ctaHref

  return (
    <article className="premium-card flex h-full flex-col p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${categoryTone[item.category]}`}>
          {item.badge || item.category}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-400">{formatPlanPrice(item)}</span>
      </div>
      <h2 className="mt-5 text-2xl font-black leading-tight text-white">{item.name}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-400">{item.shortDescription}</p>
      {!compact && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-6 text-slate-300">
          Best for: {item.primaryAudience}
        </p>
      )}
      <ul className="mt-5 flex-1 space-y-3">
        {item.features.slice(0, compact ? 3 : 4).map((feature) => (
          <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-6 text-slate-500">{item.disclosure}</p>
      {item.placementDuration && <p className="mt-4 text-xs leading-6 text-cyan-100">Duration: {item.placementDuration}</p>}
      {item.turnaround && <p className="mt-2 text-xs leading-6 text-slate-400">Turnaround: {item.turnaround}</p>}
      <Link href={ctaHref} data-founder-event={founderEventForPlan(item.id)} data-plan-id={item.id} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100">
        {item.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}

export function ServiceGrid({ ids, compact = false }: { ids?: string[]; compact?: boolean }) {
  const items = ids ? FOUNDER_SERVICE_PLANS.filter((item) => ids.includes(item.id) && item.active) : FOUNDER_SERVICE_PLANS.filter((item) => item.active)
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ServiceCard key={item.id} item={item} compact={compact} />
      ))}
    </div>
  )
}

export function ProcessSection() {
  return (
    <section className="site-shell py-16">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">How it works</p>
        <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">A clearer path from submission to visibility</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {FOUNDER_PROCESS.map((step, index) => (
          <div key={step.title} className="premium-card p-5">
            <div className="font-mono text-sm text-cyan-200">{String(index + 1).padStart(2, '0')}</div>
            <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DisclosureSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025] py-16">
      <div className="site-shell">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Trust rules</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Commercial content is labeled clearly</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            AIBeat does not sell rankings, fake reviews, or undisclosed promotional content.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {DISCLOSURE_RULES.map((rule) => (
            <div key={rule.label} className="premium-card p-5">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
              <h3 className="mt-4 text-lg font-semibold text-white">{rule.label}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ComparisonTable({ ids }: { ids?: string[] }) {
  const items = ids ? FOUNDER_SERVICE_PLANS.filter((item) => ids.includes(item.id) && item.active) : FOUNDER_SERVICE_PLANS.filter((item) => item.active)
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_1fr_1fr] bg-white/[0.06] text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <div className="p-4">Package</div>
        <div className="border-l border-white/10 p-4">Type</div>
        <div className="border-l border-white/10 p-4">Pricing</div>
        <div className="border-l border-white/10 p-4">Best fit</div>
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_1fr_1fr] border-t border-white/10 bg-white/[0.025] text-sm text-slate-300">
          <div className="p-4 font-semibold text-white">{item.name}</div>
          <div className="border-l border-white/10 p-4 capitalize">{item.category}</div>
          <div className="border-l border-white/10 p-4">{formatPlanPrice(item)}</div>
          <div className="border-l border-white/10 p-4">{item.primaryAudience}</div>
        </div>
      ))}
    </div>
  )
}

function valueTone(value: string) {
  if (value === 'Included') return 'border-green-300/20 bg-green-300/10 text-green-100'
  if (value === 'Not included') return 'border-white/10 bg-white/[0.03] text-slate-500'
  if (value === 'Considered') return 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'
  if (value === 'Optional add-on') return 'border-amber-300/20 bg-amber-300/10 text-amber-100'
  if (value === 'Custom') return 'border-purple-300/20 bg-purple-300/10 text-purple-100'
  return 'border-white/10 bg-white/[0.03] text-slate-300'
}

export function FeatureMatrix() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="min-w-[920px] w-full border-collapse text-left">
        <thead className="bg-white/[0.06]">
          <tr>
            <th className="p-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Feature</th>
            {FEATURE_MATRIX_COLUMNS.map((column) => (
              <th key={column.planId} className="border-l border-white/10 p-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_MATRIX_ROWS.map((row) => (
            <tr key={row.label} className="border-t border-white/10 bg-white/[0.025]">
              <td className="p-4 text-sm font-semibold text-white">{row.label}</td>
              {FEATURE_MATRIX_COLUMNS.map((column) => {
                const value = row.values[column.planId] || 'Not included'
                return (
                  <td key={column.planId} className="border-l border-white/10 p-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${valueTone(value)}`}>{value}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InquiryCTA({ title = 'Not sure which option fits?', goal }: { title?: string; goal?: string }) {
  return (
    <section className="site-shell pb-20">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Founder inquiry</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Send your company, website, campaign goal, timeline, and what you want people to understand about the product.
            </p>
          </div>
          <a href={inquiryHref('AIBeat founder services inquiry', goal)} className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            Email AIBeat
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function NotIncludedList({ item }: { item: FounderServicePlan }) {
  return (
    <div className="premium-card p-6">
      <h2 className="text-xl font-black text-white">What this does not include</h2>
      <ul className="mt-5 space-y-3">
        {(item.exclusions || []).map((entry) => (
          <li key={entry} className="flex gap-3 text-sm leading-6 text-slate-400">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
