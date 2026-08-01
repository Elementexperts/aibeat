import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Clock3, Newspaper, Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { SubscribeForm } from '@/components/subscribe/SubscribeForm'

export const metadata: Metadata = {
  title: 'AIBeat Daily Brief - Essential AI News & Tools',
  description: 'Get essential AI news, useful tools, and practical opportunities curated for founders, freelancers, and builders.',
  alternates: { canonical: '/newsletter' },
  openGraph: {
    title: 'Understand AI before your first coffee',
    description: 'The essential AI news, useful tools, and practical opportunities delivered by AIBeat.',
    url: '/newsletter',
    type: 'website',
  },
}

const BENEFITS = [
  {
    icon: Newspaper,
    title: 'The news that changes something',
    body: 'The biggest AI stories, reduced to what happened, why it matters, and what to watch next.',
  },
  {
    icon: Wrench,
    title: 'Useful tools, honestly reviewed',
    body: 'Practical AI tools for building, marketing, researching, and creating without sponsored rankings.',
  },
  {
    icon: Sparkles,
    title: 'Ideas you can actually use',
    body: 'Workflows, launches, and opportunities selected for founders, freelancers, and builders.',
  },
]

const SAMPLE_ITEMS = [
  ['01', 'The lead story', 'One important AI development, explained without the noise.'],
  ['02', 'The useful tool', 'A quick, independent look at a tool worth testing.'],
  ['03', 'The practical move', 'One idea, workflow, or opportunity you can act on today.'],
]

export default function NewsletterPage() {
  return (
    <main className="max-w-5xl mx-auto border-x border-border bg-paper">
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Daily Brief</span>
      </div>

      <section className="relative overflow-hidden bg-ink text-white border-b-2 border-ink">
        <div className="absolute inset-y-0 right-0 hidden md:block w-[42%] border-l border-white/10 bg-[radial-gradient(circle_at_70%_30%,rgba(213,42,42,0.32),transparent_55%)]" />
        <div className="relative grid md:grid-cols-[1.25fr_.75fr]">
          <div className="px-6 py-14 md:px-10 md:py-20">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60 mb-6">
              <span className="h-2 w-2 rounded-full bg-beat-red" />
              Independent AI briefing
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-black leading-[1.02] tracking-tight max-w-2xl">
              Understand AI.<br />Before your first coffee.
            </h1>
            <p className="mt-6 text-base md:text-lg text-white/70 leading-relaxed max-w-xl">
              The essential AI news, useful tools, and practical opportunities curated for founders, freelancers, and builders.
            </p>

            <div id="subscribe" className="mt-8 max-w-lg scroll-mt-24">
              <SubscribeForm buttonLabel="Get the free brief ->" dark />
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-white/50">
                <span className="flex items-center gap-1.5"><Check size={12} /> Free</span>
                <span className="flex items-center gap-1.5"><Check size={12} /> No spam</span>
                <span className="flex items-center gap-1.5"><Check size={12} /> Unsubscribe anytime</span>
              </div>
            </div>
          </div>

          <div className="relative px-6 pb-12 md:p-10 md:flex md:items-center">
            <div className="w-full border border-white/15 bg-white/[0.06] backdrop-blur-sm p-5 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-beat-red">Today&apos;s brief</p>
                  <p className="font-serif text-lg font-bold mt-1">AIBeat Morning Edition</p>
                </div>
                <Clock3 size={18} className="text-white/40" />
              </div>
              <div className="divide-y divide-white/10">
                {SAMPLE_ITEMS.map(([number, title, body]) => (
                  <div key={number} className="py-4 flex gap-4">
                    <span className="font-mono text-[10px] text-beat-red pt-1">{number}</span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-white/50 leading-relaxed mt-1">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/35 pt-1">Read time: about 5 minutes</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 border-b-2 border-ink">
        {[
          ['8,400+', 'Readers'],
          ['~5 min', 'Read time'],
          ['Daily', 'Publishing'],
        ].map(([stat, label], index) => (
          <div key={label} className={`px-6 py-5 text-center ${index < 2 ? 'sm:border-r border-border' : ''} ${index > 0 ? 'border-t sm:border-t-0 border-border' : ''}`}>
            <p className="font-serif text-3xl font-black text-ink">{stat}</p>
            <p className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </section>

      <section className="px-6 py-12 md:px-10 md:py-16 border-b border-border">
        <div className="max-w-2xl mb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-beat-red mb-3">What you get</p>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-ink leading-tight">Signal for people building with AI.</h2>
          <p className="text-sm text-ink-3 leading-relaxed mt-4">Not another endless news feed. Each edition is edited to help you understand the shift and decide what deserves your attention.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="bg-paper p-6 md:min-h-56">
              <div className="w-10 h-10 border border-border flex items-center justify-center mb-7 text-beat-red">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink">{title}</h3>
              <p className="text-sm text-ink-3 leading-relaxed mt-3">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 border-b border-border">
        <div className="px-6 py-12 md:px-10 md:py-16 md:border-r border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-beat-red mb-3">Made for</p>
          <h2 className="font-serif text-3xl font-black text-ink">Curious people who need clarity, not hype.</h2>
          <div className="mt-7 space-y-4">
            {[
              'Founders tracking new products and market shifts',
              'Freelancers looking for better tools and workflows',
              'Builders, marketers, and creators working with AI',
              'Researchers and learners who want the bigger picture',
            ].map((item) => (
              <div key={item} className="flex gap-3 text-sm text-ink-2">
                <Check size={16} className="text-beat-green shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-12 md:px-10 md:py-16 bg-paper-2 flex flex-col justify-between">
          <div>
            <ShieldCheck size={26} className="text-beat-green mb-5" />
            <blockquote className="font-serif text-2xl md:text-3xl font-bold text-ink leading-snug">
              &quot;Independent AI news and tool reviews. No sponsored rankings. Ever.&quot;
            </blockquote>
            <p className="text-sm text-ink-3 leading-relaxed mt-5">AIBeat separates editorial judgment from promotion, so recommendations remain useful and transparent.</p>
          </div>
          <Link href="/about" className="inline-flex items-center gap-2 mt-8 font-mono text-[11px] text-ink hover:text-beat-red">
            How AIBeat works <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      <section className="bg-beat-red text-white px-6 py-12 md:px-10 md:py-16 text-center">
        <Search size={24} className="mx-auto mb-5 text-white/70" />
        <h2 className="font-serif text-3xl md:text-4xl font-black">Spend less time searching.<br />Start each day informed.</h2>
        <p className="text-sm text-white/75 max-w-md mx-auto mt-4 mb-7">Join the AIBeat daily brief and get the signal delivered directly to your inbox.</p>
        <div className="max-w-md mx-auto bg-ink p-4 text-left">
          <SubscribeForm buttonLabel="Join AIBeat ->" dark />
        </div>
      </section>

      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-ink-4">Questions? <span className="font-mono">hello@aibeat.dev</span></p>
        <div className="flex items-center gap-4">
          <Link href="/news" className="font-mono text-[11px] text-ink-3 hover:text-beat-red">Latest news</Link>
          <Link href="/directory" className="font-mono text-[11px] text-ink-3 hover:text-beat-red">Tool directory</Link>
          <Link href="/privacy" className="font-mono text-[11px] text-ink-3 hover:text-beat-red">Privacy</Link>
        </div>
      </div>
    </main>
  )
}
