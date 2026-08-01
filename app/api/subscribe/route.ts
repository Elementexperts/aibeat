import { NextRequest, NextResponse } from 'next/server'
import {
  getKitReferrer,
  getSourceKey,
  getSourceTagId,
  sanitizeNewsletterAttribution,
} from '@/lib/newsletter-attribution'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KIT_API_BASE = 'https://api.kit.com/v4'

function getEmailFromBody(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const email = (body as Record<string, unknown>).email
  return typeof email === 'string' ? email : undefined
}

async function applySourceTag(input: {
  headers: Record<string, string>
  subscriberId: string
  tagId: string | undefined
}) {
  if (!input.tagId) return

  try {
    const tagRes = await fetch(`${KIT_API_BASE}/tags/${encodeURIComponent(input.tagId)}/subscribers/${input.subscriberId}`, {
      method: 'POST',
      headers: input.headers,
    })

    if (!tagRes.ok) {
      console.warn('Kit source tag apply failed:', tagRes.status)
    }
  } catch {
    console.warn('Kit source tag apply failed')
  }
}

export async function POST(req: NextRequest) {
  let email: string | undefined
  let rawBody: unknown

  try {
    rawBody = await req.json()
    email = getEmailFromBody(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const normalizedEmail = email?.trim().toLowerCase()
  const attribution = sanitizeNewsletterAttribution(rawBody)

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.KIT_API_KEY
  const formId = process.env.KIT_FORM_ID

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID env vars')
    return NextResponse.json({ error: 'Newsletter signup is not configured' }, { status: 500 })
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': apiKey,
    }

    const subscriberRes = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email_address: normalizedEmail }),
    })

    if (!subscriberRes.ok) {
      console.error('Kit subscriber upsert failed:', subscriberRes.status)
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    const subscriberData = await subscriberRes.json()
    const subscriberId = subscriberData?.subscriber?.id

    if (!subscriberId) {
      console.error('Kit subscriber upsert returned no subscriber id')
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    const formRes = await fetch(`${KIT_API_BASE}/forms/${formId}/subscribers/${subscriberId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ referrer: getKitReferrer(attribution) }),
    })

    if (!formRes.ok) {
      console.error('Kit form subscribe failed:', formRes.status)
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    await applySourceTag({
      headers,
      subscriberId,
      tagId: getSourceTagId(process.env, getSourceKey(attribution)),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit subscribe error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
  }
}
