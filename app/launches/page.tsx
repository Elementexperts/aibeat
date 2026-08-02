import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeaturedTools } from '@/lib/data'
import { PremiumToolCard } from '@/components/ui/PremiumToolCard'

export const metadata: Metadata = {
  title: 'AI Startup Launches',
  description: 'Explore AI products and startup launches curated by AIBeat.',
}

export default function LaunchesPage() {
  const launches = getFeaturedTools()

  return (
    <div className="dark-page">
      <section className="site-shell py-16">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Launches</p>
            <h1 className="mt-4 text-5xl font-black text-white md:text-6xl">AI products launching now</h1>
            <p className="mt-5 max-w-2xl text-slate-400">
              A future-ready launch surface for tools, founder stories, and editorial product coverage.
            </p>
          </div>
          <Link href="/launch" className="gradient-button rounded-full px-5 py-3 text-sm font-semibold">Launch on AIBeat</Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {launches.map((tool) => (
            <PremiumToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  )
}
