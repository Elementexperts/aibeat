import { NextRequest, NextResponse } from 'next/server'
import {
  buildCheckoutSessionParams,
  checkoutSessionRedirect,
  getCheckoutPlan,
  getPlanKeyForCheckoutTier,
  getSiteUrl,
  getStripe,
  isCheckoutTier,
  validateStripeCheckoutConfig,
} from '@/lib/stripe'

export async function POST(req: NextRequest) {
  let tier = ''
  let email = ''
  let productName = ''
  let website = ''
  let company = ''
  let submissionId = ''

  try {
    const body = await req.json()
    tier = typeof body?.tier === 'string' ? body.tier.trim() : ''
    email = typeof body?.email === 'string' ? body.email.trim() : ''
    productName = typeof body?.productName === 'string' ? body.productName.trim().slice(0, 500) : ''
    website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : ''
    company = typeof body?.company === 'string' ? body.company.trim().slice(0, 500) : ''
    submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim().slice(0, 200) : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!isCheckoutTier(tier)) {
    return NextResponse.json({ error: 'Unknown paid listing package' }, { status: 400 })
  }

  const planId = getPlanKeyForCheckoutTier(tier)
  const checkoutPlan = planId ? getCheckoutPlan(planId) : null

  if (!checkoutPlan) {
    return NextResponse.json({ error: 'Unknown paid listing package' }, { status: 400 })
  }

  const config = validateStripeCheckoutConfig(tier)

  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 500 })
  }

  try {
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    const sessionParams = buildCheckoutSessionParams({
      planKey: tier,
      priceId: config.priceId,
      siteUrl,
      email,
      productName,
      website,
      company,
      submissionId,
    })

    if (!sessionParams) {
      return NextResponse.json({ error: 'Unknown paid listing package' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    const redirect = checkoutSessionRedirect(session)

    if (!redirect) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 })
    }

    return NextResponse.json(redirect)
  } catch (err) {
    console.error('Stripe checkout error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}
