import { notFound } from 'next/navigation'
import Link from 'next/link'
import { COMPARISONS, getComparisonBySlug } from '@/lib/data'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const comp = getComparisonBySlug(params.slug)
  if (!comp) return {}
  return {
    title: comp.title,
    description: comp.deck,
  }
}

function ScoreBadge({ score }: { score: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(score) ? '★' : '☆').join('')
  return (
    <span className="text-yellow-500 text-sm">{stars} <span className="font-mono text-xs">{score}</span></span>
  )
}

export default function ComparisonPage({ params }: { params: { slug: string } }) {
  const comp = getComparisonBySlug(params.slug)
  if (!comp) notFound()

  const relatedComparisons = COMPARISONS.filter((c) => comp.related.includes(c.slug))

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/compare" className="hover:text-ink">Compare</Link>
        <span>/</span>
        <span className="text-ink truncate">{comp.toolA.name} vs {comp.toolB.name}</span>
      </div>

      {/* PAGE TITLE */}
      <div className="px-6 py-5 border-b border-border">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink leading-tight mb-2">
          {comp.title}
        </h1>
        <p className="text-sm text-ink-2">{comp.deck}</p>
        <div className="font-mono text-[10px] text-ink-4 mt-2">AIBeat Staff · {comp.publishedAt}</div>
      </div>

      {/* TOOL VS TOOL HEADER — full width */}
      <div className="grid grid-cols-[1fr_auto_1fr] border-b-2 border-ink">
        {/* Tool A */}
        <div className="p-5 md:p-6 flex flex-col items-center text-center border-r border-border">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-3"
            style={{ background: comp.toolA.logo }}
          >
            {comp.toolA.logoInitials}
          </div>
          <div className="font-serif text-xl font-bold text-ink mb-1">{comp.toolA.name}</div>
          <div className="text-xs text-ink-3 mb-2">{comp.toolA.tagline}</div>
          <ScoreBadge score={comp.toolA.score} />
          <div className={`font-mono text-[10px] px-2 py-0.5 mt-2 ${
            comp.toolA.pricingType === 'free'     ? 'bg-beat-green-light text-beat-green' :
            comp.toolA.pricingType === 'freemium' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-paper-3 text-ink-2'
          }`}>
            {comp.toolA.pricing}
          </div>
          <a
            href={comp.toolA.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-4 w-full bg-ink text-white text-xs py-2 font-semibold hover:bg-beat-red transition-colors text-center block"
          >
            Visit {comp.toolA.name} →
          </a>
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center px-4">
          <span className="font-serif text-2xl font-black text-ink-4">vs</span>
        </div>

        {/* Tool B */}
        <div className="p-5 md:p-6 flex flex-col items-center text-center border-l border-border">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white mb-3"
            style={{ background: comp.toolB.logo }}
          >
            {comp.toolB.logoInitials}
          </div>
          <div className="font-serif text-xl font-bold text-ink mb-1">{comp.toolB.name}</div>
          <div className="text-xs text-ink-3 mb-2">{comp.toolB.tagline}</div>
          <ScoreBadge score={comp.toolB.score} />
          <div className={`font-mono text-[10px] px-2 py-0.5 mt-2 ${
            comp.toolB.pricingType === 'free'     ? 'bg-beat-green-light text-beat-green' :
            comp.toolB.pricingType === 'freemium' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-paper-3 text-ink-2'
          }`}>
            {comp.toolB.pricing}
          </div>
          <a
            href={comp.toolB.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-4 w-full bg-ink text-white text-xs py-2 font-semibold hover:bg-beat-red transition-colors text-center block"
          >
            Visit {comp.toolB.name} →
          </a>
        </div>
      </div>

      {/* OVERALL VERDICT — full width */}
      <div className="px-6 py-5 bg-paper-2 border-b-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">Overall verdict</div>
        <p className="text-base text-ink leading-relaxed border-l-2 border-beat-red pl-4">
          {comp.verdict}
        </p>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">

        {/* MAIN CONTENT */}
        <div className="border-r border-border">

          {/* TOOL VERDICTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
            {[comp.toolA, comp.toolB].map((tool, idx) => (
              <div key={tool.slug} className={`p-5 ${idx === 0 ? 'md:border-r border-border' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: tool.logo }}>
                    {tool.logoInitials}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-4">{tool.name}</span>
                </div>
                <p className="text-xs text-ink-2 leading-relaxed mb-3">{tool.verdict}</p>
                <div className="space-y-1.5">
                  {tool.pros.map((p) => (
                    <div key={p} className="flex gap-2 text-xs text-ink-2">
                      <span className="text-beat-green shrink-0">✓</span>{p}
                    </div>
                  ))}
                  {tool.cons.map((c) => (
                    <div key={c} className="flex gap-2 text-xs text-ink-3">
                      <span className="text-beat-red shrink-0">✗</span>{c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FEATURE COMPARISON TABLE */}
          <div className="p-5 border-b border-border">
            <div className="section-label">Feature comparison</div>
            <div className="mt-3 border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr] bg-paper-2 border-b border-border">
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4">Feature</div>
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4 border-l border-border flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center text-[8px] font-bold text-white" style={{ background: comp.toolA.logo }}>{comp.toolA.logoInitials}</span>
                  {comp.toolA.name}
                </div>
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4 border-l border-border flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center text-[8px] font-bold text-white" style={{ background: comp.toolB.logo }}>{comp.toolB.logoInitials}</span>
                  {comp.toolB.name}
                </div>
              </div>
              {comp.features.map((feat, i) => (
                <div key={feat.name} className={`grid grid-cols-[1fr_1fr_1fr] ${i % 2 === 0 ? '' : 'bg-paper-2'} border-b border-border last:border-0`}>
                  <div className="p-2.5 text-xs font-semibold text-ink">{feat.name}</div>
                  <div className="p-2.5 text-xs text-ink-2 border-l border-border">{feat.a}</div>
                  <div className="p-2.5 text-xs text-ink-2 border-l border-border">{feat.b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING TABLE */}
          <div className="p-5 border-b border-border">
            <div className="section-label">Pricing comparison</div>
            <div className="mt-3 border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr] bg-paper-2 border-b border-border">
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4">Plan</div>
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4 border-l border-border">{comp.toolA.name}</div>
                <div className="p-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-4 border-l border-border">{comp.toolB.name}</div>
              </div>
              {comp.pricingTable.map((row, i) => (
                <div key={row.plan} className={`grid grid-cols-[1fr_1fr_1fr] ${i % 2 === 0 ? '' : 'bg-paper-2'} border-b border-border last:border-0`}>
                  <div className="p-2.5 text-xs font-semibold text-ink">{row.plan}</div>
                  <div className="p-2.5 text-xs text-ink-2 border-l border-border font-mono">{row.priceA}</div>
                  <div className="p-2.5 text-xs text-ink-2 border-l border-border font-mono">{row.priceB}</div>
                </div>
              ))}
            </div>
          </div>

          {/* WHO SHOULD CHOOSE */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
            {[comp.toolA, comp.toolB].map((tool, idx) => (
              <div key={tool.slug} className={`p-5 ${idx === 0 ? 'md:border-r border-border' : ''}`}>
                <div className="section-label">Choose {tool.name} if…</div>
                <p className="text-xs text-ink-2 leading-relaxed mt-3">{tool.bestFor}</p>
              </div>
            ))}
          </div>

          {/* AFFILIATE CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
            {[comp.toolA, comp.toolB].map((tool, idx) => (
              <div key={tool.slug} className={`bg-ink p-5 ${idx === 0 ? 'md:border-r border-ink-3' : ''}`}>
                <div className="text-white text-xs font-semibold mb-0.5">Try {tool.name}</div>
                <div className="text-ink-4 text-[11px] mb-3">{tool.pricing} · Affiliate link</div>
                <a
                  href={tool.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="w-full bg-beat-red text-white text-xs py-2 font-semibold hover:bg-red-700 transition-colors text-center block"
                >
                  Get {tool.name} →
                </a>
              </div>
            ))}
          </div>

          {/* FAQ — 5 questions for AI citation */}
          <div className="p-5 border-b border-border">
            <div className="section-label">Frequently asked questions</div>
            <div className="mt-3 space-y-3">
              {comp.faq.map((item) => (
                <div key={item.q} className="border border-border p-4">
                  <div className="font-semibold text-sm text-ink mb-1.5">{item.q}</div>
                  <div className="text-sm text-ink-3 leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AFFILIATE DISCLOSURE */}
          <div className="p-4 bg-paper-2 border-b border-border text-[11px] text-ink-4 font-mono">
            Disclosure: Some links on this page are affiliate links. AIBeat.dev earns a commission if you sign up — at no extra cost to you. We never let affiliate relationships influence our editorial judgments.
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">

          {/* Newsletter */}
          <div className="bg-ink p-4 text-white">
            <div className="font-serif text-lg font-bold mb-1">Get the daily brief</div>
            <p className="text-xs text-ink-4 mb-3">AI news + top tools every morning. Free.</p>
            <input type="email" placeholder="your@email.com" className="w-full bg-transparent border border-ink-3 text-white text-xs px-3 py-2 mb-2 outline-none placeholder:text-ink-4" />
            <button className="w-full bg-beat-red text-white text-xs py-2 font-semibold">Subscribe →</button>
          </div>

          {/* Related comparisons */}
          {relatedComparisons.length > 0 && (
            <div className="border border-border p-4">
              <div className="section-label">Related comparisons</div>
              {relatedComparisons.map((related) => (
                <Link key={related.slug} href={`/compare/${related.slug}`}>
                  <div className="py-3 border-b border-border last:border-0 card-hover">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ background: related.toolA.logo }}>
                        {related.toolA.logoInitials}
                      </div>
                      <span className="font-mono text-[10px] text-ink-4">vs</span>
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ background: related.toolB.logo }}>
                        {related.toolB.logoInitials}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-ink hover:text-beat-red transition-colors leading-snug">
                      {related.toolA.name} vs {related.toolB.name}
                    </div>
                    <div className="font-mono text-[10px] text-ink-4 mt-1">{related.publishedAt}</div>
                  </div>
                </Link>
              ))}
              <Link href="/compare" className="font-mono text-[11px] text-beat-red hover:underline mt-3 block">
                Browse all comparisons →
              </Link>
            </div>
          )}

          {/* All tools link */}
          <div className="border border-border p-4">
            <div className="section-label">In the directory</div>
            {[comp.toolA, comp.toolB].map((tool) => (
              <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 card-hover">
                  <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: tool.logo }}>
                    {tool.logoInitials}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{tool.name} review</div>
                    <div className="text-[10px] text-ink-4">{tool.pricing}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
