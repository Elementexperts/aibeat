import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Start Early Access | AIBeat Business',
  description: 'Create an AIBeat Business account and continue to organization onboarding.',
  alternates: { canonical: '/business/sign-up' },
}

export default function BusinessSignUpPage({ searchParams }: { searchParams: { next?: string; plan?: string } }) {
  return (
    <main className="dark-page min-h-screen bg-[#0b1117] text-white">
      <div className="site-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.9fr_1fr]">
        <section className="max-w-xl">
          <Link href="/business" className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">AIBeat Business</Link>
          <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">One company memory for your AI workflows.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">Create an account, verify email if required, and configure your organization before entering the protected workspace.</p>
        </section>
        <SignUpForm nextPath={searchParams.next} selectedPlan={searchParams.plan} />
      </div>
    </main>
  )
}
