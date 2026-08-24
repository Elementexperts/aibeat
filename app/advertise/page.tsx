import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeDollarSign, Megaphone, Newspaper, ShieldCheck, Target } from 'lucide-react'
import { ComparisonTable, DisclosureSection, FounderHero, InquiryCTA, ServiceGrid } from '@/components/founders/ServiceBlocks'
import { SubmissionPricingCards } from '@/components/founders/SubmissionPricingCards'

export const metadata: Metadata = {
  title: 'Advertise With AIBeat',
  description: 'Explore clearly labeled AIBeat advertising packages, newsletter sponsorships, Spotlight placements, sponsored articles, and custom founder campaigns.',
  alternates: { canonical: '/advertise' },
}

const BEST_FIT = [
  'AI product launches and major updates',
  'SaaS tools for founders, marketers, developers, and creators',
  'Developer tools, automation products, and workflow software',
  'Newsletter, community, and marketplace partnership',
  'Educational campaigns that help readers understand a useful AI workflow',
]

const NOT_A_FIT = [
  'Paid reviews or paid rankings',
  'Undisclosed sponsored posts',
  'Misleading, unsafe, or irrelevant products',
  'Bulk link insertions without reader value',
  'Guaranteed traffic, sales, or SEO outcome requests',
]

export default function AdvertisePage() {
  return (
    <div className="dark-page overflow-hidden">
      <FounderHero
        eyebrow="Advertise with AIBeat"
        title="Promote your AI product without compromising reader trust"
        description="AIBeat separates self-service paid listings from custom advertising, newsletter, sponsored article, launch, and partnership campaigns."
        primaryHref="#self-service-listings"
        primaryLabel="Order Paid Listing"
        secondaryHref="#custom-campaigns"
        secondaryLabel="Custom Campaigns"
      />

      <section className="site-shell py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Megaphone,
              title: 'Clearly labeled placements',
              body: 'Sponsored and partner formats are identified so readers understand the commercial relationship.',
            },
            {
              icon: Target,
              title: 'Relevant audience fit',
              body: 'Campaigns are reviewed for relevance to AI tool discovery, founders, builders, marketers, and technical professionals.',
            },
            {
              icon: ShieldCheck,
              title: 'No paid editorial opinion',
              body: 'Advertising does not buy a ranking, review score, recommendation, or hidden endorsement.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="premium-card p-6">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="self-service-listings" className="scroll-mt-24 border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Self-service listings</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Simple, Featured, and Spotlight Pro are the paid listing tiers</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Choose a one-time paid listing package and continue to Stripe Checkout. Larger advertising and editorial campaigns are scoped separately below.
            </p>
          </div>
          <SubmissionPricingCards />
        </div>
      </section>

      <section id="custom-campaigns" className="site-shell scroll-mt-24 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Custom campaigns</p>
          <h2 className="mt-3 text-4xl font-black text-white">Sponsored articles, newsletters, launches, and partnerships</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Custom campaigns are not a fourth submission tier. They are manually scoped, reviewed for fit, and labeled as Sponsored, Featured, Spotlight, or Partner content where appropriate.
          </p>
        </div>
        <ServiceGrid ids={['newsletter-sponsorship', 'sponsored-article', 'launch-campaign', 'partnership', 'growth-campaign']} />
      </section>

      <section className="site-shell grid gap-6 py-16 lg:grid-cols-2">
        <div className="premium-card p-6">
          <BadgeDollarSign className="h-6 w-6 text-green-300" />
          <h2 className="mt-5 text-2xl font-black text-white">Best fit</h2>
          <ul className="mt-5 space-y-3">
            {BEST_FIT.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="premium-card p-6">
          <Newspaper className="h-6 w-6 text-amber-200" />
          <h2 className="mt-5 text-2xl font-black text-white">Not a fit</h2>
          <ul className="mt-5 space-y-3">
            {NOT_A_FIT.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Package comparison</p>
          <h2 className="mt-3 text-4xl font-black text-white">Advertising, editorial, and partnership formats</h2>
        </div>
        <div className="overflow-x-auto">
          <ComparisonTable ids={['simple', 'featured', 'spotlight_pro', 'newsletter-sponsorship', 'sponsored-article', 'growth-campaign']} />
        </div>
      </section>

      <DisclosureSection />

      <section className="site-shell py-16">
        <div className="premium-card p-6 md:p-8">
          <h2 className="text-2xl font-black text-white">What to include in your inquiry</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Send your company, website, campaign goal, target audience, launch or campaign timing, preferred format, and budget range if you have one. AIBeat replies when the fit is relevant.
          </p>
          <Link href="/submit" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white">
            Need free editorial review instead?
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <InquiryCTA title="Start a sponsored or partner campaign conversation" goal="Advertising" />
    </div>
  )
}
