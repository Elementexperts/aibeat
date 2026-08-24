import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import Stripe from 'stripe'

import {
  buildCheckoutSessionParams,
  checkoutSessionRedirect,
  getCheckoutPlan,
  getCheckoutTierForPlan,
  getPlanKeyForCheckoutTier,
  getStripePriceId,
  getStripePriceIdForTier,
  isCheckoutTier,
  isPaidSubmissionPlanKey,
  validateStripeCheckoutConfig,
} from '../lib/stripe'
import {
  markStripeEventProcessed,
  processCheckoutSessionEvent,
  resetStripeWebhookStateForTests,
} from '../lib/stripe-webhook'
import { POST as stripeWebhookPOST } from '../app/api/stripe/webhook/route'

const ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'STRIPE_PRICE_ID',
  'STRIPE_PRICE_SIMPLE_PLACEMENT',
  'STRIPE_PRICE_FEATURED_PLACEMENT',
  'STRIPE_PRICE_SPOTLIGHT_PRO',
  'STRIPE_WEBHOOK_SECRET',
]

function withStripeEnv(env: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))

  return Promise.resolve()
    .then(async () => {
      for (const key of ENV_KEYS) {
        if (env[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = env[key]
        }
      }
      await fn()
    })
    .finally(() => {
      for (const key of ENV_KEYS) {
        if (previous[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = previous[key]
        }
      }
    })
}

function checkoutSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    mode: 'payment',
    payment_status: 'paid',
    payment_intent: 'pi_test_123',
    client_reference_id: 'sub_test_123',
    metadata: {
      submissionId: 'sub_test_123',
      tier: 'simple',
      productName: 'Example AI',
    },
    line_items: {
      object: 'list',
      data: [
        {
          id: 'li_test_123',
          object: 'item',
          amount_discount: 0,
          amount_subtotal: 199,
          amount_tax: 0,
          amount_total: 199,
          currency: 'usd',
          description: 'Simple Placement',
          price: { id: 'price_simple_199', object: 'price' } as Stripe.Price,
          quantity: 1,
        },
      ],
      has_more: false,
      url: '/v1/checkout/sessions/cs_test_123/line_items',
    },
    ...overrides,
  } as Stripe.Checkout.Session
}

test('paid listing plan key allowlist accepts existing data ids and checkout tier allowlist accepts required browser ids', () => {
  assert.equal(isPaidSubmissionPlanKey('simple'), true)
  assert.equal(isPaidSubmissionPlanKey('featured'), true)
  assert.equal(isPaidSubmissionPlanKey('spotlight_pro'), true)
  assert.equal(isPaidSubmissionPlanKey('spotlightPro'), false)
  assert.equal(isPaidSubmissionPlanKey('price_123'), false)
  assert.equal(isCheckoutTier('simple'), true)
  assert.equal(isCheckoutTier('featured'), true)
  assert.equal(isCheckoutTier('spotlightPro'), true)
  assert.equal(isCheckoutTier('spotlight_pro'), false)
  assert.equal(getCheckoutTierForPlan('spotlight_pro'), 'spotlightPro')
  assert.equal(getPlanKeyForCheckoutTier('spotlightPro'), 'spotlight_pro')
  assert.equal(getCheckoutPlan('not-real'), null)
})

test('simple maps only to STRIPE_PRICE_SIMPLE_PLACEMENT', async () => {
  await withStripeEnv({
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
    STRIPE_PRICE_FEATURED_PLACEMENT: 'price_featured_995',
    STRIPE_PRICE_SPOTLIGHT_PRO: 'price_spotlight_2900',
    STRIPE_PRICE_ID: 'price_legacy_ignored',
  }, () => {
    assert.equal(getStripePriceIdForTier('simple'), 'price_simple_199')
    assert.equal(getStripePriceId('simple'), 'price_simple_199')
  })
})

