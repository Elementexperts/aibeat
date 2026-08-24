'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { signUpBusinessUser } from './actions'

export function SignUpForm({ nextPath, selectedPlan }: { nextPath?: string; selectedPlan?: string }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await signUpBusinessUser(formData)
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (result.status === 'check-email') {
      setCheckEmail(result.email ?? 'your inbox')
      setLoading(false)
      return
    }
    window.location.assign(result.redirectTo ?? '/business/onboarding')
  }

  if (checkEmail) {
    return (
      <div className="rounded-lg border border-emerald-300/20 bg-[#101820] p-6 text-white">
        <CheckCircle2 className="h-8 w-8 text-emerald-100" />
        <h2 className="mt-4 text-2xl font-black">Check your email</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">We sent a verification link to {checkEmail}. After verification, you will continue to organization onboarding.</p>
        <Link href="/business/sign-in" className="mt-5 inline-flex text-sm font-black text-emerald-100">Return to sign in</Link>
      </div>
    )
  }

  return (
    <form className="rounded-lg border border-white/10 bg-[#101820] p-6 text-white shadow-2xl shadow-black/20 md:p-8" onSubmit={handleSubmit}>
      <input type="hidden" name="next" value={nextPath ?? '/business/onboarding'} />
      <input type="hidden" name="plan" value={selectedPlan ?? ''} />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">Start Early Access</p>
        <h1 className="mt-3 text-3xl font-black">Create your AIBeat Business account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Want to explore first? <Link href="/business/demo" className="font-bold text-cyan-100">Try the interactive demo</Link>.</p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="text-sm font-semibold text-slate-300">
          Full name
          <input name="fullName" autoComplete="name" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Work email
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Password
          <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Company name
          <input name="companyName" autoComplete="organization" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          Company size
          <select name="companySize" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60">
            <option value="">Select size</option>
            {['1-9', '10-49', '50-99', '100-249', '250+'].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <label className="flex gap-3 text-sm leading-6 text-slate-300">
          <input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-emerald-300" />
          <span>I accept the <Link href="/privacy" className="font-bold text-cyan-100">Privacy Policy</Link> and AIBeat Early Access terms.</span>
        </label>
      </div>

      {error && <p className="mt-4 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
      <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400">
        {loading ? 'Creating account...' : 'Create account'} <ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link href="/business/sign-in" className="font-bold text-emerald-100">Sign in</Link></p>
    </form>
  )
}
