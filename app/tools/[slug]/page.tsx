import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getToolBySlug, TOOLS, CATEGORY_COLORS } from '@/lib/data'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tool = getToolBySlug(params.slug)
  if (!tool) return {}
  return {
    title: `${tool.name} Review (2026) — Is It Worth It?`,
    description: `Honest ${tool.name} review. Pricing, pros, cons, and best alternatives. Updated for 2026.`,
  }
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug)
  if (!tool) notFound()

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(tool.rating) ? '★' : '☆').join('')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/directory" className="hover:text-ink">Directory</Link>
        <span>/</span>
        <span className="text-ink">{tool.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">

        {/* MAIN CONTENT */}
        <div>
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: tool.logo }}
            >
              {tool.logoInitials}
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink leading-tight">{tool.name}</h1>
              <p className="text-ink-3 text-sm mt-1">{tool.tagline}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-yellow-500 text-sm">{stars} {tool.rating}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 ${
                  tool.pricingType === 'free' ? 'bg-beat-green-light text-beat-green' :
                  tool.pricingType === 'freemium' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-paper-3 text-ink-2'
                }`}>{tool.pricing}</span>
              </div>
            </div>
          </div>

          {/* Quick Verdict */}
          <div className="bg-paper-2 border border-border p-4 mb-6">
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-2">Quick verdict</div>
            <p className="text-sm text-ink-2 leading-relaxed">{tool.description}</p>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-beat-green p-4">
              <div className="font-mono text-[10px] text-beat-green uppercase tracking-widest mb-3">Pros</div>
              <ul className="space-y-1.5">
                {tool.pros.map((pro) => (
                  <li key={pro} className="text-xs text-ink-2 flex gap-2">
                    <span className="text-beat-green shrink-0">✓</span>{pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-beat-red p-4">
              <div className="font-mono text-[10px] text-beat-red uppercase tracking-widest mb-3">Cons</div>
              <ul className="space-y-1.5">
                {tool.cons.map((con) => (
                  <li key={con} className="text-xs text-ink-2 flex gap-2">
                    <span className="text-beat-red shrink-0">✗</span>{con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-ink p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-white text-sm font-semibold mb-0.5">Try {tool.name}</div>
              <div className="text-ink-4 text-xs">{tool.pricing} · Affiliate link — we earn a commission</div>
            </div>
            <a
              href={tool.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bg-beat-red text-white px-5 py-2 text-sm font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Get {tool.name} →
            </a>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* Alternatives */}
          <div className="border border-border p-4">
            <div className="section-label">Alternatives to {tool.name}</div>
            {tool.alternatives.map((alt) => {
              const altTool = TOOLS.find(t => t.slug === alt)
              if (!altTool) return null
              return (
                <Link key={alt} href={`/tools/${alt}`}>
                  <div className="flex items-center gap-2.5 py-2 border-b border-border last:border-0 card-hover">
                    <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: altTool.logo }}>
                      {altTool.logoInitials}
                    </div>
                    <div>
                      <div className="text-xs font-medium">{altTool.name}</div>
                      <div className="text-[10px] text-ink-4">{altTool.pricing}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Compare link */}
          <div className="bg-beat-blue-light border border-beat-blue p-4">
            <div className="text-xs font-semibold text-beat-blue mb-1">Compare head to head</div>
            <p className="text-[11px] text-ink-3 mb-3">See how {tool.name} stacks up against alternatives.</p>
            <Link href="/compare" className="text-xs text-beat-blue font-semibold hover:underline">
              Browse comparisons →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
