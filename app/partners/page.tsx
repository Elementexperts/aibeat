import type { Metadata } from 'next'
import { Handshake, Link2, Newspaper, Rocket, Users, Workflow } from 'lucide-react'
import { DisclosureSection, FounderHero, InquiryCTA, ProcessSection, ServiceGrid } from '@/components/founders/ServiceBlocks'

export const metadata: Metadata = {
  title: 'Partner With AIBeat',
  description: 'Explore AIBeat partnership for founders, newsletters, content, launch communities, affiliates, and software marketplaces.',
  alternates: { canonical: '/partners' },
}

const PARTNER_TYPES = [
  {
    icon: Link2,
    title: 'Affiliate partnership',
    body: 'Relevant software partnership with clear affiliate disclosure where links or commissions are used.',
  },
  {
    icon: Newspaper,
    title: 'Newsletter sponsorship',
    body: 'Clearly labeled newsletter placements for products or offers that fit AIBeat readers.',
  },
  {
    icon: Rocket,
    title: 'Launch partnership',
    body: 'Coordinated launch visibility for AI tools, founder communities, and product-release campaigns.',
  },
  {
    icon: Workflow,
    title: 'Content partnership',
    body: 'Useful partner articles, workflows, guides, or founder stories that are labeled appropriately.',
  },
  {
    icon: Users,
    title: 'Founder communities',
    body: 'Cross-promotion with communities serving founders, builders, marketers, developers, or creators.',
  },
  {
    icon: Handshake,
    title: 'Marketplace partnership',
    body: 'Collaboration with software directories, ecosystems, and curated product marketplaces.',
  },
]

export default function PartnersPage() {
  return (
    <div className="dark-page overflow-hidden">
      <FounderHero
        eyebrow="Partners"
        title="Build AI discovery momentum with AIBeat"
        description="AIBeat works with relevant founders, communities, newsletters, and software companies on clearly labeled discovery, launch, content, affiliate, and marketplace partnership."
        primaryHref="/advertise"
        primaryLabel="Start a Partnership Inquiry"
        secondaryHref="/affiliate-disclosure"
        secondaryLabel="Read Disclosure Policy"
      />

      <section className="site-shell py-10">
        <div className="premium-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Founder ecosystem</p>
            <h2 className="mt-3 text-2xl font-black text-white">Featured on DanielLaunches</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
              AIBeat participates in founder and launch communities where builders discover useful tools, products, and launch resources.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <a
              href="https://daniellaunches.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-2xl border border-white/10 bg-white p-3 transition hover:border-cyan-300/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]"
              aria-label="Featured on DanielLaunches"
            >
              {/* External SVG badge is provided by DanielLaunches for verification. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://daniellaunches.com/badge-light.svg" alt="Featured on DanielLaunches" width="220" height="48" />
            </a>
            <div className="flex flex-wrap gap-3 sm:justify-end">
              <a
                href="https://launchstag.com"
                target="_blank"
                rel="noopener"
                className="inline-flex rounded-2xl border border-white/10 bg-white p-3 transition hover:border-cyan-300/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]"
                aria-label="Featured on Launchstag"
              >
                {/* External SVG badge is provided by Launchstag for verification. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://launchstag.com/badge-light.svg" alt="Featured on Launchstag" width="198" height="62" />
              </a>
              <a
                href="https://findly.tools/aibeat?utm_source=aibeat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl border border-white/10 bg-white p-3 transition hover:border-cyan-300/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]"
                aria-label="Featured on Findly.tools"
              >
                {/* External SVG badge is provided by Findly.tools for verification. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://findly.tools/badges/findly-tools-badge-light.svg" alt="Featured on Findly.tools" width="175" height="55" />
              </a>
              <a
                href="https://sellwithboost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl border border-white/10 bg-white p-3 transition hover:border-cyan-300/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]"
                aria-label="Listed on Sell With boost"
              >
                {/* External SVG badge is provided by Sell With Boost for verification. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sellwithboost.com/badge/listing.svg" alt="Listed on Sell With boost" style={{ height: '40px', width: 'auto' }} />
              </a>
              <a
                href="https://sellwithboost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl border border-white/10 bg-[#0d0f14] p-3 transition hover:border-cyan-300/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.16)]"
                aria-label="Listed on Sell With boost"
              >
                {/* External SVG badge is provided by Sell With Boost for verification. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://sellwithboost.com/badge/listing-dark.svg" alt="Listed on Sell With boost" style={{ height: '40px', width: 'auto' }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PARTNER_TYPES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="premium-card p-6">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Partnership options</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Collaborate without vague reach claims</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              AIBeat reviews partnership ideas for reader relevance, disclosure requirements, and long-term trust before moving forward.
            </p>
          </div>
          <ServiceGrid ids={['partnership', 'newsletter-feature', 'sponsored-article', 'launch-feature', 'growth-campaign']} />
        </div>
      </section>

      <ProcessSection />
      <DisclosureSection />
      <InquiryCTA title="Propose a partnership with AIBeat" goal="Partnership" />
    </div>
  )
}
