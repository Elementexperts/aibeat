import Link from 'next/link'
import { TOOLS, TRENDING } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Tool Reviews — AIBeat.dev',
  description: 'Honest, hands-on reviews of the best AI tools for founders and freelancers. Updated monthly.',
}

export default function ToolsPage() {
  const categories = Array.from(new Set(TOOLS.map((t) => t.category)))

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* PAGE HEADER */}
      <div className="px-6 py-5 border-b-2 border-ink flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-beat-red">Home</Link>
            <span className="mx-1">/</span>
            <span>Tool Reviews</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink">AI Tool Reviews</h1>
        </div>
        <p className="text-xs text-ink-3 max-w-xs text-right hidden md:block">
          {TOOLS.length} tools reviewed. Honest takes, no fluff.
        </p>
      </div>

      {/* CATEGORY FILTER ROW */}
      <div className="flex items-center border-b border-border overflow-x-auto">
        <span className="font-mono text-[10px] text-ink-4 px-4 py-3 shrink-0 border-r border-border">
          Browse by:
        </span>
        {categories.map((cat) => (
          <span
            key={cat}
            className="font-mono text-[10px] px-4 py-3 border-r border-border text-ink-3 whitespace-nowrap hover:bg-paper-2 hover:text-ink cursor-pointer transition-colors"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {TOOLS.map((tool, i) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`}>
            <div className={`p-4 border-b border-border card-hover ${i % 4 !== 3 ? 'md:border-r' : ''} border-border`}>
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold text-white mb-3"
                style={{ background: tool.logo }}
              >
                {tool.logoInitials}
              </div>
              <div className="text-sm font-semibold text-ink mb-0.5">{tool.name}</div>
              <div className="font-mono text-[10px] text-ink-4 uppercase tracking-wide mb-1.5">{tool.category}</div>
              <p className="text-[11px] text-ink-3 leading-relaxed mb-2 line-clamp-2">{tool.tagline}</p>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-yellow-600">★ {tool.rating}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                  tool.pricingType === 'free'      ? 'bg-beat-green-light text-beat-green' :
                  tool.pricingType === 'freemium'  ? 'bg-yellow-50 text-yellow-700' :
                                                     'bg-paper-3 text-ink-2'
                }`}>
                  {tool.pricingType === 'free' ? 'Free' : tool.pricingType === 'freemium' ? 'Freemium' : tool.pricing}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* BOTTOM GRID — Trending + Submit */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] border-t-2 border-ink">

        {/* Trending searches */}
        <div className="p-6 border-r border-border">
          <div className="section-label">What people are searching</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {TRENDING.map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center gap-2 py-2.5 border-b border-border card-hover">
                  <span className="font-mono text-[10px] text-ink-4 min-w-[20px]">{i + 1}</span>
                  <span className="flex-1 text-xs text-ink-2">{item.query}</span>
                  <span className={`font-mono text-[10px] font-medium ${item.change === 'BREAKOUT' ? 'text-beat-red' : 'text-beat-green'}`}>
                    {item.change}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="p-6 bg-paper-2 flex flex-col justify-center">
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">Submit a tool</div>
          <h2 className="font-serif text-xl font-bold text-ink mb-2 leading-tight">
            Is your tool<br />missing from the list?
          </h2>
          <p className="text-xs text-ink-3 mb-4 leading-relaxed">
            We review 10–15 new tools every month. Submit yours for consideration — completely free.
          </p>
          <Link
            href="/submit"
            className="font-mono text-[11px] text-white bg-ink px-4 py-2.5 hover:bg-beat-red transition-colors inline-block text-center"
          >
            Submit a tool →
          </Link>
        </div>
      </div>
    </div>
  )
}
