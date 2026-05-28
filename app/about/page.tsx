import type { Metadata } from 'next'
import Link from 'next/link'
import { NewsletterBox } from '@/components/ui/NewsletterBox'

export const metadata: Metadata = {
  title: 'About AIBeat.dev',
  description: 'Independent AI journalism for builders. Honest tool reviews, no sponsored rankings, free forever. Learn how AIBeat works and how we make money.',
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 border-x border-border min-h-screen">

      {/* BREADCRUMB */}
      <div className="font-mono text-[11px] text-ink-4 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">About</span>
      </div>

      {/* HERO */}
      <div className="border-b border-border pb-10 mb-10">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-3">About AIBeat.dev</div>
        <h1 className="font-serif text-3xl md:text-5xl font-black text-ink leading-tight mb-4">
          Independent AI journalism<br className="hidden md:block" /> for builders.
        </h1>
        <p className="text-lg text-ink-2 leading-relaxed max-w-2xl">
          AIBeat.dev covers artificial intelligence tools, news, and comparisons for founders, freelancers, and builders who need honest information — not marketing copy dressed up as reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10">
        <div>

          {/* MISSION */}
          <section className="mb-10">
            <div className="section-label">Our mission</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-4">Honest reviews. No sponsored rankings. Free forever.</h2>
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              The AI tools industry is flooded with affiliate-first review sites that rank tools based on commission rates, not quality. We built AIBeat.dev as the antidote: a publication where editorial integrity is non-negotiable and the people paying attention are the ones making real decisions about their software stack.
            </p>
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              Our commitment: we never accept payment for reviews, never let affiliate commissions influence rankings, and never publish content we wouldn't stand behind publicly with our names attached. If a tool is bad, we say so — even if it pays a high commission.
            </p>
            <p className="text-base text-ink-2 leading-relaxed">
              AIBeat.dev is free to read. Always. No paywalls, no metered articles, no "premium" tiers. We think good journalism about technology should be accessible to everyone building something, regardless of budget.
            </p>
          </section>

          {/* WHAT WE COVER */}
          <section className="mb-10">
            <div className="section-label">What we cover</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-6">Four editorial pillars</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-beat-red mb-2">News</div>
                <h3 className="font-serif text-lg font-bold text-ink mb-2">AI News Daily</h3>
                <p className="text-sm text-ink-3 leading-relaxed">Breaking developments from OpenAI, Anthropic, Google, and the broader AI ecosystem — explained for people who build products, not AI researchers.</p>
                <Link href="/news" className="font-mono text-[11px] text-beat-red mt-3 inline-block hover:underline">Browse news →</Link>
              </div>
              <div className="border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-beat-green mb-2">Reviews</div>
                <h3 className="font-serif text-lg font-bold text-ink mb-2">Tool Reviews</h3>
                <p className="text-sm text-ink-3 leading-relaxed">Hands-on testing of AI tools, SaaS products, and business software. Each review is based on real usage — not feature lists copied from the vendor's website.</p>
                <Link href="/tools" className="font-mono text-[11px] text-beat-green mt-3 inline-block hover:underline">Browse tools →</Link>
              </div>
              <div className="border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3 mb-2">Comparisons</div>
                <h3 className="font-serif text-lg font-bold text-ink mb-2">Head-to-Head Comparisons</h3>
                <p className="text-sm text-ink-3 leading-relaxed">Side-by-side breakdowns of competing tools with structured feature tables, pricing comparisons, and clear "who should choose which" recommendations.</p>
                <Link href="/compare" className="font-mono text-[11px] text-ink-3 mt-3 inline-block hover:underline">Browse comparisons →</Link>
              </div>
              <div className="border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3 mb-2">Free Tools</div>
                <h3 className="font-serif text-lg font-bold text-ink mb-2">Free Tools</h3>
                <p className="text-sm text-ink-3 leading-relaxed">Calculators, templates, and resources built directly into the site. No email required, no upsell. Just useful tools for freelancers and founders.</p>
                <Link href="/free-tools" className="font-mono text-[11px] text-ink-3 mt-3 inline-block hover:underline">Browse free tools →</Link>
              </div>
            </div>
          </section>

          {/* HOW WE MAKE MONEY */}
          <section className="mb-10">
            <div className="section-label">How we make money</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-4">Transparent about revenue</h2>
            <p className="text-base text-ink-2 leading-relaxed mb-4">
              AIBeat.dev generates revenue through two sources: affiliate commissions and display advertising. We believe in being explicit about this because it's the information readers need to evaluate our credibility.
            </p>

            <div className="border border-border p-5 mb-4">
              <h3 className="font-semibold text-sm text-ink mb-2">Affiliate commissions</h3>
              <p className="text-sm text-ink-3 leading-relaxed">When you click certain links on AIBeat.dev and sign up for a tool or service, we may earn a commission from the vendor. This commission comes from the vendor's marketing budget — it does not add any cost to you. Affiliate links are disclosed on every page that contains them.</p>
              <p className="text-sm text-ink-3 leading-relaxed mt-2"><strong className="text-ink">Our policy:</strong> Affiliate relationships do not influence rankings, scores, or editorial coverage. We have turned down affiliate programs from tools we don't recommend. We have recommended tools with no affiliate program and criticized tools with high-paying affiliate programs. Our editorial and commercial operations are separate.</p>
            </div>

            <div className="border border-border p-5">
              <h3 className="font-semibold text-sm text-ink mb-2">Display advertising (Google AdSense)</h3>
              <p className="text-sm text-ink-3 leading-relaxed">We display contextual advertising through Google AdSense. These are standard display ads served by Google's advertising network. Ad placement does not influence editorial content — advertisers have no input into our reviews, news coverage, or tool recommendations.</p>
              <p className="text-sm text-ink-3 leading-relaxed mt-2">We do not accept direct advertising deals, sponsored posts, paid reviews, or any arrangement where a company pays for editorial coverage. If you see a paid placement on AIBeat.dev, it will be clearly labeled as an advertisement.</p>
            </div>
          </section>

          {/* STATS */}
          <section className="mb-10">
            <div className="section-label">By the numbers</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { number: '500+', label: 'Tools reviewed' },
                { number: '40+', label: 'Published pages' },
                { number: '8,400+', label: 'Newsletter readers' },
                { number: 'Daily', label: 'Update frequency' },
              ].map((stat) => (
                <div key={stat.label} className="border border-border p-4 text-center">
                  <div className="font-serif text-2xl font-black text-ink mb-1">{stat.number}</div>
                  <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CONTACT */}
          <section className="mb-10">
            <div className="section-label">Get in touch</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-4">Contact us</h2>
            <div className="space-y-2 text-sm text-ink-2">
              <p><strong className="text-ink">General inquiries:</strong> <a href="mailto:info@aibeat.dev" className="text-beat-red hover:underline">info@aibeat.dev</a></p>
              <p><strong className="text-ink">Privacy requests:</strong> <a href="mailto:privacy@aibeat.dev" className="text-beat-red hover:underline">privacy@aibeat.dev</a></p>
              <p><strong className="text-ink">Submit a tool:</strong> <Link href="/submit" className="text-beat-red hover:underline">Submit your tool for review →</Link></p>
              <p><strong className="text-ink">Privacy policy:</strong> <Link href="/privacy" className="text-beat-red hover:underline">Read our full privacy policy →</Link></p>
            </div>
          </section>

        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          <NewsletterBox />

          <div className="border border-border p-4">
            <div className="section-label">Quick links</div>
            <div className="space-y-1">
              {[
                { label: 'AI Tools Directory', href: '/directory' },
                { label: 'Latest News', href: '/news' },
                { label: 'Tool Comparisons', href: '/compare' },
                { label: 'Free Tools', href: '/free-tools' },
                { label: 'Submit a Tool', href: '/submit' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 card-hover text-xs text-ink-2 hover:text-ink"
                >
                  {link.label}
                  <span className="text-ink-4">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
