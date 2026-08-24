'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateBusinessPassword } from './actions'

export function ResetPasswordForm({ initialError }: { initialError?: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ?? '')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await updateBusinessPassword(password)
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#101820] p-6 text-white">
      <h1 className="text-3xl font-black">Set a new password</h1>
      {done ? (
        <div className="mt-5">
          <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">Your password has been updated.</p>
          <Link href="/business/sign-in" className="mt-5 inline-flex text-sm font-black text-emerald-100">Sign in</Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-300">
            New password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
          </label>
          {error && <p className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{loading ? 'Updating...' : 'Update password'}</button>
        </form>
      )}
    </section>
  )
}
