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

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>(c) 2026 AIBeat.dev. Independent AI discovery and media.</span>
          <span>Sponsored placements and affiliate links are labeled where used.</span>
          <a href="mailto:info@aibeat.dev" className="transition hover:text-white">info@aibeat.dev</a>
        </div>
      </div>
    </footer>
  )
}
