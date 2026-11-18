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

const chip = 'shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5'

export function BreakingTicker() {
  return (
    <nav aria-label="Discovery shortcuts" className="border-b border-white/10 text-xs text-[var(--aibeat-text-secondary)]">
      <div className="site-shell flex items-center gap-3">
        <label className="ticker-motion-control shrink-0 cursor-pointer items-center gap-1.5 rounded">
          <input type="checkbox" className="accent-cyan-500" />
          Pause ticker
        </label>
        <div className="ticker-viewport -mx-1 min-w-0 flex-1 px-1 py-0.5">
          <div className="ticker-track">
            <div className="ticker-group">
              {STRIP_ITEMS.map(({ href, label }) => (
                <Link key={href} href={href} className={`${chip} transition-colors hover:border-cyan-500/50 hover:text-[var(--aibeat-text)]`}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="ticker-group ticker-copy" aria-hidden="true">
              {STRIP_ITEMS.map(({ href, label }) => <span key={href} className={chip}>{label}</span>)}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
