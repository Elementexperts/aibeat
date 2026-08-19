import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET env var')
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event

  try {
    const payload = await req.text()
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log('Stripe checkout completed:', {
        sessionId: session.id,
        customerEmail: session.customer_details?.email || session.customer_email,
        planId: session.metadata?.planId,
      })
      break
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      console.log('Stripe webhook received:', event.type)
      break
    default:
      console.log('Unhandled Stripe webhook event:', event.type)
  }

  return NextResponse.json({ received: true })
}
