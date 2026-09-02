import type { Tool } from '@/lib/data'

export function ToolAffiliateOffer({ tool }: { tool: Tool }) {
  if (!tool.affiliateOffer) return null

  return (
    <div className="rounded-lg border border-border bg-paper-2 p-4">
      <p className="text-sm font-semibold text-ink">{tool.affiliateOffer.discount} {tool.name}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-2">
        Use promo code <strong className="font-mono select-all break-all">{tool.affiliateOffer.code}</strong> at checkout.
      </p>
      <a
        href={tool.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-3 inline-flex justify-center rounded bg-beat-red px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        Get {tool.affiliateOffer.discount} {tool.name} →
      </a>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        Affiliate link: AIBeat may earn a commission at no extra cost to you.
      </p>
    </div>
  )
}