test('featured maps only to STRIPE_PRICE_FEATURED_PLACEMENT', async () => {
  await withStripeEnv({
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
    STRIPE_PRICE_FEATURED_PLACEMENT: 'price_featured_995',
    STRIPE_PRICE_SPOTLIGHT_PRO: 'price_spotlight_2900',
    STRIPE_PRICE_ID: 'price_legacy_ignored',
  }, () => {
    assert.equal(getStripePriceIdForTier('featured'), 'price_featured_995')
    assert.equal(getStripePriceId('featured'), 'price_featured_995')
  })
})

test('spotlightPro maps only to STRIPE_PRICE_SPOTLIGHT_PRO', async () => {
  await withStripeEnv({
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
    STRIPE_PRICE_FEATURED_PLACEMENT: 'price_featured_995',
    STRIPE_PRICE_SPOTLIGHT_PRO: 'price_spotlight_2900',
    STRIPE_PRICE_ID: 'price_legacy_ignored',
  }, () => {
    assert.equal(getStripePriceIdForTier('spotlightPro'), 'price_spotlight_2900')
    assert.equal(getStripePriceId('spotlight_pro'), 'price_spotlight_2900')
    assert.notEqual(getStripePriceIdForTier('spotlightPro'), process.env.STRIPE_PRICE_ID)
  })
})

test('unknown tiers are rejected and missing required configuration fails safely', async () => {
  await withStripeEnv({
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    NEXT_PUBLIC_SITE_URL: 'https://www.aibeat.dev',
    STRIPE_PRICE_SIMPLE_PLACEMENT: undefined,
  }, () => {
    assert.equal(getStripePriceIdForTier('price_123'), '')
    assert.equal(buildCheckoutSessionParams({ planKey: 'price_123', priceId: 'price_any', siteUrl: 'https://www.aibeat.dev' }), null)
    assert.deepEqual(validateStripeCheckoutConfig('simple'), { ok: false, error: 'Stripe price is not configured' })
  })
})

test('client-provided price or amount fields cannot override server mappings in checkout params', async () => {
  await withStripeEnv({
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    NEXT_PUBLIC_SITE_URL: 'https://www.aibeat.dev',
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
  }, () => {
    const config = validateStripeCheckoutConfig('simple')
    assert.equal(config.ok, true)
    if (!config.ok) return

    const params = buildCheckoutSessionParams({
      planKey: 'simple',
      priceId: config.priceId,
      siteUrl: 'https://www.aibeat.dev',
      email: 'founder@example.com',
      productName: 'Example AI',
      website: 'https://example.ai',
      company: 'Example',
      submissionId: 'sub_123',
    })

    assert.deepEqual(params?.line_items, [{ price: 'price_simple_199', quantity: 1 }])
    assert.equal('amount' in (params || {}), false)
    assert.equal('currency' in (params || {}), false)
    assert.equal(params?.metadata?.tier, 'simple')
    assert.equal(params?.metadata?.submissionId, 'sub_123')
    assert.equal(params?.metadata?.productName, 'Example AI')
  })
})

test('checkout session params use payment mode, literal session placeholder, metadata, and safe site URLs', () => {
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

  assert.equal(simple?.mode, 'payment')
  assert.deepEqual(simple?.line_items, [{ price: 'price_simple_199', quantity: 1 }])
  assert.equal(simple?.customer_email, 'founder@example.com')
  assert.equal(simple?.client_reference_id, 'sub_123')
  assert.equal(simple?.success_url, 'https://www.aibeat.dev/payment/success?tier=simple&session_id={CHECKOUT_SESSION_ID}')
  assert.equal(simple?.cancel_url, 'https://www.aibeat.dev/payment/cancelled?tier=simple')
  assert.equal(simple?.metadata?.tier, 'simple')
  assert.equal(simple?.metadata?.package_key, 'simple')
  assert.equal(simple?.metadata?.submission_id, 'sub_123')
  assert.equal(simple?.metadata?.product_name, 'Example AI')
  assert.equal(simple?.metadata?.product_url, 'https://example.ai')
  assert.equal(simple?.metadata?.submitter_email, 'founder@example.com')
})

