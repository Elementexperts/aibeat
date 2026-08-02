import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AIBeat Spotlight',
  description: 'Featured placement, enhanced listings, newsletter consideration, and editorial opportunities for relevant AI products.',
}

const PLANS = [
  { name: 'Directory', body: 'A clear AIBeat listing with category placement and searchable product context.', price: 'Free review' },
  { name: 'Spotlight', body: 'Enhanced presentation and featured placement for relevant AI tools and launches.', price: 'Contact for availability' },
  { name: 'Launch Feature', body: 'A launch-focused story with product benefits, use cases, media, and founder context.', price: 'Contact for availability' },
  { name: 'Editorial Partnership', body: 'Newsletter, article, founder interview, or clearly labeled partner-content opportunities.', price: 'Contact for availability' },
]

export default function SpotlightPage() {
  return (
    <div className="dark-page">
      <section className="site-shell py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">AIBeat Spotlight</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-white md:text-7xl">Put your AI product in the spotlight</h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Give your launch or growing product a stronger presence across AIBeat through enhanced listings, editorial opportunities, and targeted exposure.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <article key={plan.name} className="premium-card flex min-h-[260px] flex-col p-6">
              <h2 className="text-2xl font-black text-white">{plan.name}</h2>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">{plan.body}</p>
              <div className="mt-6 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">{plan.price}</div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <h2 className="text-2xl font-black text-white">Transparent placement rules</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            AIBeat labels sponsored or partner content clearly. Spotlight does not guarantee rankings, traffic, sales, leads, or editorial endorsements.
          </p>
          <Link href="/advertise" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
            Ask about availability
          </Link>
        </div>
      </section>
    </div>
  )
}
