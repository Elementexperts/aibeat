import Link from 'next/link'

const NAV_LINKS = [
  { label: 'News', href: '/news' },
  { label: 'Tool Reviews', href: '/tools' },
  { label: 'Compare', href: '/compare' },
  { label: 'Directory', href: '/directory' },
  { label: 'Free Tools', href: '/free-tools' },
  { label: 'Deep Dives', href: '/deep-dives' },
  { label: 'Submit a Tool', href: '/submit' },
]

export function Navbar() {
  return (
    <nav className="border-b-2 border-ink bg-paper">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-start justify-between pt-4 pb-0">
          <div className="flex flex-col">
            <Link href="/" className="font-serif text-[32px] font-black text-ink leading-none tracking-tight">
              AI<span className="text-beat-red">Beat</span>.dev
            </Link>
            <span className="font-mono text-[10px] text-ink-3 tracking-widest uppercase mt-1">
              The pulse of artificial intelligence
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 pt-1">
            <Link
              href="/newsletter"
              className="bg-beat-red text-white px-4 py-2 text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Get the daily brief →
            </Link>
          </div>
        </div>
        <div className="flex mt-3 border-t border-border overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-xs font-medium text-ink-2 hover:text-beat-red border-r border-border whitespace-nowrap transition-colors first:pl-0"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
