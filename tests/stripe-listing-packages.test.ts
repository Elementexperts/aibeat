import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCheckoutSessionParams,
  getCheckoutPlan,
  getStripePriceId,
  isPaidSubmissionPlanKey,
} from '../lib/stripe'
import { markStripeEventProcessed } from '../lib/stripe-webhook'

function withStripePriceEnv(env: Record<string, string | undefined>, fn: () => void) {
  const keys = ['STRIPE_PRICE_ID', 'STRIPE_PRICE_SIMPLE_PLACEMENT', 'STRIPE_PRICE_FEATURED_PLACEMENT', 'STRIPE_PRICE_SPOTLIGHT_PRO']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

  try {
    for (const key of keys) {
      if (env[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = env[key]
      }
    }
    fn()
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previous[key]
      }
    }
  }
}

test('paid listing plan key allowlist accepts exactly the three Stripe checkout packages', () => {
  assert.equal(isPaidSubmissionPlanKey('simple'), true)
  assert.equal(isPaidSubmissionPlanKey('featured'), true)
  assert.equal(isPaidSubmissionPlanKey('spotlight_pro'), true)
  assert.equal(isPaidSubmissionPlanKey('free'), false)
  assert.equal(isPaidSubmissionPlanKey('price_123'), false)
  assert.equal(getCheckoutPlan('not-real'), null)
})

test('server-side Stripe price mapping resolves all paid listing package keys', () => {
  withStripePriceEnv({
    STRIPE_PRICE_ID: 'price_spotlight_existing',
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
    STRIPE_PRICE_FEATURED_PLACEMENT: 'price_featured_995',
    STRIPE_PRICE_SPOTLIGHT_PRO: undefined,
  }, () => {
    assert.equal(getStripePriceId('simple'), 'price_simple_199')
    assert.equal(getStripePriceId('featured'), 'price_featured_995')
    assert.equal(getStripePriceId('spotlight_pro'), 'price_spotlight_existing')
    assert.equal(getStripePriceId('free'), '')
  })
})

test('Spotlight Pro can use its optional override without replacing the existing $29 variable', () => {
  withStripePriceEnv({
    STRIPE_PRICE_ID: 'price_spotlight_existing',
    STRIPE_PRICE_SPOTLIGHT_PRO: 'price_spotlight_override',
  }, () => {
    assert.equal(getStripePriceId('spotlight_pro'), 'price_spotlight_override')
  })
})

test('checkout session params use payment mode and package-specific redirect URLs', () => {
  const simple = buildCheckoutSessionParams({
    planKey: 'simple',
    priceId: 'price_simple_199',
    siteUrl: 'https://www.aibeat.dev',
    email: 'founder@example.com',
    productName: 'Example AI',
    website: 'https://example.ai',
    company: 'Example',
    submissionId: 'sub_123',
  })
  const featured = buildCheckoutSessionParams({ planKey: 'featured', priceId: 'price_featured_995', siteUrl: 'https://www.aibeat.dev' })
  const spotlight = buildCheckoutSessionParams({ planKey: 'spotlight_pro', priceId: 'price_spotlight_2900', siteUrl: 'https://www.aibeat.dev' })

  assert.equal(simple?.mode, 'payment')
  assert.deepEqual(simple?.line_items, [{ price: 'price_simple_199', quantity: 1 }])
  assert.equal(simple?.success_url, 'https://www.aibeat.dev/payment/success?plan=simple&session_id={CHECKOUT_SESSION_ID}')
  assert.equal(simple?.cancel_url, 'https://www.aibeat.dev/payment/cancelled?plan=simple')
  assert.equal(simple?.metadata?.package_key, 'simple')
  assert.equal(simple?.metadata?.package_name, 'Simple Placement')
  assert.equal(simple?.metadata?.submission_id, 'sub_123')
  assert.equal(simple?.metadata?.product_name, 'Example AI')
  assert.equal(simple?.metadata?.product_url, 'https://example.ai')
  assert.equal(simple?.metadata?.submitter_email, 'founder@example.com')
  assert.equal(featured?.success_url, 'https://www.aibeat.dev/payment/success?plan=featured&session_id={CHECKOUT_SESSION_ID}')
  assert.equal(featured?.cancel_url, 'https://www.aibeat.dev/payment/cancelled?plan=featured')
  assert.equal(spotlight?.success_url, 'https://www.aibeat.dev/payment/success?plan=spotlight_pro&session_id={CHECKOUT_SESSION_ID}')
  assert.equal(spotlight?.cancel_url, 'https://www.aibeat.dev/payment/cancelled?plan=spotlight_pro')
})

test('checkout session params reject invalid package keys', () => {
  assert.equal(buildCheckoutSessionParams({ planKey: 'price_123', priceId: 'price_any', siteUrl: 'https://www.aibeat.dev' }), null)
})

test('webhook idempotency rejects the same Stripe event more than once', () => {
  const eventId = `evt_test_${Date.now()}_${Math.random()}`

  assert.equal(markStripeEventProcessed(eventId), true)
  assert.equal(markStripeEventProcessed(eventId), false)
})
