'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInBusinessUser, signOutBusinessUser } from './actions'

function safeNextPath(value?: string) {
  if (!value || !value.startsWith('/business') || value.startsWith('/business/sign-in')) {
    return '/business/dashboard'
  }
  return value
}

export function SignInForm({ nextPath, initialError }: { nextPath?: string; initialError?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ?? '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await signInBusinessUser(email, password)
      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }

      window.location.assign(safeNextPath(nextPath))
    } catch {
      setError('Unable to complete sign-in. Please check your connection and try again.')
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await signOutBusinessUser()
      if (!result.ok) {
        setError(result.error)
        return
      }

      setMessage('Signed out.')
      router.refresh()
    } catch {
      setError('Unable to sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dark-page min-h-screen bg-[#0b1117] text-white">
      <div className="site-shell flex min-h-screen items-center justify-center py-12">
        <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#101820] p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">AIBeat Business</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Sign in</h1>
          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block text-sm font-semibold text-slate-300">
              Email
              <input
                className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Password
              <input
                className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300/60"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
            {message && <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{message}</p>}
            <button
              className="w-full rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait' : 'Sign in'}
            </button>
          </form>
          <button
            className="mt-3 w-full rounded-md border border-white/10 px-4 py-2 text-sm font-black text-white transition hover:border-emerald-300/40 disabled:cursor-not-allowed disabled:text-slate-500"
            type="button"
            onClick={handleSignOut}
            disabled={loading}
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  )
}
