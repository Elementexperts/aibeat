import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Claim an AIBeat Listing',
  description: 'Request ownership review for an AIBeat tool listing and submit listing updates for manual approval.',
}

export default function ClaimPage() {
  return (
    <div className="dark-page">
      <section className="site-shell py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Claim a Listing</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight text-white md:text-7xl">Request a manual ownership review</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          AIBeat does not grant instant edit access. Founders can request review, submit updated information, and explore Spotlight services after ownership is checked.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            'Use a matching domain email when possible.',
            'Share the listing URL and official product website.',
            'AIBeat reviews updates before publishing changes.',
          ].map((item) => (
            <div key={item} className="premium-card p-6 text-sm leading-7 text-slate-300">{item}</div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-8">
          <h2 className="text-2xl font-black text-white">Submit a claim request</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Use the submission form and choose &quot;Update an existing listing.&quot; Include your domain email and the listing URL.</p>
          <Link href="/submit" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Open submission form</Link>
        </div>
      </section>
    </div>
  )
}
