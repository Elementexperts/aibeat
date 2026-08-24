import type Stripe from 'stripe'
import { getStripePriceIdForTier, isCheckoutTier, type CheckoutTier } from './stripe'

const processedStripeEventIds = new Set<string>()
const fulfilledCheckoutSessionIds = new Set<string>()

export function markStripeEventProcessed(eventId: string) {
  if (processedStripeEventIds.has(eventId)) return false
  processedStripeEventIds.add(eventId)
  return true
}

export function resetStripeWebhookStateForTests() {
  processedStripeEventIds.clear()
  fulfilledCheckoutSessionIds.clear()
}

export type StripeWebhookProcessingResult =
  | { status: 'fulfilled'; tier: CheckoutTier; submissionId: string; checkoutSessionId: string; paymentIntentId: string }
  | { status: 'pending'; tier: CheckoutTier; submissionId: string; checkoutSessionId: string; paymentIntentId: string }
  | { status: 'failed'; tier: CheckoutTier; submissionId: string; checkoutSessionId: string; paymentIntentId: string }
  | { status: 'duplicate'; checkoutSessionId?: string }
  | { status: 'ignored'; reason: string }

function paymentIntentId(value: Stripe.Checkout.Session['payment_intent']) {
  if (!value) return ''
  return typeof value === 'string' ? value : value.id
}

function extractTier(session: Stripe.Checkout.Session) {
  const tier = session.metadata?.tier
  return tier && isCheckoutTier(tier) ? tier : null
}

function extractSubmissionId(session: Stripe.Checkout.Session) {
  return session.metadata?.submissionId || session.metadata?.submission_id || session.client_reference_id || ''
}

export function markCheckoutSessionFulfilled(sessionId: string) {
  if (fulfilledCheckoutSessionIds.has(sessionId)) return false
  fulfilledCheckoutSessionIds.add(sessionId)
  return true
}

export function validateCheckoutSessionPrice(session: Stripe.Checkout.Session) {
  const tier = extractTier(session)
  if (!tier) return false

  const expectedPriceId = getStripePriceIdForTier(tier)
  if (!expectedPriceId) return false

  const priceIds = session.line_items?.data
    .map((item) => {
      const price = item.price
      return typeof price === 'string' ? price : price?.id
    })
    .filter(Boolean)

  if (!priceIds?.length) return true

  return priceIds.length === 1 && priceIds[0] === expectedPriceId
}

export function processCheckoutSessionEvent(eventType: string, session: Stripe.Checkout.Session): StripeWebhookProcessingResult {
  if (session.mode !== 'payment') {
    return { status: 'ignored', reason: 'non-payment checkout session' }
  }

  const tier = extractTier(session)
  if (!tier) {
    return { status: 'ignored', reason: 'missing or unknown checkout tier' }
  }

  if (!validateCheckoutSessionPrice(session)) {
    return { status: 'ignored', reason: 'checkout price does not match tier' }
  }

  const submissionId = extractSubmissionId(session)
  const checkoutSessionId = session.id
  const paymentIntent = paymentIntentId(session.payment_intent)

  if (eventType === 'checkout.session.async_payment_failed') {
    return { status: 'failed', tier, submissionId, checkoutSessionId, paymentIntentId: paymentIntent }
  }

  if (eventType === 'checkout.session.completed' && session.payment_status !== 'paid') {
    return { status: 'pending', tier, submissionId, checkoutSessionId, paymentIntentId: paymentIntent }
  }

  if (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded') {
    if (!markCheckoutSessionFulfilled(checkoutSessionId)) {
      return { status: 'duplicate', checkoutSessionId }
    }

    return { status: 'fulfilled', tier, submissionId, checkoutSessionId, paymentIntentId: paymentIntent }
  }

  return { status: 'ignored', reason: 'unhandled event type' }
}
