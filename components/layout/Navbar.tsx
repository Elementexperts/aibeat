import Link from 'next/link'
import { ChevronDown, Rocket } from 'lucide-react'
import { CommandSearch } from './CommandSearch'
import { ThemeViewToggle } from './ThemeViewToggle'

const NAV_LINKS = [
  { label: 'Discover', href: '/directory' },
  { label: 'News', href: '/news' },
  { label: 'Launches', href: '/launches' },
  { label: 'Categories', href: '/categories' },
  { label: 'Spotlight', href: '/spotlight' },
  { label: 'For Founders', href: '/for-founders' },
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                </Link>
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
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
              {link.label}
              {(link.label === 'Discover' || link.label === 'For Founders') && <ChevronDown className="h-3 w-3" />}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
