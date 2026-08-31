import Link from 'next/link'
import { ChevronDown, Rocket } from 'lucide-react'
import { CommandSearch } from './CommandSearch'
import { ThemeViewToggle } from './ThemeViewToggle'

type NavGroup = {
  label: string
  href: string
  badge?: string
  items?: Array<{ label: string; href: string }>
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Discover',
    href: '/directory',
    items: [
      { label: 'AI Tools', href: '/tools' },
      { label: 'Categories', href: '/categories' },
      { label: 'New', href: '/directory' },
      { label: 'Free Tools', href: '/free-tools' },
      { label: 'Compare', href: '/compare' },
      { label: 'AIBeat Score', href: '/ai-score' },
    ],
  },
  {
    label: 'Launches',
    href: '/launches',
    items: [
      { label: 'New Launches', href: '/launches' },
      { label: 'Trending', href: '/launches' },
      { label: 'Submit / Launch Product', href: '/launch' },
    ],
  },
  { label: 'News', href: '/news' },
  {
    label: 'For Founders',
    href: '/for-founders',
    items: [
      { label: 'Submit a Tool', href: '/submit' },
      { label: 'Launch on AIBeat', href: '/launch' },
      { label: 'Spotlight', href: '/spotlight' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Claim Listing', href: '/claim' },
    ],
  },
  { label: 'AIBeat Business', href: '/business', badge: 'New' },
  { label: 'Newsletter', href: '/newsletter' },
]

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#07080B]/88 backdrop-blur-xl">
      <div className="site-shell">
        <div className="flex min-h-[76px] items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3" aria-label="AIBeat home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                AI
              </span>
              <span className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">AIBeat</span>
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Discovery media</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 xl:flex">
              {NAV_GROUPS.map((link) => (
                <div key={link.href} className="group relative">
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                    {link.items && <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-cyan-200" />}
                    {link.badge && <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">{link.badge}</span>}
                  </Link>
                  {link.items && (
                    <div className="invisible absolute left-0 top-full z-50 min-w-56 translate-y-2 rounded-2xl border border-white/10 bg-[#0d0f14]/95 p-2 opacity-0 shadow-2xl shadow-black/30 backdrop-blur-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {link.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CommandSearch />
            <ThemeViewToggle />
            <Link
              href="/submit"
              className="hidden rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 md:inline-flex"
            >
              Submit a Tool
            </Link>
            <Link
              href="/launch"
              className="gradient-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Rocket className="h-4 w-4" />
              Launch
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-white/10 py-2 xl:hidden">
          {NAV_GROUPS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
              {link.label}
              {link.badge && <span className="rounded-full bg-cyan-300/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100">{link.badge}</span>}
            </Link>
          ))}
          <Link href="/submit" className="inline-flex shrink-0 rounded-full bg-white px-3 py-2 text-xs font-semibold text-black">
            Submit
          </Link>
        </div>
      </div>
    </nav>
  )
}
