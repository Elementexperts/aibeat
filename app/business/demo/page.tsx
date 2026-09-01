import type { Metadata } from 'next'
import Link from 'next/link'
import { BusinessWorkspace, type BusinessWorkspaceRoute } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Interactive Demo | AIBeat Business',
  description: 'Explore a clearly fictional, read-only AIBeat Business demo workspace.',
  alternates: { canonical: '/business/demo' },
}

const allowedViews = new Set<BusinessWorkspaceRoute>(['dashboard', 'ask', 'workflows', 'agents', 'context', 'ai-stack', 'approvals', 'reports'])

export default function BusinessDemoPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = allowedViews.has(searchParams.view as BusinessWorkspaceRoute)
    ? (searchParams.view as BusinessWorkspaceRoute)
    : 'dashboard'

  return (
    <>
      <div className="dark-page border-b border-cyan-300/20 bg-[#0b1117] text-white">
        <div className="site-shell flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Interactive demo</p>
            <h1 className="mt-1 text-xl font-black">Growth Labs - Demo Workspace</h1>
            <p className="mt-1 text-sm text-slate-400">Digital Marketing Agency, 42 employees. Fictional data only.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/business/sign-up" className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">Create Your Workspace</Link>
            <Link href="/business/pricing" className="rounded-md border border-white/10 px-3 py-2 text-sm font-black text-white">Start Early Access</Link>
            <Link href="/business/ai-spend-calculator" className="rounded-md border border-cyan-300/20 px-3 py-2 text-sm font-black text-cyan-100">Calculate Your AI Spend</Link>
          </div>
        </div>
      </div>
      <BusinessWorkspace route={view} mode="demo" />
    </>
  )
}
