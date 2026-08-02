import Link from 'next/link'

const STRIP_ITEMS = [
  { label: 'New AI tools', href: '/directory' },
  { label: 'Startup launches', href: '/launches' },
  { label: 'AI news', href: '/news' },
  { label: 'Free tools', href: '/free-tools' },
  { label: 'Founder services', href: '/launch' },
  { label: 'Spotlight options', href: '/spotlight' },
  { label: 'Submit your product', href: '/submit' },
]

export function BreakingTicker() {
  const repeated = [...STRIP_ITEMS, ...STRIP_ITEMS]

  return (
    <div className="overflow-hidden border-b border-white/10 bg-white/[0.025] py-2 text-xs text-slate-300">
      <div className="discovery-marquee flex w-max gap-3 px-4">
        {repeated.map((item, index) => (
          <Link
            key={`${item.href}-${index}`}
            href={item.href}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 transition hover:border-cyan-300/40 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
