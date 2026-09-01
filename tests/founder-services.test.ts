import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  FEATURE_MATRIX_ROWS,
  FOUNDER_SERVICE_PLANS,
  CONTENT_LABELS,
  formatPlanPrice,
  getActivePlans,
  getPlanById,
  getPlansByCategory,
  getPaidSubmissionPlans,
  getRecommendedPlan,
  getSubmissionPlans,
  isEditorPickPurchasable,
} from '../data/founder-services'
import { inspectAibeatLink, normalizeAibeatDestination, verifyAibeatLink } from '../lib/aibeat-link-verification'
import { founderEventForPlan, FOUNDER_ANALYTICS_EVENTS } from '../lib/analytics'

function html(body: string, status = 200, headers: Record<string, string> = { 'content-type': 'text/html' }) {
  return new Response(body, { status, headers })
}

test('founder service plans expose active pricing from central configuration', () => {
  assert.equal(getActivePlans().length, 9)
  assert.equal(formatPlanPrice(getPlanById('free')), 'Free')
  assert.equal(formatPlanPrice(getPlanById('simple')), '$1.99 one time')
  assert.equal(formatPlanPrice(getPlanById('featured')), '$9.95 one time')
  assert.equal(formatPlanPrice(getPlanById('spotlight_pro')), '$29.00 one time')
  assert.equal(formatPlanPrice(getPlanById('launch-campaign')), 'Custom')
  assert.equal(formatPlanPrice(getPlanById('newsletter-sponsorship')), 'Custom')
  assert.equal(formatPlanPrice(getPlanById('sponsored-article')), '$199 one time')
  assert.equal(formatPlanPrice(getPlanById('growth-campaign')), 'From $349')
  assert.equal(getRecommendedPlan()?.id, 'featured')
  assert.equal(getPlansByCategory('listing').map((plan) => plan.id).join(','), 'free,simple,featured,spotlight_pro')
  assert.equal(getSubmissionPlans().map((plan) => plan.id).join(','), 'free,simple,featured,spotlight_pro')
  assert.equal(getPaidSubmissionPlans().map((plan) => plan.id).join(','), 'simple,featured,spotlight_pro')
})

test('invalid plan falls back safely and Free Listing requires verification', () => {
  const fallback = getPlanById('not-real')
  const paid = getPlanById('simple')

  assert.equal(fallback.id, 'free')
  assert.equal(fallback.verificationRequired, true)
  assert.equal(paid.verificationRequired, undefined)
})

test('feature matrix separates conditional and guaranteed newsletter benefits', () => {
  const row = FEATURE_MATRIX_ROWS.find((item) => item.label === 'Newsletter coverage')
  const verified = FEATURE_MATRIX_ROWS.find((item) => item.label === 'Verified badge')

  assert.equal(row?.values.spotlight_pro, 'Considered')
  assert.equal(row?.values.featured, 'Not included')
  assert.equal(verified?.values.simple, 'Not included')
  assert.equal(verified?.values.featured, 'Not included')
  assert.equal(verified?.values.spotlight_pro, 'Not included')
})

test('content labels keep Editors Pick non-purchasable and Sponsored purchasable', () => {
  assert.equal(isEditorPickPurchasable(), false)
  assert.equal(CONTENT_LABELS.find((item) => item.label === 'Sponsored')?.purchasable, true)
})

test('analytics event mapping does not include personal data fields', () => {
  assert.equal(founderEventForPlan('free'), FOUNDER_ANALYTICS_EVENTS.submitFreeClick)
  assert.equal(founderEventForPlan('simple'), FOUNDER_ANALYTICS_EVENTS.simplePlacementClick)
  assert.equal(founderEventForPlan('featured'), FOUNDER_ANALYTICS_EVENTS.featuredPlacementClick)
  assert.equal(founderEventForPlan('spotlight_pro'), FOUNDER_ANALYTICS_EVENTS.spotlightProClick)
  assert.equal(founderEventForPlan('growth-campaign'), FOUNDER_ANALYTICS_EVENTS.growthCampaignClick)
})

test('paid submission plans never include or grant Verified status', () => {
  for (const plan of getPaidSubmissionPlans()) {
    assert.equal(plan.verifiedBadgeIncluded, false)
    assert.equal(plan.verificationRequired, undefined)
    assert.ok(plan.exclusions?.some((entry) => entry.includes('Verified badge')))
  }
})

test('paid pricing cards route to a preselected submission instead of direct checkout', () => {
  const serviceCards = readFileSync('components/founders/ServiceBlocks.tsx', 'utf8')
  const submissionCards = readFileSync('components/founders/SubmissionPricingCards.tsx', 'utf8')

  assert.match(serviceCards, /`\/submit\?plan=\$\{encodeURIComponent\(item\.id\)\}`/)
  assert.match(submissionCards, /`\/submit\?plan=\$\{encodeURIComponent\(plan\.id\)\}`/)
  assert.equal(serviceCards.includes('<CheckoutButton'), false)
  assert.equal(submissionCards.includes('<CheckoutButton'), false)
})

