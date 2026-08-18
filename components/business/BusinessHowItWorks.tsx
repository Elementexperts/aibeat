import { BarChart3, Boxes, Gauge, ShieldCheck } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Discover',
    heading: 'Understand your AI stack',
    body: 'Build an inventory of AI tools and services being used across the organization.',
    icon: Boxes,
  },
  {
    number: '02',
    title: 'Measure',
    heading: 'Understand spend and usage',
    body: 'Track subscriptions, seats, renewals, utilization, and overall AI software costs.',
    icon: BarChart3,
  },
  {
    number: '03',
    title: 'Optimize',
    heading: 'Identify waste and overlap',
    body: 'Surface underused subscriptions, overlapping capabilities, and potential consolidation opportunities.',
    icon: Gauge,
  },
  {
    number: '04',
    title: 'Govern',
    heading: 'Create centralized AI oversight',
    body: 'Help teams establish clearer policies, ownership, approvals, and visibility across their AI stack.',
    icon: ShieldCheck,
  },
]

export function BusinessHowItWorks() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025] py-20">
      <div className="site-shell">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Beyond the Estimate</p>
          <h2 className="mt-3 text-balance text-4xl font-black text-white md:text-6xl">From AI Spend Estimate to AI Intelligence</h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            The calculator gives you a starting point. AIBeat Business is being designed to create a clearer system of record for the AI tools your company actually uses.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-sm font-semibold text-slate-500">{step.number}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-100">
                  <step.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">{step.title}</p>
              <h3 className="mt-3 text-xl font-black text-white">{step.heading}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Illustrative Example</p>
              <h3 className="mt-3 text-3xl font-black text-white">40-person digital agency</h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">Illustrative scenario only - not an AIBeat customer result or guaranteed saving.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['14 AI products identified', '$4,600 monthly AI spend', '5 potentially overlapping capabilities', '9 low-utilization seats'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                  {item}
                </div>
              ))}
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">Potential Optimization Opportunity</p>
                <p className="mt-2 text-3xl font-black text-white">$8,000-$14,000 / year</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
