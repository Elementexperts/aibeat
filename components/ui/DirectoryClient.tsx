'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TOOLS, getPopularTools } from '@/lib/data'
import { PUBLIC_ANALYTICS_EVENTS } from '@/lib/analytics'
import { ToolLogo } from '@/components/ui/ToolLogo'
import { ToolAffiliateOffer } from '@/components/ui/ToolAffiliateOffer'

const ALL = 'All'
const PRICING_OPTIONS = [ALL, 'Free', 'Freemium', 'Paid'] as const

export default function DirectoryClient() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [activePricing, setActivePricing] = useState<string>(ALL)
  const rankedTools = useMemo(() => getPopularTools(), [])

  const categories = useMemo(() => [ALL, ...Array.from(new Set(rankedTools.map((t) => t.category)))], [rankedTools])

  const filtered = useMemo(() => {
    return rankedTools.filter((tool) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
      const matchCat = activeCategory === ALL || tool.category === activeCategory
      const matchPrice =
        activePricing === ALL ||
        (activePricing === 'Free' && tool.pricingType === 'free') ||
        (activePricing === 'Freemium' && tool.pricingType === 'freemium') ||
        (activePricing === 'Paid' && tool.pricingType === 'paid')
      return matchSearch && matchCat && matchPrice
    })
  }, [search, activeCategory, activePricing, rankedTools])

  const isFiltering = search || activeCategory !== ALL || activePricing !== ALL

  // Group by category for unfiltered browsing
  const groupedCategories = useMemo(() => {
    if (isFiltering) return null
    const seen = new Set<string>()
    const order: string[] = []
    rankedTools.forEach((t) => { if (!seen.has(t.category)) { seen.add(t.category); order.push(t.category) } })
    return order.map((cat) => ({ cat, tools: rankedTools.filter((t) => t.category === cat) }))
  }, [isFiltering, rankedTools])

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* PAGE HEADER */}
      <div className="px-6 py-5 border-b-2 border-ink flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-beat-red">Home</Link>
            <span className="mx-1">/</span>
            <span>Directory</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink">Tool Directory</h1>
        </div>
        <p className="text-xs text-ink-3 text-right hidden md:block">
          {TOOLS.length} tools reviewed · <Link href="/ai-score" data-analytics-event={PUBLIC_ANALYTICS_EVENTS.aiScoreLearnMore} className="hover:text-beat-red">AIBeat Score</Link>
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="px-6 py-4 border-b border-border">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools by name, category…"
          className="w-full bg-transparent border border-border text-ink text-sm px-4 py-2.5 outline-none placeholder:text-ink-4 focus:border-ink-2 transition-colors"
        />
      </div>

      {/* FILTER ROWS */}
      <div className="border-b border-border">
        {/* Category filter */}
        <div className="flex items-center overflow-x-auto border-b border-border">
          <span className="font-mono text-[10px] text-ink-4 px-4 py-2.5 shrink-0 border-r border-border">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-mono text-[10px] px-4 py-2.5 border-r border-border whitespace-nowrap transition-colors shrink-0 ${
                activeCategory === cat
                  ? 'bg-ink text-white'
                  : 'text-ink-3 hover:bg-paper-2 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Pricing filter */}
        <div className="flex items-center overflow-x-auto">
          <span className="font-mono text-[10px] text-ink-4 px-4 py-2.5 shrink-0 border-r border-border">Pricing:</span>
          {PRICING_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setActivePricing(opt)}
              className={`font-mono text-[10px] px-4 py-2.5 border-r border-border whitespace-nowrap transition-colors shrink-0 ${
                activePricing === opt
                  ? 'bg-ink text-white'
                  : 'text-ink-3 hover:bg-paper-2 hover:text-ink'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS */}
      {isFiltering ? (
        /* FLAT FILTERED LIST */
        <div>
          <div className="px-6 pt-4 pb-2">
            <div className="section-label">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-ink-3">No tools match your filters.</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory(ALL); setActivePricing(ALL) }}
                className="font-mono text-xs text-beat-red mt-3 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4">
              {filtered.map((tool, i) => (
                <ToolCard key={tool.slug} tool={tool} i={i} rank={rankedTools.findIndex((ranked) => ranked.slug === tool.slug) + 1} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GROUPED BY CATEGORY */
        groupedCategories?.map(({ cat, tools }) => (
          <div key={cat} className="border-b border-border">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="section-label">{cat}</div>
              <span className="font-mono text-[10px] text-ink-4">{tools.length} tool{tools.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {tools.map((tool, i) => (
                <ToolCard key={tool.slug} tool={tool} i={i} rank={rankedTools.findIndex((ranked) => ranked.slug === tool.slug) + 1} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* SUBMIT CTA */}
      <div className="px-6 py-8 text-center border-t-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">Missing a tool?</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">We review 10–15 new tools every month</h2>
        <p className="text-sm text-ink-3 mb-5 max-w-md mx-auto">
          Submit your tool for consideration. Free, no strings attached.
        </p>
        <Link
          href="/submit"
          className="font-mono text-xs text-white bg-ink px-6 py-3 hover:bg-beat-red transition-colors inline-block"
        >
          Submit a tool →
        </Link>
      </div>
    </div>
  )
}

function ToolCard({ tool, i, rank }: { tool: typeof TOOLS[number]; i: number; rank: number }) {
  return (
    <div className={`p-4 border-b border-border ${i % 4 !== 3 ? 'md:border-r' : ''}`}>
      <Link href={`/tools/${tool.slug}`} className="block card-hover">
        <div className="mb-3 flex items-center justify-between gap-3">
          <ToolLogo tool={tool} className="w-9 h-9 rounded-md text-sm" />
          <span className="font-mono text-[10px] text-ink-4">#{rank}</span>
        </div>
        <div className="text-sm font-semibold text-ink mb-0.5">{tool.name}</div>
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-wide mb-1.5">{tool.category}</div>
        <p className="text-[11px] text-ink-3 leading-relaxed mb-2 line-clamp-2">{tool.tagline}</p>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-semibold text-cyan-700">AIBeat Score {tool.rating}</span>
          <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
            tool.pricingType === 'free'     ? 'bg-beat-green-light text-beat-green' :
            tool.pricingType === 'freemium' ? 'bg-yellow-50 text-yellow-700' :
                                              'bg-paper-3 text-ink-2'
          }`}>
            {tool.pricingType === 'free' ? 'Free' : tool.pricingType === 'freemium' ? 'Freemium' : tool.pricing}
          </span>
        </div>
      </Link>
      {tool.affiliateOffer && (
        <div className="mt-3">
          <ToolAffiliateOffer tool={tool} />
        </div>
      )}
    </div>
  )
}
