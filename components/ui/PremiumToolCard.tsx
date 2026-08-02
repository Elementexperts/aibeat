import Link from 'next/link'
import { ArrowUpRight, Bookmark, Sparkles } from 'lucide-react'
import type { Tool } from '@/lib/data'
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
