'use client'

import { useState } from 'react'
import { completeBusinessOnboarding } from './actions'

const objectives = ['Reduce AI spend', 'Centralize company context', 'Automate lead research', 'Monitor competitors', 'Improve marketing workflows', 'Automate reporting']
const workflows = ['Lead Research & Qualification', 'Competitor / Market Monitoring', 'Marketing & Content Workflow', 'Weekly Business Reporting', 'Executive Daily Brief']

export function OnboardingForm({ nextPath, defaults }: { nextPath?: string; defaults?: { companyName?: string; companySize?: string } }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await completeBusinessOnboarding(new FormData(event.currentTarget))
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    window.location.assign(result.redirectTo)
  }

  return (
    <form className="rounded-lg border border-white/10 bg-[#101820] p-6 text-white md:p-8" onSubmit={handleSubmit}>
      <input type="hidden" name="next" value={nextPath ?? '/business/dashboard'} />
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Organization onboarding</p>
      <h1 className="mt-3 text-3xl font-black">Configure your first workspace</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">No integrations are required during onboarding. You can finish setup and refine context later.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-300">
          Company name
          <input name="companyName" defaultValue={defaults?.companyName} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Industry
          <select name="industry" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60">
            <option value="">Select industry</option>
            {['Digital marketing agency', 'B2B service company', 'Lead-generation agency', 'Small SaaS company', 'Other knowledge-work organization'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Company size
          <select name="companySize" defaultValue={defaults?.companySize ?? ''} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60">
            <option value="">Select size</option>
            {['1-9', '10-49', '50-99', '100-249', '250+'].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Approximate number of paid AI tools
          <input name="paidTools" type="number" min={0} defaultValue={3} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Estimated monthly AI spend
          <input name="monthlySpend" type="number" min={0} step={50} defaultValue={500} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          First objective
          <select name="objective" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60">
            <option value="">Select objective</option>
            {objectives.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-300 md:col-span-2">
          First workflow selection
          <select name="firstWorkflow" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60">
            <option value="">Select workflow</option>
            {workflows.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="mt-4 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
      <div className="mt-6 rounded-md border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
        <h2 className="text-sm font-black">Setup checklist after completion</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Review company memory, confirm AI stack, choose workflow inputs, invite teammates, then run your first workflow.</p>
      </div>
      <button type="submit" disabled={loading} className="mt-6 w-full rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400">{loading ? 'Creating workspace...' : 'Finish onboarding'}</button>
    </form>
  )
}
