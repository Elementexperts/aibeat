import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, Eye, Handshake, Mail, Newspaper, Rocket, Search, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { NewsletterBox } from '@/components/ui/NewsletterBox'

export const metadata: Metadata = {
  title: 'About AIBeat',
  description: 'Learn how AIBeat helps people discover AI tools, follow AI news, explore launches, and connect founders with relevant audiences through transparent listings, newsletters, and promotional services.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About AIBeat',
    description: 'AIBeat is a modern AI discovery and media platform for tools, news, launches, newsletters, and founder services.',
    url: '/about',
    type: 'website',
  },
}

const WHAT_WE_DO = [
  {
    icon: Search,
    label: 'Discover',
    title: 'AI tool discovery',
    body: 'AIBeat organizes useful AI products by category, use case, pricing model, and practical context so readers can find tools worth exploring.',
    href: '/tools',
    cta: 'Browse tools',
  },
  {
    icon: Newspaper,
    label: 'Read',
    title: 'AI news and explainers',
    body: 'AIBeat follows important AI developments and turns them into clear, readable updates for builders, marketers, founders, and operators.',
    href: '/news',
    cta: 'Read news',
  },
  {
    icon: Rocket,
    label: 'Launch',
    title: 'Startup launches',
    body: 'AIBeat highlights emerging products, launch stories, and founder-friendly promotional paths without copying generic launch-board formats.',
    href: '/launch',
    cta: 'Launch on AIBeat',
  },
  {
    icon: Mail,
    label: 'Newsletter',
    title: 'AIBeat Daily',
    body: 'The newsletter gives readers selected AI tools, launches, and industry updates without making them search across the whole AI ecosystem.',
    href: '/newsletter',
    cta: 'Join the newsletter',
  },
]

const SERVICES = [
  {
    title: 'Free tool submission',
    body: 'Founders can submit AI products for review and possible inclusion in the directory. Free listings may require badge or backlink verification before approval.',
  },
  {
    title: 'Enhanced listings and Spotlight',
    body: 'Relevant products can request richer listing presentation, priority review, and clearly labeled promotional visibility when approved.',
  },
  {
    title: 'Launch and newsletter promotion',
    body: 'AIBeat offers launch features, newsletter placements, and campaign options with transparent expectations and no unsupported performance promises.',
  },
  {
    title: 'Sponsored articles and partnerships',
    body: 'Sponsored, partner, affiliate, and featured content is labeled clearly so readers can distinguish editorial coverage from commercial placement.',
  },
]

const WORKFLOWS = [
  {
    icon: Workflow,
    title: 'Daily discovery workflows',
    body: 'AIBeat uses automation to help surface recent AI products, inspect public business contact pages, score qualified leads, and prepare review-ready reports.',
  },
  {
    icon: Sparkles,
    title: 'Founder outreach drafts',
    body: 'Outreach workflows create one-recipient draft messages in Kit for manual review. Production sending remains disabled by default.',
  },
  {
    icon: Newspaper,
    title: 'Content and social drafts',
    body: 'News and social workflows help turn AIBeat articles into reusable drafts, reports, and review artifacts before anything is published externally.',
  },
  {
    icon: ShieldCheck,
    title: 'Human review first',
    body: 'Automation supports research and drafting, but AIBeat keeps review, approval, publishing, and commercial decisions under human control.',
  },
]

const PRINCIPLES = [
  'No fake traffic, subscriber, ranking, rating, or partner claims.',
  'Paid promotion does not guarantee positive editorial coverage.',
  'Sponsored, partner, affiliate, and featured placements should be visibly labeled.',
  'Editor’s Pick is not purchasable.',
  'Free Listing verification confirms website control only; it does not guarantee publication.',
  'Reader usefulness and founder transparency matter more than hype.',
]

