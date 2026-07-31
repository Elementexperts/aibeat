import Link from 'next/link'
import { SubscribeForm } from '@/components/subscribe/SubscribeForm'

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
              Independent AI news and tool reviews for founders, freelancers,
              and builders. No sponsored rankings. Ever.
            </p>

            <a
              href="mailto:info@aibeat.dev"
              className="font-mono text-[11px] text-ink-3 hover:text-white transition-colors mt-2 inline-block"
            >
              info@aibeat.dev
            </a>

            <div className="mt-5 flex flex-col gap-3 items-start">
              <a
                href="https://sellwithboost.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Listed on Sell With Boost"
                className="block w-fit transition-opacity hover:opacity-100 opacity-90"
              >
                <img
                  src="https://sellwithboost.com/badge/listing.svg"
                  alt="Listed on Sell With Boost"
                  loading="lazy"
                  className="h-10 w-auto"
                />
              </a>

              <a
                href="https://launchstag.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Featured on Launchstag"
                className="block w-fit transition-opacity hover:opacity-100 opacity-90"
              >
                <img
                  src="https://launchstag.com/badge-light.svg"
                  alt="Featured on Launchstag"
                  width="198"
                  height="62"
                  loading="lazy"
                  className="h-[62px] w-auto"
                />
              </a>

              <a
                href="https://www.producthunt.com/products/aibeat?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-aibeat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AIBEAT on Product Hunt"
                className="block w-fit transition-opacity hover:opacity-100 opacity-90"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1211561&theme=dark&t=1785500620557"
                  alt="AIBEAT - Discover the best AI tools. Stay ahead with daily AI news. | Product Hunt"
                  width="250"
                  height="54"
                  loading="lazy"
                  className="h-[54px] w-auto"
                />
              </a>

              <a
                href="https://www.uneed.best/tool/aibeat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Launching Soon on Uneed"
                className="block w-fit transition-opacity hover:opacity-100 opacity-90"
              >
                <img
                  src="https://www.uneed.best/EMBED3.png"
                  alt="Launching Soon on Uneed"
                  width="250"
                  height="auto"
                  loading="lazy"
                  className="w-[250px] h-auto"
                />
              </a>

              <a
                href="https://fazier.com/launches/www.aibeat.dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fazier launch badge"
                className="block w-fit transition-opacity hover:opacity-100 opacity-90"
              >
                <img
                  src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light"
                  alt="Fazier badge"
                  width="120"
                  loading="lazy"
                  className="w-[120px] h-auto"
                />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
              Navigate
            </div>

            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-ink-3 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="max-w-xs">
            <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-3">
              Daily brief
            </div>

            <p className="text-xs text-ink-3 mb-3 leading-relaxed">
              Join 8,400+ founders getting AI news + top tool picks every
              morning.
            </p>

            <SubscribeForm
              dark
              buttonLabel="Subscribe"
              className="[&_input]:text-xs [&_button]:px-3 [&_button]:py-2"
            />

            <p className="font-mono text-[10px] text-ink-4 mt-2">
              Free. No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="border-t border-ink-2 mt-6 pt-4 flex justify-between items-center text-[11px] text-ink-4 font-mono flex-wrap gap-2">
          <span>(c) 2026 AIBeat.dev - Independent AI news & tool reviews</span>
          <span>Built for founders, freelancers & builders worldwide</span>
        </div>
      </div>
    </footer>
  )
}
