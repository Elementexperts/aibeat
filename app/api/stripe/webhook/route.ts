import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { markStripeEventProcessed, processCheckoutSessionEvent } from '@/lib/stripe-webhook'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

async function getSessionWithLineItems(session: Stripe.Checkout.Session) {
  if (session.line_items?.data?.length) return session

  return getStripe().checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price'],
  })
}

function logWebhookResult(eventType: string, result: ReturnType<typeof processCheckoutSessionEvent>) {
  if (result.status === 'fulfilled' || result.status === 'pending' || result.status === 'failed') {
    console.log('Stripe checkout processed:', {
      eventType,
      status: result.status,
      sessionId: result.checkoutSessionId,
      tier: result.tier,
      submissionId: result.submissionId,
    })
    return
  }

  console.log('Stripe checkout ignored:', { eventType, status: result.status, reason: 'reason' in result ? result.reason : undefined })
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
      if (!markStripeEventProcessed(event.id)) {
        console.log('Duplicate Stripe webhook event ignored:', event.id)
        break
      }

      try {
        const session = await getSessionWithLineItems(event.data.object)
        const result = processCheckoutSessionEvent(event.type, session)
        logWebhookResult(event.type, result)
      } catch (err) {
        console.error('Stripe webhook processing error:', err instanceof Error ? err.message : 'processing failed')
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
      }
      break
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed': {
      if (!markStripeEventProcessed(event.id)) {
        console.log('Duplicate Stripe webhook event ignored:', event.id)
        break
      }

      try {
        const session = await getSessionWithLineItems(event.data.object)
        const result = processCheckoutSessionEvent(event.type, session)
        logWebhookResult(event.type, result)
      } catch (err) {
        console.error('Stripe webhook processing error:', err instanceof Error ? err.message : 'processing failed')
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
      }
      break
    }
    default:
      console.log('Unhandled Stripe webhook event:', event.type)
  }

  return NextResponse.json({ received: true })
}
