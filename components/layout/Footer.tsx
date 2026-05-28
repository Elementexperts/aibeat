import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Newsletter', href: '/newsletter' },
  { label: 'Submit a Tool', href: '/submit' },
  { label: 'Advertise', href: '/advertise' },
  { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
  { label: 'Privacy Policy', href: '/privacy' },
]

export function Footer() {
  return (
    <footer className="bg-ink text-white mt-0">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div>
            <div className="font-serif text-2xl font-black">
              AI<span className="text-beat-red">Beat</span>.dev
            </div>
            <div className="font-mono text-[10px] text-ink-4 mt-1 tracking-widest uppercase">
              The pulse of artificial intelligence
            </div>
            <p className="text-ink-3 text-xs mt-3 max-w-xs leading-relaxed">
              Independent AI news and tool reviews for founders, freelancers, and builders. No sponsored rankings. Ever.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">Navigate</div>
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-ink-3 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="max-w-xs">
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-3">Daily brief</div>
            <p className="text-xs text-ink-3 mb-3 leading-relaxed">
              Join 8,400+ founders getting AI news + top tool picks every morning.
            </p>
            <div className="flex gap-0">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-ink-3 text-white text-xs px-3 py-2 outline-none placeholder:text-ink-4 focus:border-white transition-colors"
              />
              <button className="bg-beat-red text-white text-xs px-3 py-2 font-semibold hover:bg-red-700 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="font-mono text-[10px] text-ink-4 mt-2">Free. No spam. Unsubscribe anytime.</p>
          </div>
        </div>
        <div className="border-t border-ink-2 mt-6 pt-4 flex justify-between items-center text-[11px] text-ink-4 font-mono flex-wrap gap-2">
          <span>© 2026 AIBeat.dev — Independent AI news & tool reviews</span>
          <span>Built for founders, freelancers & builders worldwide</span>
        </div>
      </div>
    </footer>
  )
}
