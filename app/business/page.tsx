import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Bot, CheckCircle2, Database, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AIBeat Business | Governed AI Workspace',
  description: 'One company memory, five specialized AI workflows, and governed AI operations for growing companies.',
  alternates: { canonical: '/business' },
}

const workflows = ['Lead Research & Qualification', 'Competitor / Market Monitoring', 'Marketing & Content Workflow', 'Weekly Business Reporting', 'Executive Daily Brief']
const problems = ['Fragmented AI subscriptions', 'Repeated business context', 'Duplicate tools', 'Shadow AI', 'Weak ROI visibility', 'Ungoverned outputs']

export default function BusinessPage() {
  return (
    <main className="dark-page bg-[#0b1117] text-white">
      <BusinessNav />
      <section className="border-b border-white/10">
        <div className="site-shell grid min-h-[680px] items-center gap-10 py-16 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
              <Sparkles className="h-4 w-4" />
              AIBeat Business
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-6xl">
              One company memory. Five specialized AI workflows. Fewer disconnected AI tools.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Understand AI spend, centralize business context, automate recurring work, and keep important AI actions governed and reviewable.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/business/demo" className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300">
                Try Interactive Demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/business/sign-up" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-5 py-3 text-sm font-black text-white hover:border-emerald-300/40">
                Start Early Access
              </Link>
            </div>
            <Link href="/business/ai-spend-calculator" className="mt-5 inline-flex text-sm font-bold text-cyan-100 hover:text-cyan-50">
              Calculate Your AI Spend
            </Link>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="product" className="site-shell py-16">
        <SectionHeading eyebrow="Why it exists" title="Growing companies are already using AI. The operating layer is missing." />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <CheckCircle2 className="h-5 w-5 text-amber-100" />
              <h3 className="mt-4 text-lg font-black">{problem}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow="Shared Company Memory" title="Every workflow starts from the same governed business context." body="AIBeat Business is designed to keep ICPs, client context, brand voice, tool usage, approvals, and agent findings in one tenant-scoped workspace." />
          <div className="grid gap-3 sm:grid-cols-2">
            {['Company knowledge', 'Operational context', 'People and access', 'AI operational memory'].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-[#101820] p-5">
                <Database className="h-5 w-5 text-cyan-100" />
                <h3 className="mt-4 font-black">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-16">
        <SectionHeading eyebrow="Five workflows" title="Specialized AI work, with approval boundaries where they matter." />
        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {workflows.map((workflow) => (
            <div key={workflow} className="rounded-lg border border-white/10 bg-[#101820] p-5">
              <Bot className="h-5 w-5 text-emerald-100" />
              <h3 className="mt-4 text-base font-black leading-6">{workflow}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">Uses company memory, structured outputs, workflow history, and review steps.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101820] py-16">
        <div className="site-shell">
          <SectionHeading eyebrow="How it works" title="Connect, configure, run, approve, measure." />
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {['Connect', 'Configure', 'Run', 'Approve', 'Measure'].map((step, index) => (
              <div key={step} className="rounded-lg border border-white/10 bg-black/20 p-5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-emerald-100">Step {index + 1}</span>
                <h3 className="mt-3 text-lg font-black">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell grid gap-8 py-16 lg:grid-cols-2">
        <SectionHeading eyebrow="Spend intelligence" title="Move from AI spend estimates to stack visibility." body="Start with the calculator, then use the workspace to track subscriptions, overlap, low-use seats, unapproved tools, and illustrative optimization opportunities." />
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
          <BarChart3 className="h-6 w-6 text-cyan-100" />
          <h3 className="mt-4 text-2xl font-black">AI spend and optimization</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">Figures in public previews are illustrative and demo-labeled. Real ROI depends on connected data and your company configuration.</p>
          <Link href="/business/ai-spend-calculator" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-100">Open calculator <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section id="demo" className="border-y border-white/10 bg-white/[0.025] py-16">
        <div className="site-shell grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <SectionHeading eyebrow="Product preview" title="Explore a clearly fictional workspace before creating an account." body="The public demo uses Growth Labs - Demo Workspace, a fictional 42-person digital marketing agency. No private organization data is queried." />
          <DashboardPreview compact />
        </div>
      </section>

      <section className="site-shell grid gap-8 py-16 lg:grid-cols-2">
        <SectionHeading eyebrow="Governance and security" title="Built around tenant isolation and reviewable actions." body="The authenticated workspace keeps organization data behind Supabase auth, RLS, active membership checks, and server-side authorization. External actions are designed to stop at approval boundaries." />
        <div className="grid gap-3">
          {['Organization membership required', 'RLS-backed tenant isolation', 'Approval center for important outputs', 'Audit-ready workflow history'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#101820] p-4">
              <ShieldCheck className="h-5 w-5 text-emerald-100" />
              <span className="font-semibold">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-white/10 bg-[#101820] py-16">
        <div className="site-shell">
          <SectionHeading eyebrow="Early Access" title="Pricing hypotheses while entitlements and billing are validated." />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['Starter - $199/mo', 'Growth - $499/mo', 'Scale - from $1,500/mo'].map((plan) => (
              <div key={plan} className="rounded-lg border border-white/10 bg-black/20 p-5">
                <h3 className="text-xl font-black">{plan}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Early Access scope. No live billing is enabled.</p>
              </div>
            ))}
          </div>
          <Link href="/business/pricing" className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950">View Early Access pricing <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="site-shell py-16">
        <SectionHeading eyebrow="FAQ" title="Common questions" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ['Is this self-service?', 'Early Access is guided so product scope and workflow success metrics can be validated.'],
            ['Are integrations live?', 'Some integrations are planned or guided setup only; the public demo does not authorize production connectors.'],
            ['Is company data isolated?', 'Authenticated workspace data is scoped by organization membership, server checks, and RLS policies.'],
            ['Is there a free trial?', 'Not yet. The public demo lets teams explore without creating fake workspaces.'],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
              <h3 className="font-black">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-8 text-center">
          <FileCheck2 className="mx-auto h-7 w-7 text-emerald-100" />
          <h2 className="mt-4 text-3xl font-black">Ready to move from scattered tools to governed AI workflows?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/business/demo" className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950">Try Interactive Demo</Link>
            <Link href="/business/sign-up" className="rounded-md border border-white/10 px-5 py-3 text-sm font-black text-white">Start Early Access</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function BusinessNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1117]/95 backdrop-blur">
      <div className="site-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/business" className="text-sm font-black uppercase tracking-[0.14em] text-white">AIBeat Business</Link>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-300">
          <a href="#product" className="hover:text-white">Product</a>
          <Link href="/business/demo" className="hover:text-white">Demo</Link>
          <Link href="/business/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/business/ai-spend-calculator" className="hover:text-white">AI Spend Calculator</Link>
          <Link href="/business/sign-in" className="hover:text-white">Sign in</Link>
          <Link href="/business/sign-up" className="rounded-md bg-emerald-400 px-3 py-2 font-black text-slate-950">Start Early Access</Link>
        </div>
      </div>
    </nav>
  )
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">{title}</h2>
      {body && <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{body}</p>}
    </div>
  )
}

function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#101820] p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-black text-emerald-100">Illustrative preview</span>
        <span className="text-xs text-slate-500">Growth Labs - Demo</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {['$4.7k AI spend', '$1.1k potential savings', '5 workflows'].map((metric) => (
          <div key={metric} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-black">{metric}</div>
        ))}
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? '' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
        <div className="rounded-md border border-white/10 bg-black/20 p-4">
          <h3 className="font-black">Executive Daily Brief</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">3 fictional items need attention: prospect fit, competitor movement, report approval.</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-4">
          <h3 className="font-black">Approval Center</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Weekly client report paused before simulated external delivery.</p>
        </div>
      </div>
    </div>
  )
}