test('paid checkout is offered only after submit returns a captured submission id', () => {
  const form = readFileSync('components/founders/SubmitToolForm.tsx', 'utf8')
  const submitRoute = readFileSync('app/api/submit/route.ts', 'utf8')
  const checkoutRoute = readFileSync('app/api/stripe/checkout/route.ts', 'utf8')

  assert.match(form, /paidPlan && submissionId/)
  assert.match(form, /submissionId=\{submissionId\}/)
  assert.match(submitRoute, /success: true, submissionId/)
  assert.match(checkoutRoute, /buildCheckoutSessionParams/)
})

test('approved AIBeat destinations normalize www and common paths', () => {
  assert.equal(normalizeAibeatDestination('https://www.aibeat.dev/'), 'https://aibeat.dev')
  assert.equal(normalizeAibeatDestination('https://aibeat.dev/tools?utm_source=x'), 'https://aibeat.dev/tools')
  assert.equal(normalizeAibeatDestination('https://aibeat.dev/submit#form'), 'https://aibeat.dev/submit')
  assert.equal(normalizeAibeatDestination('https://evil.test'), undefined)
})

test('valid text backlink including nofollow and sponsored rel is accepted', () => {
  const result = inspectAibeatLink('<html><head><title>Press</title></head><body><a href="https://www.aibeat.dev/" rel="nofollow sponsored">Listed on AIBeat</a></body></html>', 'text')

  assert.equal(result.ok, true)
  assert.equal(result.evidence?.matchedHref, 'https://aibeat.dev')
  assert.equal(result.evidence?.pageTitle, 'Press')
})

test('valid visual badge must be wrapped in an AIBeat anchor', () => {
  const result = inspectAibeatLink('<a href="https://aibeat.dev"><img src="https://aibeat.dev/badges/listed-on-aibeat.svg" alt="Listed on AIBeat" /></a>', 'badge')

  assert.equal(result.ok, true)
  assert.equal(result.evidence?.matchedBadgeSrc, 'https://aibeat.dev/badges/listed-on-aibeat.svg')
})

test('wrong destination missing link hidden link and unwrapped badge are rejected', () => {
  assert.equal(inspectAibeatLink('<a href="https://example.com">Listed on AIBeat</a>', 'text').ok, false)
  assert.equal(inspectAibeatLink('<p>No badge here</p>', 'text').ok, false)
  assert.equal(inspectAibeatLink('<a style="display:none" href="https://aibeat.dev">Listed on AIBeat</a>', 'text').ok, false)
  assert.equal(inspectAibeatLink('<img src="https://aibeat.dev/badges/listed-on-aibeat.svg" alt="Listed on AIBeat" />', 'badge').ok, false)
  assert.equal(inspectAibeatLink('<a href="https://aibeat.dev">Listed on AIBeat</a>', 'badge').ok, false)
})

test('server verification accepts official subdomains and rejects unrelated domains', async () => {
  const fetchImpl = async () => html('<a href="https://aibeat.dev">Listed on AIBeat</a>')

  const accepted = await verifyAibeatLink({
    websiteUrl: 'https://example.ai',
    verificationPageUrl: 'https://press.example.ai/aibeat',
    verificationMethod: 'text',
    fetchImpl,
  })
  const rejected = await verifyAibeatLink({
    websiteUrl: 'https://example.ai',
    verificationPageUrl: 'https://other.ai/aibeat',
    verificationMethod: 'text',
    fetchImpl,
  })

  assert.equal(accepted.ok, true)
  assert.equal(rejected.ok, false)
})

test('server verification rejects private hosts non-html oversized responses redirects and timeouts', async () => {
  const privateHost = await verifyAibeatLink({
    websiteUrl: 'https://127.0.0.1',
    verificationPageUrl: 'https://127.0.0.1/page',
    verificationMethod: 'text',
    fetchImpl: async () => html(''),
  })
  const nonHtml = await verifyAibeatLink({
    websiteUrl: 'https://example.ai',
    verificationPageUrl: 'https://example.ai/page',
    verificationMethod: 'text',
    fetchImpl: async () => html('{}', 200, { 'content-type': 'application/json' }),
  })
  const oversized = await verifyAibeatLink({
    websiteUrl: 'https://example.ai',
    verificationPageUrl: 'https://example.ai/page',
    verificationMethod: 'text',
    maxBytes: 10,
    fetchImpl: async () => html('<a href="https://aibeat.dev">Listed on AIBeat</a>'),
  })
  const redirects = await verifyAibeatLink({
    websiteUrl: 'https://example.ai',
    verificationPageUrl: 'https://example.ai/page',
    verificationMethod: 'text',
    maxRedirects: 0,
    fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://example.ai/next' } }),
  })

  assert.equal(privateHost.ok, false)
  assert.equal(nonHtml.ok, false)
  assert.equal(oversized.ok, false)
  assert.equal(redirects.ok, false)
})

test('founder pricing contains the requested initial public lineup', () => {
  const lineup = FOUNDER_SERVICE_PLANS.map((plan) => [plan.name, plan.priceLabel])

  assert.deepEqual(lineup, [
    ['Free Listing', 'Free'],
    ['Simple Placement', '$1.99 one time'],
    ['Featured Placement', '$9.95 one time'],
    ['Spotlight Pro', '$29.00 one time'],
    ['Launch Campaign', 'Custom'],
    ['Newsletter Sponsorship', 'Custom'],
    ['Sponsored Article', '$199 one time'],
    ['Growth Campaign', 'From $349'],
    ['Media and Affiliate Partnership', 'Custom or exchange-based'],
  ])
})