const QUICK_LINKS = [
  { label: 'AI Tools Directory', href: '/tools' },
  { label: 'Latest AI News', href: '/news' },
  { label: 'For Founders', href: '/for-founders' },
  { label: 'Submit a Tool', href: '/submit' },
  { label: 'Spotlight', href: '/spotlight' },
  { label: 'Advertise', href: '/advertise' },
  { label: 'Partners', href: '/partners' },
  { label: 'Privacy Policy', href: '/privacy' },
]

export default function AboutPage() {
  return (
    <div className="dark-page overflow-hidden">
      <section className="site-shell py-10 md:py-16">
        <div className="font-mono text-[11px] text-slate-500 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-slate-300">About</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              <Sparkles className="h-4 w-4" />
              AI discovery and media
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
              Helping people discover what AI can actually do.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              AIBeat is a modern platform for discovering AI tools, following important AI developments, exploring startup launches, and helping AI founders reach relevant audiences through transparent listings, newsletters, editorial formats, and partnership opportunities.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/tools" className="gradient-button rounded-full px-5 py-3 text-sm font-semibold">
                Explore AI Tools
              </Link>
              <Link href="/for-founders" className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40">
                See Founder Services
              </Link>
            </div>
          </div>

          <div className="premium-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Current focus</p>
            <div className="mt-5 grid gap-3">
              {['AI tool directory', 'Daily AI news', 'Startup launches', 'AIBeat Daily newsletter', 'Founder services', 'Partnership opportunities'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                  <BadgeCheck className="h-4 w-4 text-green-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">What AIBeat does</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">One platform for discovery, news, launches, and growth</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {WHAT_WE_DO.map(({ icon: Icon, label, title, body, href, cta }) => (
              <article key={title} className="premium-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
                  </div>
                </div>
                <h3 className="mt-5 text-2xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
                <Link href={href} className="mt-5 inline-flex text-sm font-semibold text-cyan-200 hover:text-white">
                  {cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">For founders</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Commercial options without murky promises</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              AIBeat supports founders through listings, launch promotion, Spotlight visibility, newsletter opportunities, sponsored formats, and partnerships. Every request is reviewed for quality, relevance, accuracy, and fit.
            </p>
            <Link href="/for-founders" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
              Compare founder options
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <article key={service.title} className="premium-card p-5">
                <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{service.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">How workflows help</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Automation supports the desk. It does not replace judgment.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              AIBeat uses safe automation for research, drafting, reports, and workflow support. Publishing, sending, partnership approval, and editorial decisions remain deliberate.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {WORKFLOWS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="premium-card p-5">
                <Icon className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="premium-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-cyan-200" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Editorial and commercial transparency</p>
            </div>
            <h2 className="mt-5 text-3xl font-black text-white">The trust rules are simple.</h2>
            <div className="mt-6 grid gap-3">
              {PRINCIPLES.map((principle) => (
                <div key={principle} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                  <p className="text-sm leading-6 text-slate-300">{principle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <NewsletterBox />

            <div className="premium-card p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Quick links</p>
              <div className="mt-4 space-y-1">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {link.label}
                    <span className="text-slate-500">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="premium-card p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Handshake className="h-6 w-6 text-amber-200" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Contact</p>
          </div>
          <h2 className="mt-5 text-3xl font-black text-white">Want to submit, partner, or ask a question?</h2>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
            <p><strong className="text-white">General inquiries:</strong> <a href="mailto:info@aibeat.dev" className="text-cyan-200 hover:text-white">info@aibeat.dev</a></p>
            <p><strong className="text-white">Privacy requests:</strong> <a href="mailto:privacy@aibeat.dev" className="text-cyan-200 hover:text-white">privacy@aibeat.dev</a></p>
            <p><strong className="text-white">Submit a tool:</strong> <Link href="/submit" className="text-cyan-200 hover:text-white">Open the submission form</Link></p>
            <p><strong className="text-white">Partner with AIBeat:</strong> <Link href="/partners" className="text-cyan-200 hover:text-white">View partnership options</Link></p>
          </div>
        </div>
      </section>
    </div>
  )
}
