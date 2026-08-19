'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { founderEventForPlan } from '@/lib/analytics'

export function CheckoutButton({
  planId,
  label,
  email,
  productName,
  website,
  company,
}: {
  planId: string
  label: string
  email?: string
  productName?: string
  website?: string
  company?: string
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  async function startCheckout() {
    setStatus('loading')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, email, productName, website, company }),
      })
      const data = await res.json()

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Could not start checkout')
      }

      window.location.href = data.url
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={status === 'loading'}
      data-founder-event={founderEventForPlan(planId)}
      data-plan-id={planId}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {status === 'error' ? 'Try checkout again' : label}
      {status !== 'loading' ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  )
}
