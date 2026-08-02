import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Partner With AIBeat',
  description: 'Explore AIBeat partnerships for founders, newsletters, content, launch communities, and software marketplaces.',
}

const TYPES = ['Affiliate partnerships', 'Newsletter sponsorship', 'Launch partnerships', 'Content partnerships', 'Founder communities', 'Software marketplace partnerships']

export default function PartnersPage() {
  return (
    <div className="dark-page">
      <section className="site-shell py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Partners</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl">Build AI discovery momentum with AIBeat</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          AIBeat works with relevant founders, communities, and software companies on clearly labeled discovery, launch, and content partnerships.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TYPES.map((type) => (
            <div key={type} className="premium-card p-6">
              <h2 className="text-lg font-semibold text-white">{type}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Structured collaboration for relevant audiences without unsupported reach claims.</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-8">
          <h2 className="text-2xl font-black text-white">Start a partnership conversation</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Send your company, website, audience, partnership idea, and timeline. AIBeat replies when the fit is relevant.</p>
          <Link href="/advertise" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Contact AIBeat</Link>
        </div>
      </section>
    </div>
  )
}
