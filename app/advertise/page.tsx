import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Advertise With AIBeat.dev',
  description: 'Partner with AIBeat.dev to reach founders, freelancers, and builders interested in AI tools, software, and automation.',
}

const AUDIENCE = [
  { number: '8,400+', label: 'Newsletter readers' },
  { number: '500+', label: 'AI tools tracked' },
  { number: 'Daily', label: 'News cadence' },
  { number: 'Builders', label: 'Core audience' },
]

const OPTIONS = [
  {
    title: 'Newsletter Placement',
    body: 'Reach readers inside the daily AI brief with a clearly labeled placement.',
  },
  {
    title: 'Directory Sponsorship',
    body: 'Promote an AI tool to readers browsing software by category and use case.',
  },
  {
    title: 'Launch Collaboration',
    body: 'Share a relevant product launch, offer, or update with a focused builder audience.',
  },
]

export default function AdvertisePage() {
  const subject = encodeURIComponent('AIBeat advertising inquiry')
  const body = encodeURIComponent([
    'Hi AIBeat team,',
    '',
    'I am interested in advertising or collaborating with AIBeat.dev.',
    '',
    'Company:',
    'Website:',
    'Campaign goal:',
    'Budget range:',
    'Timeline:',
    '',
    'Thanks,',
  ].join('\n'))

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border min-h-screen">
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Advertise</span>
      </div>

      <div className="px-6 py-8 border-b-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-3">Partner with AIBeat.dev</div>
        <h1 className="font-serif text-3xl md:text-5xl font-black text-ink leading-tight mb-4">
          Reach builders who care about AI tools.
        </h1>
        <p className="text-base md:text-lg text-ink-2 leading-relaxed max-w-2xl">
          AIBeat.dev covers AI news, software, and practical tools for founders, freelancers, and people building with AI. We keep advertising clearly labeled and separate from editorial coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
        <main className="p-6 border-r border-border">
          <section className="mb-8">
            <div className="section-label">Audience</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AUDIENCE.map((item) => (
                <div key={item.label} className="border border-border p-4 text-center">
                  <div className="font-serif text-2xl font-black text-ink mb-1">{item.number}</div>
                  <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="section-label">Available collaborations</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OPTIONS.map((option) => (
                <div key={option.title} className="border border-border p-4">
                  <h2 className="font-serif text-lg font-bold text-ink mb-2">{option.title}</h2>
                  <p className="text-xs text-ink-3 leading-relaxed">{option.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="section-label">Our rules</div>
            <div className="space-y-3 text-sm text-ink-2 leading-relaxed">
              <p>Sponsored placements are always labeled. We do not sell rankings, reviews, or editorial opinions.</p>
              <p>We only consider sponsors that are relevant to AIBeat readers: AI tools, SaaS products, founder services, developer tools, education, and productivity software.</p>
              <p>Editorial coverage and advertising are separate. A sponsorship does not guarantee a review, ranking, recommendation, or article.</p>
            </div>
          </section>

          <section className="border-2 border-ink bg-paper-2 p-5">
            <div className="font-mono text-[10px] text-beat-red uppercase tracking-widest mb-2">Start a conversation</div>
            <h2 className="font-serif text-2xl font-bold text-ink mb-3">Tell us what you want to promote.</h2>
            <p className="text-sm text-ink-3 leading-relaxed mb-5">
              Include your company, website, target audience, campaign goal, timeline, and budget range. We will reply if it looks like a good fit.
            </p>
            <a
              href={`mailto:info@aibeat.dev?subject=${subject}&body=${body}`}
              className="inline-block bg-ink text-white text-sm font-semibold px-5 py-3 hover:bg-beat-red transition-colors"
            >
              Email info@aibeat.dev
            </a>
          </section>
        </main>

        <aside className="p-5 space-y-5">
          <div>
            <div className="section-label">Best fit</div>
            <ul className="space-y-2 text-xs text-ink-2">
              <li>AI product launches</li>
              <li>SaaS tools for founders</li>
              <li>Developer and automation tools</li>
              <li>Newsletter or event partnerships</li>
              <li>Relevant founder services</li>
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <div className="section-label">Not a fit</div>
            <ul className="space-y-2 text-xs text-ink-2">
              <li>Paid reviews</li>
              <li>Undisclosed sponsored posts</li>
              <li>Casino, adult, or misleading products</li>
              <li>Bulk link insertions</li>
            </ul>
          </div>

          <div className="border-t border-border pt-4">
            <div className="section-label">Submit a tool</div>
            <p className="text-xs text-ink-3 leading-relaxed mb-3">
              Want editorial consideration instead of advertising?
            </p>
            <Link href="/submit" className="font-mono text-[11px] text-beat-red hover:underline">
              Submit a tool for review {'->'}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
