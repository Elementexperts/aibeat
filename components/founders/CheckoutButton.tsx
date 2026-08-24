'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { founderEventForPlan } from '@/lib/analytics'

const PLAN_TO_CHECKOUT_TIER: Record<string, string> = {
  simple: 'simple',
  featured: 'featured',
  spotlight_pro: 'spotlightPro',
}

export function CheckoutButton({
  planId,
  label,
  email,
  productName,
  website,
  company,
  fullWidth = false,
}: {
  planId: string
  label: string
  email?: string
  productName?: string
  website?: string
  company?: string
  fullWidth?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const tier = PLAN_TO_CHECKOUT_TIER[planId]

  async function startCheckout() {
    if (status === 'loading' || !tier) return
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email, productName, website, company }),
      })
      const data = await res.json()

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Could not start checkout')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setStatus('error')
    }
  }

  return (
    <div className={fullWidth ? 'w-full' : undefined}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === 'loading' || !tier}
        aria-busy={status === 'loading'}
        aria-describedby={status === 'error' ? `${planId}-checkout-error` : undefined}
        data-founder-event={founderEventForPlan(planId)}
        data-plan-id={planId}
        data-checkout-tier={tier || undefined}
        className={`shiny-order-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70 ${fullWidth ? 'w-full' : ''}`}
      >
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {status === 'loading' ? 'Starting checkout...' : status === 'error' ? 'Try checkout again' : label}
        {status !== 'loading' ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
      {status === 'error' && (
        <p id={`${planId}-checkout-error`} role="alert" className="mt-3 text-xs leading-5 text-red-200">
          {error || 'Could not start checkout'}
        </p>
      )}
    </div>
  )
}
