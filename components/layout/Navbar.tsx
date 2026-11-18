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
  { label: 'Marketing', href: '/marketing' },
  { label: 'AIBeat Business', href: '/business', badge: 'New' },
  { label: 'Newsletter', href: '/newsletter' },
]

export function Navbar() {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-40 border-b border-white/10 bg-[#07080B]/95 backdrop-blur-xl">
      <div className="site-shell">
        <div className="flex min-h-[68px] items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-5 min-[1536px]:gap-7">
            <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="AIBeat home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                AI
              </span>
              <span className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">AIBeat</span>
                <span className="hidden whitespace-nowrap text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:block">Discovery media</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 min-[1440px]:flex">
              {NAV_GROUPS.map((link) => (
                <div key={link.href} className="group relative">
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {link.label}
                    {link.items && <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />}
                    {link.badge && <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--aibeat-link-accent)]">{link.badge}</span>}
                  </Link>
                  {link.items && (
                    <div className="invisible absolute left-0 top-full z-50 min-w-56 pt-1 group-hover:visible group-focus-within:visible">
                      <div className="rounded-2xl border border-white/10 bg-[var(--aibeat-bg-elevated)] p-2 shadow-xl shadow-black/20">
                        {link.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CommandSearch />
            <ThemeViewToggle />
            <Link
              href="/submit"
              className="hidden h-10 items-center whitespace-nowrap rounded-full border border-cyan-500/35 px-3.5 text-sm font-semibold text-[var(--aibeat-link-accent)] transition-colors hover:bg-cyan-500/10 md:inline-flex"
            >
              Submit a Tool
            </Link>
            <Link
              href="/launch"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-cyan-300 px-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
            >
              <Rocket aria-hidden="true" className="h-4 w-4" />
              Launch
            </Link>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto border-t border-white/10 px-1 py-2 min-[1440px]:hidden">
          {NAV_GROUPS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.04] px-3 py-2 text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white">
              {link.label}
              {link.badge && <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--aibeat-link-accent)]">{link.badge}</span>}
            </Link>
          ))}
          <Link href="/submit" className="inline-flex shrink-0 rounded-full bg-white px-3 py-2 text-[13px] font-semibold text-black md:hidden">
            Submit
          </Link>
        </div>
      </div>
    </nav>
  )
}
