import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KIT_API_BASE = 'https://api.kit.com/v4'
const MAX_REASON_LENGTH = 600

function getString(body: unknown, key: string): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

function parseSubscriberId(payload: unknown, email: string): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const subscribers = (payload as { subscribers?: unknown }).subscribers
  if (!Array.isArray(subscribers)) return undefined

  const match = subscribers.find((item) => {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    return typeof record.email_address === 'string' && record.email_address.toLowerCase() === email
  }) as Record<string, unknown> | undefined

  const id = match?.id
  return typeof id === 'string' || typeof id === 'number' ? String(id) : undefined
}

export async function POST(req: NextRequest) {
  let rawBody: unknown

  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const normalizedEmail = getString(rawBody, 'email')?.trim().toLowerCase()
  const reason = getString(rawBody, 'reason')?.trim().slice(0, MAX_REASON_LENGTH)
  const pageUrl = getString(rawBody, 'page_url')?.trim().slice(0, 500)

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.KIT_API_KEY

  if (!apiKey) {
    console.error('Missing KIT_API_KEY env var')
    return NextResponse.json({ error: 'Newsletter unsubscribe is not configured' }, { status: 500 })
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': apiKey,
    }

    const subscriberRes = await fetch(`${KIT_API_BASE}/subscribers?email_address=${encodeURIComponent(normalizedEmail)}`, {
      headers,
    })

    if (!subscriberRes.ok) {
      console.error('Kit subscriber lookup failed:', subscriberRes.status)
      return NextResponse.json({ error: 'Could not unsubscribe right now' }, { status: 502 })
    }

    const subscriberId = parseSubscriberId(await subscriberRes.json(), normalizedEmail)

    if (!subscriberId) {
      console.info('AIBeat unsubscribe requested for non-matching email:', {
        email: normalizedEmail,
        reason,
        pageUrl,
      })
      return NextResponse.json({ success: true })
    }

    const unsubscribeRes = await fetch(`${KIT_API_BASE}/subscribers/${encodeURIComponent(subscriberId)}/unsubscribe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    })

    if (!unsubscribeRes.ok) {
      console.error('Kit unsubscribe failed:', unsubscribeRes.status)
      return NextResponse.json({ error: 'Could not unsubscribe right now' }, { status: 502 })
    }

    console.info('AIBeat unsubscribe requested:', {
      email: normalizedEmail,
      subscriberId,
      reason,
      pageUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit unsubscribe error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not unsubscribe right now' }, { status: 502 })
  }
}
