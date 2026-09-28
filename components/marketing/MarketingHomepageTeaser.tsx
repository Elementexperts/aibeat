import Link from 'next/link'
import { ArrowRight, Megaphone } from 'lucide-react'

const SERVICES = [
  ['01', 'Get discovered', 'AI directory listings and a clear go-to-market plan.'],
  ['02', 'Build your presence', 'Social content and founder-led storytelling.'],
  ['03', 'Grow your pipeline', 'Email, search visibility, and outreach.'],
]

export function MarketingHomepageTeaser() {
  return (
    <section aria-labelledby="marketing-heading" className="border-t border-white/10 py-16">
      <div className="site-shell">
        <div className="relative overflow-hidden rounded-[2rem] border border-orange-200/20 bg-gradient-to-br from-orange-300/10 via-rose-300/5 to-transparent p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">
                <Megaphone aria-hidden="true" className="h-4 w-4" />
                AIBeat Marketing
              </p>
              <h2 id="marketing-heading" className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
                You build the product.<br />
                <span className="text-orange-200">We help it get found.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Done-for-you marketing for AI startups. Turn your launch into ongoing discovery with listings, content, and a plan built around your customers.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href="/marketing" className="inline-flex items-center gap-2 rounded-full bg-orange-200 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-200">
                  Explore AIBeat Marketing <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <p className="text-sm text-slate-400">Plans from $850 for the first month</p>
              </div>
            </div>
            <ol className="divide-y divide-orange-200/15 rounded-3xl border border-orange-200/15 bg-black/20 px-6">
              {SERVICES.map(([number, title, description]) => (
                <li key={number} className="flex gap-5 py-6">
                  <span aria-hidden="true" className="pt-1 font-mono text-sm text-orange-200/70">{number}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
