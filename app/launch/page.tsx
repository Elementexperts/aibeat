import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Launch on AIBeat',
  description: 'Create a founder-friendly launch presence for your AI product on AIBeat with clear editorial standards and promotional options.',
}

const STEPS = [
  'Submit your product',
  'AIBeat reviews the information',
  'Choose a launch or Spotlight option',
  'Prepare your launch page',
  'Publish and promote',
]

export default function LaunchPage() {
  return (
    <div className="dark-page">
      <section className="site-shell py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Launch on AIBeat</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-white md:text-7xl">Give your AI launch a clearer story.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            AIBeat helps founders present new products, major updates, and public releases to people actively exploring AI tools and workflows.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/submit" className="gradient-button inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
              Start a Launch Submission
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/spotlight" className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white">
              Explore Spotlight
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-5">
          {STEPS.map((step, index) => (
            <div key={step} className="premium-card p-5">
              <div className="text-sm font-mono text-cyan-200">{String(index + 1).padStart(2, '0')}</div>
              <div className="mt-4 text-sm font-semibold leading-6 text-white">{step}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {[
            'Dedicated launch narrative with logo, screenshots, use cases, and founder context when provided.',
            'Clear separation between free editorial consideration and paid promotional placement.',
            'Optional newsletter, Spotlight, founder interview, and partner-content opportunities when available.',
          ].map((item) => (
            <div key={item} className="premium-card p-6">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
              <p className="mt-4 text-sm leading-7 text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
