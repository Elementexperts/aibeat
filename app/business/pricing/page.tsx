import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Early Access Pricing | AIBeat Business',
  description: 'Early Access pricing hypotheses for AIBeat Business. Request access or join the design partner pilot.',
  alternates: { canonical: '/business/pricing' },
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$199/month',
    fit: 'Suitable for small teams testing governed AI operations.',
    scope: ['One workspace', 'Up to five users', 'Company Memory', 'AI Stack visibility', 'Two active workflows', 'Weekly reporting', 'Standard support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$499/month',
    fit: 'Suitable for agencies and service companies operationalizing AI.',
    badge: 'Recommended',
    scope: ['Up to 15 users', 'All five workflows', 'Approval controls', 'Scheduled runs', 'Reports', 'Supported integrations', 'Priority support'],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'From $1,500/month',
    fit: 'Suitable for companies requiring a tailored deployment.',
    scope: ['Larger teams', 'Custom workflow configuration', 'Advanced governance', 'Custom integrations', 'Guided implementation', 'Success and ROI reviews'],
  },
  {
    id: 'design-partner',
    name: 'Design Partner',
    price: 'Custom pilot',
    fit: 'Work directly with AIBeat to configure one production workflow, define success metrics, and complete an ROI review.',
    scope: ['Guided workflow setup', 'Success metric definition', 'ROI review', 'Product feedback loop'],
  },
]

export default function BusinessPricingPage() {
  return (
    <main className="dark-page min-h-screen bg-[#0b1117] text-white">
      <nav className="border-b border-white/10">
        <div className="site-shell flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/business" className="text-sm font-black uppercase tracking-[0.14em]">AIBeat Business</Link>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
            <Link href="/business/demo" className="hover:text-white">Demo</Link>
            <Link href="/business/ai-spend-calculator" className="hover:text-white">AI Spend Calculator</Link>
            <Link href="/business/sign-in" className="hover:text-white">Sign in</Link>
          </div>
        </div>
      </nav>

      <section className="site-shell py-16">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Early Access pricing</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Pricing hypotheses while the product is validated with early teams.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          These are Early Access prices, not live subscription plans. Stripe billing and plan enforcement are intentionally not enabled yet.
        </p>
      </section>

      <section className="site-shell grid gap-4 pb-16 lg:grid-cols-4">
        {plans.map((plan) => (
          <article key={plan.id} className={`relative rounded-lg border p-5 ${plan.badge ? 'border-emerald-300/40 bg-emerald-300/[0.08]' : 'border-white/10 bg-[#101820]'}`}>
            {plan.badge && <span className="absolute right-4 top-4 rounded-md bg-emerald-400 px-2 py-1 text-xs font-black text-slate-950">{plan.badge}</span>}
            <h2 className="text-2xl font-black">{plan.name}</h2>
            <p className="mt-3 text-3xl font-black text-emerald-100">{plan.price}</p>
            <p className="mt-4 min-h-20 text-sm leading-6 text-slate-300">{plan.fit}</p>
            <ul className="mt-5 space-y-3">
              {plan.scope.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-100" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/business/sign-up?plan=${encodeURIComponent(plan.id)}`}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-emerald-300"
            >
              {plan.id === 'design-partner' ? 'Request Design Partner Access' : 'Start Early Access'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell">
          <h2 className="text-3xl font-black">Pricing FAQ</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ['Is this self-service?', 'Early Access is guided while onboarding, entitlements, and workflow success criteria are validated.'],
              ['Are integrations included?', 'Supported integrations may require guided setup. Unavailable integrations are not presented as production-ready.'],
              ['Is company data isolated?', 'Yes. Real workspace data is scoped by Supabase auth, organization membership, RLS, and server-side checks.'],
              ['Can plans change during Early Access?', 'Yes. These are pricing hypotheses and may change as product scope is validated.'],
              ['Is there a free trial?', 'Not yet. The public interactive demo is the exploration path before account creation.'],
              ['What happens after requesting access?', 'You create an account, verify email if required, complete organization onboarding, and AIBeat can follow up on guided setup.'],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-lg border border-white/10 bg-[#101820] p-5">
                <h3 className="font-black">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
