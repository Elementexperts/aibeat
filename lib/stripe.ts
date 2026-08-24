import Stripe from 'stripe'
import { getPlanById, PAID_SUBMISSION_PLAN_IDS } from '@/data/founder-services'

let stripeClient: Stripe | null = null

export type PaidSubmissionPlanKey = typeof PAID_SUBMISSION_PLAN_IDS[number]

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
    fallbackEnvVar: 'STRIPE_PRICE_ID',
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
    process.env.AIBEAT_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function isPaidSubmissionPlanKey(value: string): value is PaidSubmissionPlanKey {
  return PAID_SUBMISSION_PLAN_IDS.includes(value as PaidSubmissionPlanKey)
}

export function getStripeListingPackage(planKey: string) {
  if (!isPaidSubmissionPlanKey(planKey)) return null

  return STRIPE_LISTING_PACKAGES[planKey]
}

export function getStripePriceId(planKey: string) {
  const listingPackage = getStripeListingPackage(planKey)

  if (!listingPackage) return ''

  return process.env[listingPackage.envVar] || (listingPackage.fallbackEnvVar ? process.env[listingPackage.fallbackEnvVar] : '') || ''
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
  const checkoutPlan = getCheckoutPlan(planKey)
  if (!checkoutPlan) return null

  const { plan } = checkoutPlan

  return {
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    success_url: `${siteUrl}/payment/success?plan=${encodeURIComponent(plan.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/payment/cancelled?plan=${encodeURIComponent(plan.id)}`,
    metadata: {
      package_key: plan.id,
      package_name: plan.name,
      submission_id: submissionId || '',
      product_name: productName || '',
      product_url: website || '',
      submitter_email: email || '',
      planId: plan.id,
      planName: plan.name,
      company: company || '',
    },
  }
}
