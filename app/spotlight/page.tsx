import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Eye, Layers, Sparkles, Target } from 'lucide-react'
import { ComparisonTable, DisclosureSection, FounderHero, InquiryCTA, NotIncludedList, ServiceGrid } from '@/components/founders/ServiceBlocks'
import { getPlanById } from '@/lib/founder-services'
import { FOUNDER_ANALYTICS_EVENTS } from '@/lib/analytics'

export const metadata: Metadata = {
  title: 'AIBeat Spotlight',
  description: 'Simple Placement, Featured Placement, Spotlight Pro, newsletter consideration, and clearly labeled promotional opportunities for relevant AI products.',
  alternates: { canonical: '/spotlight' },
}

const spotlight = getPlanById('spotlight_pro')
const FAQS = [
  ['Can I submit for free?', 'Yes. Free Listing remains available for directory review and possible inclusion.'],
  ['How much does paid visibility cost?', 'Simple Placement is $1.99, Featured Placement is $9.95, and Spotlight Pro is $29.00. Each is a one-time package.'],
  ['How long does placement last?', 'Featured Placement lists a seven-day relevant category placement. Spotlight Pro lists 14 days of homepage or relevant category Spotlight placement when approved.'],
  ['Where will my product appear?', 'Free and Simple are standard directory listing paths. Featured adds relevant category-page placement. Spotlight Pro may include homepage or relevant category Spotlight placement.'],
  ['Is paid placement labeled?', 'Yes. Featured, Spotlight, Sponsored, and affiliate formats are labeled where placement could affect reader interpretation.'],
  ['Will paid placement affect AIBeat Score?', 'No. The paid listing packages do not silently change product ratings or buy review scores.'],
  ['What happens after purchase?', 'Stripe Checkout starts the selected package, then AIBeat reviews the submission for relevance, safety, accuracy, disclosure, and publication fit.'],
]

const BENEFITS = [
  {
    icon: Eye,
    title: 'More visible discovery surfaces',
    body: 'Spotlight can help a relevant product stand out on homepage, category, launch, or directory surfaces when available.',
  },
  {
    icon: Layers,
    title: 'Better product context',
    body: 'Move beyond a plain listing with use cases, audience fit, screenshots, founder notes, and a clearer CTA.',
  },
  {
    icon: Target,
    title: 'Founder-friendly positioning',
    body: 'Frame the product around the problem it solves and the people most likely to care.',
  },
  {
    icon: Sparkles,
    title: 'Transparent promotion',
    body: 'Sponsored or featured status is clearly labeled so readers understand the format.',
  },
]

export default function SpotlightPage() {
  return (
    <div className="dark-page overflow-hidden">
      <FounderHero
        eyebrow="AIBeat Spotlight"
        title="Put your AI product in the spotlight"
        description="Choose Simple Placement, Featured Placement, or Spotlight Pro for a clearly labeled paid listing path, or ask about custom campaigns separately."
        primaryHref="#paid-listing-packages"
        primaryLabel="Order a Package"
        secondaryHref="/submit"
        secondaryLabel="Start With Free Submission"
        viewEvent={FOUNDER_ANALYTICS_EVENTS.pricingPlanView}
      />

      <section className="site-shell py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="premium-card p-5">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="paid-listing-packages" className="scroll-mt-24 border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Founder visibility packages</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Free Listing, Simple, Featured, or Spotlight Pro</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Start free or choose one of three self-service paid listing packages. Order buttons start Stripe Checkout for the selected one-time package. AIBeat still reviews every submission before publication.
            </p>
          </div>
          <ServiceGrid ids={['free', 'simple', 'featured', 'spotlight_pro']} />
        </div>
      </section>

      <section className="site-shell grid gap-6 py-16 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Compare options</p>
            <h2 className="mt-3 text-4xl font-black text-white">Choose the right level of listing visibility</h2>
          </div>
          <div className="overflow-x-auto">
            <ComparisonTable ids={['free', 'simple', 'featured', 'spotlight_pro']} />
          </div>
        </div>
        {spotlight && <NotIncludedList item={spotlight} />}
      </section>

      <DisclosureSection />

      <section className="site-shell py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">FAQ</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Founder questions, answered clearly</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map(([question, answer]) => (
            <article key={question} className="premium-card p-5">
              <h2 className="text-lg font-semibold text-white">{question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="premium-card p-6 md:p-8">
          <h2 className="text-2xl font-black text-white">Custom campaigns are separate</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Sponsored articles, newsletter sponsorships, launches, and multi-week campaigns are scoped separately from the three self-service listing packages. Spotlight can improve presentation and placement availability, but it does not buy a ranking, review score, recommendation, or guaranteed outcome.
          </p>
          <Link href="/affiliate-disclosure" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white">
            Read disclosure policy
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <InquiryCTA title="Check Spotlight availability" goal="Spotlight" />
    </div>
  )
}
