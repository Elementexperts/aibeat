import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, FileText, ImageIcon, Rocket, Users } from 'lucide-react'
import { DisclosureSection, FounderHero, InquiryCTA, ProcessSection, ServiceGrid } from '@/components/founders/ServiceBlocks'

export const metadata: Metadata = {
  title: 'Launch on AIBeat',
  description: 'Create a founder-friendly launch presence for your AI product on AIBeat with clear editorial standards and promotional options.',
  alternates: { canonical: '/launch' },
}

const MATERIALS = [
  {
    icon: FileText,
    title: 'Product story',
    body: 'What changed, who it is for, what problem it solves, and why the launch matters now.',
  },
  {
    icon: ImageIcon,
    title: 'Launch assets',
    body: 'Logo, screenshots, product video, founder quote, category, pricing, and primary website URL.',
  },
  {
    icon: Users,
    title: 'Audience fit',
    body: 'The reader group you want to reach: founders, marketers, developers, creators, researchers, or operators.',
  },
  {
    icon: CalendarDays,
    title: 'Timing',
    body: 'Launch date, campaign window, Product Hunt or BetaList listing, and any public release milestones.',
  },
]

export default function LaunchPage() {
  return (
    <div className="dark-page overflow-hidden">
      <FounderHero
        eyebrow="Launch on AIBeat"
        title="Give your AI launch a clearer story"
        description="AIBeat helps founders present new products, major updates, and public releases to people actively exploring AI tools, launches, and practical workflows."
        primaryHref="/submit"
        primaryLabel="Start a Launch Submission"
        secondaryHref="/spotlight"
        secondaryLabel="Explore Spotlight"
      />

      <section className="site-shell py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">What founders prepare</p>
          <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Launch pages work best with specific context</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {MATERIALS.map(({ icon: Icon, title, body }) => (
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
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Launch options</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Free submission first, promotion when it fits</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              AIBeat separates free editorial consideration from paid promotional formats so founders and readers know what they are seeing.
            </p>
          </div>
          <ServiceGrid ids={['free', 'launch-feature', 'spotlight', 'newsletter-feature', 'sponsored-article', 'growth-campaign']} />
        </div>
      </section>

      <ProcessSection />
      <DisclosureSection />

      <section className="site-shell py-16">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <Rocket className="h-6 w-6 text-cyan-200" />
          <h2 className="mt-5 text-3xl font-black text-white">AIBeat Launch Week</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Launch Week is a future campaign format for grouping selected launches into a themed editorial moment. It does not include fake voting or unsupported audience claims. For now, founders can express interest through the launch or custom campaign path.
          </p>
          <Link href="/advertise" className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-300/40">
            Ask about Launch Week
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <InquiryCTA title="Planning a launch?" goal="Launch promotion" />
    </div>
  )
}
