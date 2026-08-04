import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react'
import { SubmitToolForm } from '@/components/founders/SubmitToolForm'
import { DisclosureSection, ServiceGrid } from '@/components/founders/ServiceBlocks'

export const metadata: Metadata = {
  title: 'Submit an AI Tool',
  description: 'Submit an AI tool to AIBeat for free review, listing consideration, editorial review, updates, or promotional interest.',
  alternates: { canonical: '/submit' },
}

const REVIEW_CRITERIA = [
  'Useful for a clear audience or workflow',
  'Public website with enough product context',
  'Honest pricing and claims',
  'Active product or credible launch',
  'Not misleading, unsafe, or purely duplicative',
]

const REQUIRED_CONTEXT = [
  'Product name and website',
  'Primary category or niche',
  'Who the product is best for',
  'What use case it solves',
  'Founder or team email if you want follow-up',
]

export default function SubmitPage() {
  return (
    <div className="dark-page overflow-hidden">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-8 top-8 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="site-shell grid gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Submit a tool</p>
            <h1 className="mt-5 text-5xl font-black leading-tight text-white md:text-7xl">Start with free AIBeat review</h1>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              Submit your AI product for directory consideration, editorial review, listing updates, claim requests, or promotional interest.
            </p>
            <div className="mt-8 grid gap-3">
              {REQUIRED_CONTEXT.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/for-founders" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-300/40">
                Compare founder services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/spotlight" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
                View Spotlight
              </Link>
            </div>
          </div>

          <Suspense fallback={<div className="premium-card p-8 text-sm text-slate-400">Loading submission form...</div>}>
            <SubmitToolForm />
          </Suspense>
        </div>
      </section>

      <section className="site-shell grid gap-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="premium-card p-6">
          <FileCheck2 className="h-6 w-6 text-cyan-200" />
          <h2 className="mt-5 text-2xl font-black text-white">What AIBeat looks for</h2>
          <ul className="mt-5 space-y-3">
            {REVIEW_CRITERIA.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="premium-card p-6">
          <ShieldCheck className="h-6 w-6 text-green-300" />
          <h2 className="mt-5 text-2xl font-black text-white">Free does not mean guaranteed</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Free submissions are reviewed manually. AIBeat may accept, decline, request more context, or suggest a better path such as Spotlight, launch promotion, newsletter sponsorship, or a partner article. Sponsored options are labeled separately from editorial consideration.
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">After submission</p>
            <h2 className="mt-3 text-4xl font-black text-white md:text-5xl">Choose promotion only if it fits your goal</h2>
          </div>
          <ServiceGrid ids={['free', 'enhanced', 'spotlight', 'launch-feature', 'newsletter-feature']} compact />
        </div>
      </section>

      <section className="site-shell py-16">
        <div className="premium-card p-6 md:p-8">
          <Sparkles className="h-6 w-6 text-cyan-200" />
          <h2 className="mt-5 text-3xl font-black text-white">Want to be featured faster?</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            If your goal is launch visibility, newsletter exposure, homepage/category Spotlight, or a sponsored article, choose promotional interest in the form or email AIBeat with your campaign timing.
          </p>
          <Link href="/advertise" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">
            View promotion options
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <DisclosureSection />
    </div>
  )
}
