import { NextRequest, NextResponse } from 'next/server'
import { getPlanById } from '@/data/founder-services'
import { getSiteUrl, getStripe, getStripePriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  let planId = ''
  let email = ''
  let productName = ''
  let website = ''
  let company = ''

  try {
    const body = await req.json()
    planId = typeof body?.planId === 'string' ? body.planId.trim() : ''
    email = typeof body?.email === 'string' ? body.email.trim() : ''
    productName = typeof body?.productName === 'string' ? body.productName.trim().slice(0, 500) : ''
    website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : ''
    company = typeof body?.company === 'string' ? body.company.trim().slice(0, 500) : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const plan = getPlanById(planId)

  if (plan.billingType === 'free' || plan.billingType === 'custom') {
    return NextResponse.json({ error: 'This plan is not available for checkout' }, { status: 400 })
  }

  const priceId = getStripePriceId(plan.id)

  if (!priceId || !priceId.startsWith('price_')) {
    return NextResponse.json({ error: 'Stripe price is not configured' }, { status: 500 })
  }

  try {
    const stripe = getStripe()
    const price = await stripe.prices.retrieve(priceId)
    const siteUrl = getSiteUrl()

    const session = await stripe.checkout.sessions.create({
      mode: price.recurring ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${siteUrl}/payment/success?plan=${encodeURIComponent(plan.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancelled?plan=${encodeURIComponent(plan.id)}`,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        productName,
        website,
        company,
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}
