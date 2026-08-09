import Link from 'next/link'
import { SubscribeForm } from '@/components/subscribe/SubscribeForm'

const FOOTER_GROUPS = [
  {
    title: 'Discover',
    links: [
      { label: 'AI Tools', href: '/tools' },
      { label: 'Directory', href: '/directory' },
      { label: 'Categories', href: '/categories' },
      { label: 'Launches', href: '/launches' },
      { label: 'Free Tools', href: '/free-tools' },
    ],
  },
  {
    title: 'Read',
    links: [
      { label: 'AI News', href: '/news' },
      { label: 'Newsletter', href: '/newsletter' },
      { label: 'Compare Tools', href: '/compare' },
      { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
    ],
  },
  {
    title: 'For Founders',
    links: [
      { label: 'Founder Services', href: '/for-founders' },
      { label: 'Submit a Tool', href: '/submit' },
      { label: 'Launch on AIBeat', href: '/launch' },
      { label: 'Spotlight', href: '/spotlight' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Claim a Listing', href: '/claim' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Partners', href: '/partners' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
]

const FEATURED_BADGES = [
  {
    href: 'https://daniellaunches.com',
    label: 'Featured on DanielLaunches',
    src: 'https://daniellaunches.com/badge-light.svg',
    width: 170,
    height: 37,
    tone: 'light',
  },
  {
    href: 'https://launchstag.com',
    label: 'Featured on Launchstag',
    src: 'https://launchstag.com/badge-light.svg',
    width: 150,
    height: 47,
    tone: 'light',
  },
  {
    href: 'https://findly.tools/aibeat?utm_source=aibeat',
    label: 'Featured on Findly.tools',
    src: 'https://findly.tools/badges/findly-tools-badge-light.svg',
    width: 150,
    height: 47,
    tone: 'light',
  },
  {
    href: 'https://dailypings.com/p/aibeat',
    label: 'Featured on DailyPings',
    src: 'https://dailypings.com/badge.svg',
    width: 179,
    height: 32,
    tone: 'light',
  },
  {
    href: 'https://sellwithboost.com',
    label: 'Listed on Sell With boost',
    src: 'https://sellwithboost.com/badge/listing-dark.svg',
    width: 150,
    height: 40,
    tone: 'dark',
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07080B]">
      <div className="site-shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black text-black">AI</span>
              <span>
                <span className="block text-2xl font-black text-white">AIBeat</span>
                <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">Discover Tomorrow&apos;s AI Today</span>
              </span>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              A modern platform for discovering AI tools, following important AI developments, exploring startup launches, and helping AI founders reach the right audience.
            </p>

            <div className="mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="text-sm font-semibold text-white">AIBeat Daily</div>
              <p className="mt-1 text-xs text-slate-500">Selected AI tools, launches, and industry news. No noise. Unsubscribe anytime.</p>
              <SubscribeForm dark buttonLabel="Join Free" className="mt-4 [&_button]:rounded-full [&_input]:rounded-l-full [&_input]:border-white/10 [&_button]:px-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group.title}</div>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className="block text-sm text-slate-400 transition hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Featured in</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AIBeat appears in selected founder and product-discovery ecosystems. Badges are shown for verification and disclosure.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {FEATURED_BADGES.map((badge) => (
                <a
                  key={badge.href}
                  href={badge.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-14 items-center rounded-2xl border border-white/10 p-2.5 transition hover:border-cyan-300/40 hover:shadow-[0_0_24px_rgba(34,211,238,0.14)] ${badge.tone === 'dark' ? 'bg-[#0d0f14]' : 'bg-white'}`}
                  aria-label={badge.label}
                >
                  {/* External SVG badges are provided by the listing platforms for verification. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badge.src} alt={badge.label} width={badge.width} height={badge.height} loading="lazy" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>(c) 2026 AIBeat.dev. Independent AI discovery and media.</span>
          <span>Sponsored placements and affiliate links are labeled where used.</span>
          <a href="mailto:info@aibeat.dev" className="transition hover:text-white">info@aibeat.dev</a>
        </div>
      </div>
    </footer>
  )
}
