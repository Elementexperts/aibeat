import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'Simple affiliate disclosure for AIBeat.dev readers.',
}

export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 border-x border-border min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="font-mono text-[11px] text-ink-4 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <span className="text-ink">Affiliate Disclosure</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-2">Affiliate Disclosure</h1>
        <p className="font-mono text-xs text-ink-4 mb-8">Last updated: July 31, 2026</p>

        <div className="article-body">
          <p>
            Some links on AIBeat.dev are affiliate links. If you click one of those links and sign up for a tool or service, we may earn a commission.
          </p>

          <h2>Does it cost you extra?</h2>
          <p>
            No. Affiliate commissions do not add any extra cost to you. The commission is paid by the company, not by the reader.
          </p>

          <h2>Does it affect our recommendations?</h2>
          <p>
            No. Affiliate relationships do not control our rankings, reviews, comparisons, or news coverage. We aim to recommend tools based on usefulness, value, reliability, and fit for founders, freelancers, and builders.
          </p>

          <h2>How we use affiliate links</h2>
          <p>
            We may use affiliate links in tool reviews, comparison pages, directory listings, and buying guides. When a page includes affiliate links, the relationship is disclosed clearly.
          </p>

          <h2>Our promise</h2>
          <p>
            We do not accept payment for positive reviews. We do not sell rankings. We do not hide paid relationships from readers.
          </p>

          <h2>Questions?</h2>
          <p>
            If you have questions about this disclosure, contact us at <a href="mailto:info@aibeat.dev">info@aibeat.dev</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
