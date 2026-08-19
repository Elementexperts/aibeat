import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY env var')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AIBEAT_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function getStripePriceId(planId?: string) {
  const planKey = planId?.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  const planSpecificPriceId = planKey ? process.env[`STRIPE_PRICE_ID_${planKey}`] : undefined

  return planSpecificPriceId || process.env.STRIPE_PRICE_ID || ''
}
