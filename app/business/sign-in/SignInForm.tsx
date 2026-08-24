'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react'
import { signInBusinessUser } from './actions'

export function SignInForm({ nextPath, initialError }: { nextPath?: string; initialError?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(initialError ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signInBusinessUser(email, password, nextPath)
      if (!result.ok) {
        setError(result.error)
        setLoading(false)
        return
      }

      window.location.assign(result.redirectTo ?? '/business/dashboard')
    } catch {
      setError('Unable to complete sign-in. Please check your details and try again.')
      setLoading(false)
    }
  }

  return (
    <main className="dark-page min-h-screen bg-[#0b1117] text-white">
      <div className="site-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.95fr_1fr]">
        <section className="max-w-xl">
          <Link href="/business" className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
            <Sparkles className="h-4 w-4" />
            AIBeat Business
          </Link>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Sign in to your governed AI workspace</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Company memory, five specialized workflows, approvals, and AI spend visibility in one protected workspace.
          </p>
          <Link href="/business/demo" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-cyan-50">
            Try the demo without signing in
          </Link>
        </section>

        <section className="w-full rounded-lg border border-white/10 bg-[#101820] p-6 shadow-2xl shadow-black/20 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-100">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-400">Use the email and password for your AIBeat Business account.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block text-sm font-semibold text-slate-300">
              Work email
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
              <span className="mt-2 flex rounded-md border border-white/10 bg-black/20 focus-within:border-emerald-300/60">
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-white outline-none"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="px-3 text-slate-300 hover:text-white"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <div className="flex justify-end">
              <Link href="/business/forgot-password" className="text-sm font-semibold text-cyan-100 hover:text-cyan-50">
                Forgot password?
              </Link>
            </div>
            {error && <p className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</p>}
            <button
              className="w-full rounded-md bg-emerald-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span>New to AIBeat Business?</span>
            <Link href={`/business/sign-up${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="font-bold text-emerald-100 hover:text-emerald-50">
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
