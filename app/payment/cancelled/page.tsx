import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { formatPlanPrice, getPlanById } from '@/data/founder-services'

const TIER_TO_PLAN: Record<string, string> = {
  simple: 'simple',
  featured: 'featured',
  spotlightPro: 'spotlight_pro',
}

export const metadata: Metadata = {
  title: 'Payment Cancelled',
  description: 'Your AIBeat payment was not completed.',
  robots: { index: false, follow: false },
}

export default function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: { plan?: string; tier?: string }
}) {
  const plan = getPlanById(TIER_TO_PLAN[searchParams.tier || ''] || searchParams.plan)
  const submitHref = `/submit?plan=${encodeURIComponent(plan.id)}`

  return (
    <main className="dark-page min-h-screen">
      <section className="site-shell flex min-h-[75vh] items-center py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10">
            <CreditCard className="h-7 w-7 text-amber-100" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Payment cancelled</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">No charge was made.</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400">
            Checkout for {plan.name} ({formatPlanPrice(plan)}) was cancelled. No completed payment was recorded from this checkout return. You can return to the submission options when you are ready.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={submitHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100">
              <ArrowLeft className="h-4 w-4" />
              Back to submission
            </Link>
            <Link href="/for-founders" className="inline-flex justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40">
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
