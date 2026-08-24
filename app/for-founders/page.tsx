import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Megaphone, Newspaper, Rocket, Search } from 'lucide-react'
import { ComparisonTable, DisclosureSection, FeatureMatrix, FounderHero, InquiryCTA, ProcessSection, ServiceGrid } from '@/components/founders/ServiceBlocks'

export const metadata: Metadata = {
  title: 'For AI Founders',
  description: 'Compare AIBeat founder services including free tool submission, Spotlight placement, launch promotion, newsletter sponsorships, partner articles, and custom campaigns.',
  alternates: { canonical: '/for-founders' },
  openGraph: {
    title: 'AIBeat Founder Services',
    description: 'Founder-friendly AI discovery, launch, Spotlight, newsletter, article, and partnership options from AIBeat.',
    url: '/for-founders',
    type: 'website',
  },
}

const PATHS = [
  {
    icon: Search,
    title: 'Get discovered',
    body: 'Submit a useful AI product for review and possible inclusion in searchable AIBeat discovery surfaces.',
  },
  {
    icon: Rocket,
    title: 'Launch with context',
    body: 'Turn a product release into a clearer story with use cases, audience fit, and founder context.',
  },
  {
    icon: Megaphone,
    title: 'Promote transparently',
    body: 'Use Spotlight, newsletter, sponsored, or partner formats with labels readers can trust.',
  },
  {
    icon: Newspaper,
    title: 'Build long-term presence',
    body: 'Create a permanent discovery footprint through listings, editorial context, and relevant internal links.',
  },
]

const FAQS = [
  ['Is submitting a tool free?', 'Yes. Free Listing review is free. AIBeat may request a public badge or text link before approval to verify website control.'],
  ['Does payment guarantee approval?', 'No. Paid requests still require AIBeat review for quality, relevance, accuracy, and safety.'],
  ['How long does review take?', 'Free submissions are reviewed as capacity allows. Featured Placement has an expected 2-4 business day review window, and Spotlight Pro has an expected 1-3 business day review window.'],
  ['What is the difference between Simple, Featured, and Spotlight Pro?', 'Simple is a standard paid listing, Featured adds priority review and seven days of relevant category-page placement, and Spotlight Pro adds deeper context plus a 14-day homepage or category Spotlight placement.'],
  ['Is newsletter coverage guaranteed?', 'No. Spotlight Pro includes newsletter and editorial consideration without guaranteeing inclusion. Custom newsletter campaigns are scoped separately.'],
  ['How are sponsored articles labeled?', 'Sponsored and partner articles are visibly labeled. Payment does not buy positive editorial opinion.'],
  ['Can AIBeat write the article?', 'AIBeat can format and develop a sponsored or partner article when the topic is useful and claims are verifiable.'],
  ['Can I update my listing later?', 'Yes. Free and paid listings can request updates, and AIBeat reviews changes for accuracy and fit.'],
  ['Do you guarantee traffic, leads, or sales?', 'No. AIBeat does not guarantee traffic, rankings, leads, sales, clicks, opens, or revenue.'],
  ['Can we create a custom campaign?', 'Yes. Growth Campaign and Partnership options are designed for custom coordination.'],
  ['Can we exchange features through a partnership?', 'Yes, when there is real audience and editorial value. Affiliate and exchange relationships are disclosed.'],
  ['What AI tools are not accepted?', 'Misleading, unsafe, low-quality, spammy, or irrelevant products may be rejected even if payment is offered.'],
]

export default function ForFoundersPage() {
  return (
    <div className="dark-page overflow-hidden">
      <FounderHero
        eyebrow="For AI founders"
        title="Launch, feature, and grow your AI product with AIBeat"
        description="AIBeat helps relevant AI companies become easier to discover through free submissions, Simple Placement, Featured Placement, Spotlight Pro, and clearly separated custom campaigns."
        primaryHref="/submit"
        primaryLabel="Submit a Tool"
        secondaryHref="/advertise"
        secondaryLabel="Compare Promotion Options"
      />

      <section className="site-shell py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {PATHS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="premium-card p-5">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Service menu</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black text-white md:text-5xl">Choose how you want your AI product to be discovered</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Start with a free directory submission or choose one of three paid listing tiers. Custom launch campaigns, newsletter sponsorships, and sponsored editorial opportunities stay separate from submission pricing.
              </p>
            </div>
            <Link href="/submit" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ServiceGrid />
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Quick comparison</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Editorial, featured, sponsored, or partner?</h2>
        </div>
        <div className="overflow-x-auto">
          <ComparisonTable />
        </div>
      </section>

      <section id="compare-plans" className="site-shell pb-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Featuring matrix</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Know what is included, considered, optional, or custom</h2>
        </div>
        <FeatureMatrix />
      </section>

      <DisclosureSection />
      <ProcessSection />

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell grid gap-6 lg:grid-cols-2">
          <div className="premium-card p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Newsletter promotion</p>
            <h2 className="mt-4 text-3xl font-black text-white">Newsletter formats without fake campaign results</h2>
            <div className="mt-6 grid gap-3">
              {['Featured Tool', 'Top Sponsor', 'Launch Mention', 'Partner Feature', 'Dedicated Email'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">{item}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Availability depends on editorial calendar, audience relevance, and campaign fit.</p>
                </div>
              ))}
            </div>
          </div>
          <div className="premium-card p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Partnership exchange</p>
            <h2 className="mt-4 text-3xl font-black text-white">Exchange visibility through an AIBeat media partnership</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Partners may provide editorial coverage, newsletter mentions, relevant links, affiliate or referral opportunities, audience collaboration, or joint campaign support. AIBeat may provide a listing, newsletter mention, editorial inclusion, partner page mention, affiliate promotion, or featured placement when mutually agreed.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Nothing is automatic or guaranteed. Every exchange must be approved and disclosed when relevant.
            </p>
          </div>
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="premium-card p-6 md:p-8">
          <BadgeCheck className="h-6 w-6 text-green-300" />
          <h2 className="mt-5 text-3xl font-black text-white">No unsupported audience claims</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            AIBeat will only publish subscriber, traffic, conversion, or partner metrics when they are verified and approved for public use. Until then, service pages focus on format, fit, deliverables, and transparency.
          </p>
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">FAQs</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Founder-service questions, answered plainly</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map(([question, answer]) => (
            <article key={question} className="premium-card p-5">
              <h3 className="text-lg font-semibold text-white">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <InquiryCTA title="Tell us what you are launching" goal="Founder services" />
    </div>
  )
}
