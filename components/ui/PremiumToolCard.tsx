import Link from 'next/link'
import { ArrowUpRight, Bookmark, Check, Sparkles } from 'lucide-react'
import type { Tool } from '@/lib/data'
import { PUBLIC_ANALYTICS_EVENTS } from '@/lib/analytics'
import { ToolLogo } from './ToolLogo'

type PremiumToolCardProps = {
  tool: Tool
  variant?: 'standard' | 'featured' | 'compact'
}

function pricingLabel(tool: Tool) {
  if (tool.pricingType === 'free') return 'Free'
  if (tool.pricingType === 'freemium') return 'Freemium'
  return tool.pricing
}

export function PremiumToolCard({ tool, variant = 'standard' }: PremiumToolCardProps) {
  const featured = variant === 'featured'

  return (
    <article className={`premium-card group relative overflow-hidden p-5 ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <ToolLogo tool={tool} className={`${featured ? 'h-14 w-14 text-lg' : 'h-11 w-11 text-sm'} rounded-xl`} imageClassName="p-2" />
        <button type="button" className="rounded-full border border-white/10 p-2 text-slate-500 transition hover:border-cyan-300/40 hover:text-cyan-200" aria-label={`Save ${tool.name}`}>
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">{tool.category}</span>
          {tool.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        <Link href={`/tools/${tool.slug}`} className="mt-4 block">
          <h3 className={`${featured ? 'text-3xl' : 'text-lg'} font-semibold leading-tight text-white transition group-hover:text-cyan-100`}>
            {tool.name}
          </h3>
          <p className={`mt-3 leading-6 text-slate-400 ${featured ? 'text-base' : 'text-sm line-clamp-2'}`}>{tool.tagline}</p>
        </Link>

        {featured && (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-7 text-slate-300">{tool.description}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {tool.pros.slice(0, 3).map((pro) => (
                <div key={pro} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <Check className="mb-2 h-4 w-4 text-emerald-300" />
                  <p className="text-xs leading-5 text-slate-300">{pro}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">AIBeat Score {tool.rating}</span>
              <Link href="/ai-score" data-analytics-event={PUBLIC_ANALYTICS_EVENTS.aiScoreLearnMore} className="text-xs font-semibold text-cyan-200 hover:text-white">
                How it works
              </Link>
              <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">{pricingLabel(tool)}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">{tool.category}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">{pricingLabel(tool)}</span>
        <Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-cyan-200 transition hover:text-white">
          View
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
