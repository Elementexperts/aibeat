import Stripe from 'stripe'
import { randomUUID } from 'crypto'
import { getPlanById, PAID_SUBMISSION_PLAN_IDS } from '@/data/founder-services'

let stripeClient: Stripe | null = null

export type CheckoutTier = 'simple' | 'featured' | 'spotlightPro'
export type PaidSubmissionPlanKey = typeof PAID_SUBMISSION_PLAN_IDS[number]

export const PRICE_IDS = {
  simple: process.env.STRIPE_PRICE_SIMPLE_PLACEMENT,
  featured: process.env.STRIPE_PRICE_FEATURED_PLACEMENT,
  spotlightPro: process.env.STRIPE_PRICE_SPOTLIGHT_PRO,
}

export const CHECKOUT_TIERS = ['simple', 'featured', 'spotlightPro'] as const

export const PLAN_TO_TIER: Record<PaidSubmissionPlanKey, CheckoutTier> = {
  simple: 'simple',
  featured: 'featured',
  spotlight_pro: 'spotlightPro',
}

export const TIER_TO_PLAN: Record<CheckoutTier, PaidSubmissionPlanKey> = {
  simple: 'simple',
  featured: 'featured',
  spotlightPro: 'spotlight_pro',
}

type StripeListingPackageConfig = {
  key: PaidSubmissionPlanKey
  name: string
  priceLabel: string
  envVar: string
  fallbackEnvVar?: string
}

export const STRIPE_LISTING_PACKAGES: Record<PaidSubmissionPlanKey, StripeListingPackageConfig> = {
  simple: {
    key: 'simple',
    name: 'Simple Placement',
    priceLabel: '$1.99 one time',
    envVar: 'STRIPE_PRICE_SIMPLE_PLACEMENT',
  },
  featured: {
    key: 'featured',
    name: 'Featured Placement',
    priceLabel: '$9.95 one time',
    envVar: 'STRIPE_PRICE_FEATURED_PLACEMENT',
  },
  spotlight_pro: {
    key: 'spotlight_pro',
    name: 'Spotlight Pro',
    priceLabel: '$29 one time',
    envVar: 'STRIPE_PRICE_SPOTLIGHT_PRO',
  },
}

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
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function isCheckoutTier(value: string): value is CheckoutTier {
  return CHECKOUT_TIERS.includes(value as CheckoutTier)
}

export function getCheckoutTierForPlan(planKey: string) {
  if (!isPaidSubmissionPlanKey(planKey)) return null
  return PLAN_TO_TIER[planKey]
}

export function getPlanKeyForCheckoutTier(tier: string) {
  if (!isCheckoutTier(tier)) return null
  return TIER_TO_PLAN[tier]
}

export function isPaidSubmissionPlanKey(value: string): value is PaidSubmissionPlanKey {
  return PAID_SUBMISSION_PLAN_IDS.includes(value as PaidSubmissionPlanKey)
}

export function getStripeListingPackage(planKey: string) {
  if (!isPaidSubmissionPlanKey(planKey)) return null

  return STRIPE_LISTING_PACKAGES[planKey]
}

export function getStripePriceId(planKey: string) {
  const tier = getCheckoutTierForPlan(planKey)
  if (!tier) return ''
  return getStripePriceIdForTier(tier)
}

export function getStripePriceIdForTier(tier: string) {
  const priceIds = getStripePriceIds()
  if (!isCheckoutTier(tier)) return ''
  return priceIds[tier] || ''
}

export function getStripePriceIds() {
  return {
    simple: process.env.STRIPE_PRICE_SIMPLE_PLACEMENT,
    featured: process.env.STRIPE_PRICE_FEATURED_PLACEMENT,
    spotlightPro: process.env.STRIPE_PRICE_SPOTLIGHT_PRO,
  } satisfies Record<CheckoutTier, string | undefined>
}

export function validateStripeCheckoutConfig(tier: CheckoutTier) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false as const, error: 'Stripe checkout is not configured' }
  }

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    return { ok: false as const, error: 'Site URL is not configured' }
  }

  const priceId = getStripePriceIdForTier(tier)
  if (!priceId || !priceId.startsWith('price_')) {
    return { ok: false as const, error: 'Stripe price is not configured' }
  }

  return { ok: true as const, priceId }
}

export function checkoutSessionRedirect(session: Stripe.Checkout.Session) {
  if (!session.url) return null
  return { url: session.url }
}

export function getCheckoutPlan(planKey: string) {
  const listingPackage = getStripeListingPackage(planKey)
  if (!listingPackage) return null

  const plan = getPlanById(planKey)
  if (plan.billingType !== 'one_time') return null

  return { plan, listingPackage }
}

export function buildCheckoutSessionParams({
  planKey,
  priceId,
  siteUrl,
  email,
  productName,
  website,
  company,
  submissionId,
}: {
  planKey: string
  priceId: string
  siteUrl: string
  email?: string
  productName?: string
  website?: string
  company?: string
  submissionId?: string
}): Stripe.Checkout.SessionCreateParams | null {
  const tier = isCheckoutTier(planKey) ? planKey : getCheckoutTierForPlan(planKey)
  if (!tier) return null

  const planId = getPlanKeyForCheckoutTier(tier)
  if (!planId) return null

  const checkoutPlan = getCheckoutPlan(planId)
  if (!checkoutPlan) return null

  const { plan } = checkoutPlan
  const correlationId = submissionId || randomUUID()

  return {
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    client_reference_id: correlationId,
    success_url: `${siteUrl}/payment/success?tier=${encodeURIComponent(tier)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/payment/cancelled?tier=${encodeURIComponent(tier)}`,
    metadata: {
      submissionId: correlationId,
      tier,
      productName: productName || '',
      package_key: plan.id,
      package_name: plan.name,
      submission_id: correlationId,
      product_name: productName || '',
      product_url: website || '',
      submitter_email: email || '',
      planId: plan.id,
      planName: plan.name,
      company: company || '',
    },
  }
}
