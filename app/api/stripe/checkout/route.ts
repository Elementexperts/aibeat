import { NextRequest, NextResponse } from 'next/server'
import { buildCheckoutSessionParams, getCheckoutPlan, getSiteUrl, getStripe, getStripePriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  let planId = ''
  let email = ''
  let productName = ''
  let website = ''
  let company = ''
  let submissionId = ''

  try {
    const body = await req.json()
    planId = typeof body?.planId === 'string' ? body.planId.trim() : ''
    email = typeof body?.email === 'string' ? body.email.trim() : ''
    productName = typeof body?.productName === 'string' ? body.productName.trim().slice(0, 500) : ''
    website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : ''
    company = typeof body?.company === 'string' ? body.company.trim().slice(0, 500) : ''
    submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim().slice(0, 200) : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const checkoutPlan = getCheckoutPlan(planId)

  if (!checkoutPlan) {
    return NextResponse.json({ error: 'Unknown paid listing package' }, { status: 400 })
  }

  const { plan } = checkoutPlan
  const priceId = getStripePriceId(plan.id)

  if (!priceId || !priceId.startsWith('price_')) {
    return NextResponse.json({ error: 'Stripe price is not configured' }, { status: 500 })
  }

  try {
    const stripe = getStripe()
    const siteUrl = getSiteUrl()
    const sessionParams = buildCheckoutSessionParams({
      planKey: plan.id,
      priceId,
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

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}