test('successful checkout session creation response returns only redirect information', () => {
  assert.deepEqual(checkoutSessionRedirect({ id: 'cs_test', url: 'https://checkout.stripe.com/c/pay/cs_test' } as Stripe.Checkout.Session), {
    url: 'https://checkout.stripe.com/c/pay/cs_test',
  })
  assert.equal(checkoutSessionRedirect({ id: 'cs_test', url: null } as Stripe.Checkout.Session), null)
})

test('webhook idempotency rejects the same Stripe event more than once', () => {
  resetStripeWebhookStateForTests()
  const eventId = `evt_test_${Date.now()}_${Math.random()}`

  assert.equal(markStripeEventProcessed(eventId), true)
  assert.equal(markStripeEventProcessed(eventId), false)
})

test('valid paid checkout.session.completed is processed', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({ STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199' }, () => {
    const result = processCheckoutSessionEvent('checkout.session.completed', checkoutSession())
    assert.equal(result.status, 'fulfilled')
    if (result.status === 'fulfilled') {
      assert.equal(result.tier, 'simple')
      assert.equal(result.submissionId, 'sub_test_123')
      assert.equal(result.paymentIntentId, 'pi_test_123')
    }
  })
})

test('unpaid delayed checkout.session.completed is recorded pending and not fulfilled', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({ STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199' }, () => {
    const result = processCheckoutSessionEvent('checkout.session.completed', checkoutSession({ payment_status: 'unpaid' }))
    assert.equal(result.status, 'pending')
  })
})

test('checkout.session.async_payment_succeeded is fulfilled once', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({ STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199' }, () => {
    assert.equal(processCheckoutSessionEvent('checkout.session.async_payment_succeeded', checkoutSession()).status, 'fulfilled')
    assert.equal(processCheckoutSessionEvent('checkout.session.async_payment_succeeded', checkoutSession()).status, 'duplicate')
  })
})

test('checkout.session.async_payment_failed is not fulfilled', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({ STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199' }, () => {
    const result = processCheckoutSessionEvent('checkout.session.async_payment_failed', checkoutSession({ payment_status: 'unpaid' }))
    assert.equal(result.status, 'failed')
  })
})

test('price mismatch prevents webhook fulfilment', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({ STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199' }, () => {
    const session = checkoutSession({
      line_items: {
        object: 'list',
        data: [{ price: { id: 'price_attacker' } as Stripe.Price } as Stripe.LineItem],
        has_more: false,
        url: '',
      },
    })
    assert.deepEqual(processCheckoutSessionEvent('checkout.session.completed', session), {
      status: 'ignored',
      reason: 'checkout price does not match tier',
    })
  })
})

test('missing webhook signature is rejected', async () => {
  await withStripeEnv({ STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder' }, async () => {
    const res = await stripeWebhookPOST(new Request('https://www.aibeat.dev/api/stripe/webhook', { method: 'POST', body: '{}' }) as never)
    assert.equal(res.status, 400)
  })
})

test('invalid webhook signature is rejected', async () => {
  await withStripeEnv({
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder',
  }, async () => {
    const res = await stripeWebhookPOST(new Request('https://www.aibeat.dev/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'bad-signature' },
    }) as never)
    assert.equal(res.status, 400)
  })
})

test('valid signed paid webhook is accepted and duplicate event delivery does not duplicate fulfilment', async () => {
  resetStripeWebhookStateForTests()
  await withStripeEnv({
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder',
    STRIPE_PRICE_SIMPLE_PLACEMENT: 'price_simple_199',
  }, async () => {
    const payload = JSON.stringify({
      id: 'evt_test_paid',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: checkoutSession() },
    })
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_test_placeholder',
    })

    const first = await stripeWebhookPOST(new Request('https://www.aibeat.dev/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'stripe-signature': signature },
    }) as never)
    const second = await stripeWebhookPOST(new Request('https://www.aibeat.dev/api/stripe/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'stripe-signature': signature },
    }) as never)

    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
  })
})

test('success-page access alone does not mark a submission as paid', () => {
  const source = readFileSync('app/payment/success/page.tsx', 'utf8')
  assert.equal(source.includes('fetch('), false)
  assert.equal(source.includes('processCheckoutSessionEvent'), false)
  assert.equal(source.includes('payment_received'), false)
})
