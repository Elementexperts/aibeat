import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, BarChart3, ShieldCheck, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How AIBeat Score Works',
  description: 'Learn how AIBeat Score helps readers evaluate AI tools using consistent product and discovery signals, plus the limits of the score.',
  alternates: { canonical: '/ai-score' },
}

const SIGNALS = [
  {
    title: 'Product rating',
    body: 'Tool profiles include a rating value from the AIBeat data set. That value is the visible score readers see on cards and product pages.',
  },
  {
    title: 'Discovery ranking',
    body: 'Popular-tool ordering uses rating plus existing discovery signals: featured status, free or freemium access, selected high-interest categories, and homepage anchor tools.',
  },
  {
    title: 'Workflow relevance',
    body: 'Categories, use cases, pros, cons, pricing type, and alternatives help readers understand where a product fits.',
  },
  {
    title: 'Editorial signal',
    body: 'AIBeat uses curation and editorial context to help separate useful products from generic directory noise.',
  },
]

const LIMITATIONS = [
  'AIBeat Score is a discovery aid, not a guarantee that a product is the best choice for every user.',
  'Scores should be read alongside pricing, use case fit, pros, cons, alternatives, and the product website.',
  'AIBeat does not claim that the score is fully objective or based on undisclosed third-party audits.',
  'Product data can change, so readers should verify current pricing, features, and policies before buying.',
]

export default function AIScorePage() {
  return (
    <div className="dark-page overflow-hidden">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-8 top-8 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="site-shell py-16 md:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm font-semibold text-cyan-100">
            <BarChart3 className="h-4 w-4" />
            AIBeat Score
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-black leading-[0.98] text-white md:text-7xl">
            A clearer signal for comparing AI tools
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            AIBeat Score helps readers quickly evaluate products using a consistent set of product and discovery signals. It is meant to speed up discovery, not replace your own product evaluation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/directory" className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              Explore AI Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/affiliate-disclosure" className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:border-cyan-300/40">
              Read Disclosure Policy
            </Link>
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Signals</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">What the current implementation uses</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {SIGNALS.map((signal) => (
            <article key={signal.title} className="premium-card p-5">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-5 text-lg font-semibold text-white">{signal.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{signal.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell grid gap-6 lg:grid-cols-2">
          <article className="premium-card p-6 md:p-8">
            <BadgeCheck className="h-6 w-6 text-green-300" />
            <h2 className="mt-5 text-3xl font-black text-white">Sponsored placement and scores are separate</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              The existing paid listing packages do not silently change a product rating. Featured, Spotlight, Sponsored, and affiliate formats must be labeled where placement could affect reader interpretation.
            </p>
          </article>
          <article className="premium-card p-6 md:p-8">
            <ShieldCheck className="h-6 w-6 text-cyan-200" />
            <h2 className="mt-5 text-3xl font-black text-white">Editorial independence</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Payment does not buy rankings, review scores, positive editorial opinion, hidden endorsement, or guaranteed newsletter coverage.
            </p>
          </article>
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Limits</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">How to read the score</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {LIMITATIONS.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
