import Link from 'next/link'
import { COMPARISONS, TRENDING } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Tool Comparisons — AIBeat.dev',
  description: "Head-to-head AI tool comparisons. We test both so you don't have to.",
}

export default function ComparePage() {
  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* PAGE HEADER */}
      <div className="px-6 py-5 border-b-2 border-ink flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
            <Link href="/" className="hover:text-beat-red">Home</Link>
            <span className="mx-1">/</span>
            <span>Compare</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink">Head-to-Head Comparisons</h1>
        </div>
        <p className="text-xs text-ink-3 max-w-xs text-right hidden md:block">
          We test both so you don't have to.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">

        {/* LEFT — COMPARISONS LIST */}
        <div className="border-r border-border">
          <div className="px-6 pt-5 pb-3">
            <div className="section-label">All {COMPARISONS.length} comparisons</div>
          </div>

          {COMPARISONS.map((comp, i) => (
            <Link key={comp.slug} href={`/compare/${comp.slug}`}>
              <div className="flex gap-3 px-5 py-4 border-t border-border card-hover">
                <span className="font-mono text-lg font-medium text-border-dark min-w-[28px] leading-tight">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  {/* Tool logos inline */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: comp.toolA.logo }}
                    >
                      {comp.toolA.logoInitials}
                    </div>
                    <span className="font-mono text-[10px] text-ink-4">vs</span>
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: comp.toolB.logo }}
                    >
                      {comp.toolB.logoInitials}
                    </div>
                    <span className="font-mono text-[10px] text-ink-3 ml-0.5">
                      {comp.toolA.name} vs {comp.toolB.name}
                    </span>
                  </div>
                  <h2 className="headline-md hover:text-beat-red transition-colors mb-1.5">
                    {comp.title}
                  </h2>
                  <p className="text-xs text-ink-3 leading-relaxed mb-2 line-clamp-1">{comp.deck}</p>
                  <div className="font-mono text-[10px] text-ink-4">{comp.publishedAt}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          {/* Newsletter */}
          <div className="bg-ink p-5 text-white">
            <h3 className="font-serif text-xl font-bold mb-1.5 leading-tight">
              The AI Beat.<br />Daily.
            </h3>
            <p className="text-xs text-ink-4 mb-4 leading-relaxed">
              Join 8,400+ founders and freelancers getting AI news + top tool picks every morning. Free.
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

          {/* Request a comparison */}
          <div className="p-5">
            <div className="section-label">Request a comparison</div>
            <p className="text-xs text-ink-3 mb-4 leading-relaxed">
              Can't find the matchup you need? Tell us what to compare next.
            </p>
            <Link
              href="/submit"
              className="font-mono text-[11px] text-white bg-ink px-4 py-2.5 hover:bg-beat-red transition-colors block text-center"
            >
              Request a comparison →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
