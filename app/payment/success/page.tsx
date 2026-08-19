import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import { formatPlanPrice, getPlanById } from '@/data/founder-services'

export const metadata: Metadata = {
  title: 'Payment Received',
  description: 'Your AIBeat payment was received successfully.',
  robots: { index: false, follow: false },
}

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string; session_id?: string }
}) {
  const plan = getPlanById(searchParams.plan)

  return (
    <main className="dark-page min-h-screen">
      <section className="site-shell flex min-h-[75vh] items-center py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-300/30 bg-green-300/10">
            <CheckCircle2 className="h-7 w-7 text-green-200" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-green-200">Payment received</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">Thanks, your AIBeat request is moving.</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400">
            Your payment for {plan.name} ({formatPlanPrice(plan)}) was completed. AIBeat will review the submission details and follow up by email before publishing, scheduling, or confirming deliverables.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">Review first</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Paid requests still go through fit, quality, and disclosure review.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <Mail className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">Email follow-up</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">You will receive the next steps at the contact email from your submission.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/submit" className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100">
              Submit another tool
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
