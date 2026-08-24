import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { markStripeEventProcessed } from '@/lib/stripe-webhook'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

function logCompletedCheckout(session: Stripe.Checkout.Session, eventType: string) {
  console.log('Stripe checkout completed:', {
    eventType,
    sessionId: session.id,
    customerEmail: session.customer_details?.email || session.customer_email,
    packageKey: session.metadata?.package_key || session.metadata?.planId,
    packageName: session.metadata?.package_name || session.metadata?.planName,
    submissionId: session.metadata?.submission_id,
    productName: session.metadata?.product_name || session.metadata?.productName,
    productUrl: session.metadata?.product_url || session.metadata?.website,
  })
}

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
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (!markStripeEventProcessed(event.id)) {
        console.log('Duplicate Stripe webhook event ignored:', event.id)
        break
      }
      const session = event.data.object
      logCompletedCheckout(session, event.type)
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
