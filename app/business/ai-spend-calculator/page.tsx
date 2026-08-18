import type { Metadata } from 'next'
import { ArrowDown, ArrowRight, Building2, LineChart, Sparkles } from 'lucide-react'
import { AISpendCalculator } from '@/components/business/AISpendCalculator'
import { BusinessEarlyAccess } from '@/components/business/BusinessEarlyAccess'
import { BusinessHowItWorks } from '@/components/business/BusinessHowItWorks'
import { BusinessSurveyCTA } from '@/components/business/BusinessSurveyCTA'

export const metadata: Metadata = {
  title: 'AI Spend Efficiency Calculator | AIBeat Business',
  description: "Estimate your company's AI software spending and potential optimization opportunities. Explore AI stack visibility, overlap, utilization, and Shadow AI with AIBeat Business.",
  alternates: {
    canonical: '/business/ai-spend-calculator',
  },
  openGraph: {
    title: 'AI Spend Efficiency Calculator | AIBeat Business',
    description: "Estimate your company's AI software spending and potential optimization opportunities with AIBeat Business.",
    url: '/business/ai-spend-calculator',
    siteName: 'AIBeat.dev',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AIBeat Business AI Spend Efficiency Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Spend Efficiency Calculator | AIBeat Business',
    description: "Estimate your company's AI software spending and potential optimization opportunities with AIBeat Business.",
    images: ['/og-image.png'],
  },
}

export default function AISpendCalculatorPage() {
  return (
    <div className="dark-page overflow-hidden bg-[#0B0F19]">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="site-shell grid min-h-[620px] items-center gap-10 py-16 lg:grid-cols-[1fr_0.82fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
              <Sparkles className="h-4 w-4" />
              AIBeat Business - AI Spend Intelligence
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-black leading-[0.98] tracking-tight text-white md:text-7xl">
              How Efficient Is Your AI Stack?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Estimate your company&apos;s AI software spend, potential overlap, and optimization opportunity in less than a minute.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Understand the financial impact of a fragmented AI stack before adding another subscription.
            </p>
            <a
              href="#calculator"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40"
            >
              Use the calculator below
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-cyan-950/20">
            <div className="grid gap-3">
              {[
                { label: 'Fragmented subscriptions', value: 'Expense cards, SaaS renewals, team trials', icon: Building2 },
                { label: 'AI spend signal', value: 'Monthly cost, annualized exposure, optimization scenarios', icon: LineChart },
                { label: 'Next step', value: 'Move from estimate to stack intelligence', icon: ArrowRight },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white">{item.label}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="calculator" className="scroll-mt-28 py-20">
        <div className="site-shell">
          <AISpendCalculator />
        </div>
      </section>

      <BusinessHowItWorks />
      <BusinessEarlyAccess />
      <BusinessSurveyCTA />
    </div>
  )
}
