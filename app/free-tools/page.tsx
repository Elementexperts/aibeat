import Link from 'next/link'
import { TOOLS, TRENDING } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI Tools — AIBeat.dev',
  description: 'The best free and freemium AI tools for founders and freelancers. No credit card required.',
}

export default function FreeToolsPage() {
  const freeTools = TOOLS.filter((t) => t.pricingType === 'free' || t.pricingType === 'freemium')
  const trulyFree = TOOLS.filter((t) => t.pricingType === 'free')
  const freemium = TOOLS.filter((t) => t.pricingType === 'freemium')

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* PAGE HEADER */}
      <div className="px-6 py-5 border-b-2 border-ink flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-beat-red">Home</Link>
            <span className="mx-1">/</span>
            <span>Free Tools</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink">Free AI Tools</h1>
        </div>
        <p className="text-xs text-ink-3 max-w-xs text-right hidden md:block">
          {freeTools.length} tools with free access
        </p>
      </div>

      {/* ROI CALCULATOR CTA */}
      <div className="bg-ink px-6 py-5 border-b-2 border-ink">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">New tool</div>
            <h2 className="font-serif text-lg font-bold text-white leading-tight mb-1">
              ROI Calculator — Is a Paid Tool Worth It?
            </h2>
            <p className="text-xs text-ink-4">
              Enter your hourly rate + time saved and we'll tell you if it pays for itself.
            </p>
          </div>
          <Link
            href="/free-tools/roi-calculator"
            className="bg-beat-red text-white font-mono text-xs px-5 py-2.5 hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
          >
            Calculate ROI →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
        <div className="border-r border-border">

          {/* TRULY FREE */}
          {trulyFree.length > 0 && (
            <div className="border-b border-border">
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <div className="section-label">Completely free</div>
                <span className="font-mono text-[10px] bg-beat-green-light text-beat-green px-2 py-0.5">
                  No credit card
                </span>
              </div>
              <div className="grid grid-cols-2">
                {trulyFree.map((tool, i) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <div className={`p-5 border-b border-border card-hover ${i % 2 === 0 ? 'border-r' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: tool.logo }}
                        >
                          {tool.logoInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink mb-0.5">{tool.name}</div>
                          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-wide mb-1">{tool.category}</div>
                          <p className="text-[11px] text-ink-3 leading-relaxed line-clamp-2">{tool.tagline}</p>
                          <div className="font-mono text-[10px] text-beat-green mt-1.5">★ {tool.rating} · Free forever</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FREEMIUM */}
          {freemium.length > 0 && (
            <div>
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <div className="section-label">Free tier available</div>
                <span className="font-mono text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5">
                  Paid upgrade optional
                </span>
              </div>
              <div className="grid grid-cols-2">
                {freemium.map((tool, i) => (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <div className={`p-5 border-b border-border card-hover ${i % 2 === 0 ? 'border-r' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: tool.logo }}
                        >
                          {tool.logoInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink mb-0.5">{tool.name}</div>
                          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-wide mb-1">{tool.category}</div>
                          <p className="text-[11px] text-ink-3 leading-relaxed line-clamp-2">{tool.tagline}</p>
                          <div className="font-mono text-[10px] text-yellow-700 mt-1.5">★ {tool.rating} · {tool.pricing}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          {/* Newsletter */}
          <div className="bg-ink p-5 text-white">
            <h3 className="font-serif text-xl font-bold mb-1.5 leading-tight">
              The AI Beat.<br />Daily.
            </h3>
            <p className="text-xs text-ink-4 mb-4 leading-relaxed">
              Get free tool picks every morning. Join 8,400+ founders.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-transparent border border-ink-3 text-white text-xs px-3 py-2 mb-2 outline-none placeholder:text-ink-4"
            />
            <button className="w-full bg-beat-red text-white text-xs py-2 font-semibold hover:bg-red-700 transition-colors">
              Get the daily brief →
            </button>
            <p className="font-mono text-[10px] text-ink-4 mt-2">Free. No spam. Unsubscribe anytime.</p>
          </div>

          {/* Trending */}
          <div className="p-4 border-b border-border">
            <div className="section-label">Trending searches</div>
            {TRENDING.map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 card-hover text-xs">
                  <span className="font-mono text-[10px] text-ink-4 min-w-[16px]">{i + 1}</span>
                  <span className="flex-1 text-ink-2 leading-snug">{item.query}</span>
                  <span className={`font-mono text-[10px] font-medium ${item.change === 'BREAKOUT' ? 'text-beat-red' : 'text-beat-green'}`}>
                    {item.change}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Related article */}
          <div className="p-4">
            <div className="section-label">Related reading</div>
            <Link href="/news/zero-dollar-ai-stack-2026">
              <div className="py-3 card-hover">
                <div className="text-xs font-semibold text-ink hover:text-beat-red transition-colors leading-snug">
                  The $0 AI Stack: Run Your Entire Business With Free Tools in 2026
                </div>
                <div className="font-mono text-[10px] text-ink-4 mt-1">15 min read</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
