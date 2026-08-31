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
      { label: 'AIBeat Business', href: '/business/dashboard' },
      { label: 'AI Spend Calculator', href: '/business/ai-spend-calculator' },
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
    href: 'https://launchnest.io/p/aibeat',
    label: 'AIBEAT on LaunchNest',
    src: 'https://launchnest.io/badge/aibeat.svg?variant=listed',
    width: 220,
    height: 56,
    tone: 'light',
  },
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
    href: 'https://startupbase.io/products/aibeat?utm_source=startupbase&utm_medium=badge&utm_campaign=launch-badge-neutral',
    label: 'Launched on StartupBase',
    src: 'https://statics.startupbase.io/site/badges/launched-on-sb-neutral.svg',
    width: 180,
    height: 55,
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

        <div className="mt-10 overflow-hidden border-y border-white/10 bg-white/[0.018] py-3">
          <div className="mb-2 flex items-center gap-3 px-1">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Featured in</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div
            className="group relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            }}
          >
            <div className="flex w-max animate-[aibeat-partners_42s_linear_infinite] items-center gap-2.5 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[...FEATURED_BADGES, ...FEATURED_BADGES].map((badge, index) => (
                <a
                  key={`${badge.href}-${index}`}
                  href={badge.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 px-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/40 ${
                    badge.tone === 'dark' ? 'bg-[#0d0f14]' : 'bg-white'
                  }`}
                  aria-label={badge.label}
                  aria-hidden={index >= FEATURED_BADGES.length ? true : undefined}
                  tabIndex={index >= FEATURED_BADGES.length ? -1 : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badge.src}
                    alt={index < FEATURED_BADGES.length ? badge.label : ''}
                    width={badge.width}
                    height={badge.height}
                    loading="lazy"
                    className="h-6 w-auto max-w-[132px] object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes aibeat-partners {
              from { transform: translateX(0); }
              to { transform: translateX(calc(-50% - 0.3125rem)); }
            }
          `}</style>
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
