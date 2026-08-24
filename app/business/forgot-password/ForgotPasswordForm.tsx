'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestBusinessPasswordReset } from './actions'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await requestBusinessPasswordReset(email)
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#101820] p-6 text-white">
      <h1 className="text-3xl font-black">Reset your password</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Enter your work email and we will send a password reset link if an account can receive one.</p>
      {sent ? (
        <p className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Check your email for a reset link.</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-300">
            Work email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
          </label>
          {error && <p className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{loading ? 'Sending...' : 'Send reset link'}</button>
        </form>
      )}
      <Link href="/business/sign-in" className="mt-5 inline-flex text-sm font-bold text-cyan-100">Back to sign in</Link>
    </section>
  )
}
