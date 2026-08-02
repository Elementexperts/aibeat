import type { Metadata } from 'next'
import Link from 'next/link'
import { TOOLS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'AI Tool Categories',
  description: 'Browse AI tools by workflow, category, pricing, and use case on AIBeat.',
}

export default function CategoriesPage() {
  const categories = Array.from(new Set(TOOLS.map((tool) => tool.category))).map((category) => ({
    category,
    tools: TOOLS.filter((tool) => tool.category === category),
  }))

  return (
    <div className="dark-page">
      <section className="site-shell py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Categories</p>
        <h1 className="mt-4 text-5xl font-black text-white md:text-6xl">Explore AI tools by workflow</h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <Link key={item.category} href={`/directory?category=${encodeURIComponent(item.category)}`} className="premium-card p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-white">{item.category}</h2>
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-400">{item.tools.length} tools</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                Discover products, reviews, and alternatives for {item.category.toLowerCase()} workflows.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tools.slice(0, 3).map((tool) => (
                  <span key={tool.slug} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{tool.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
