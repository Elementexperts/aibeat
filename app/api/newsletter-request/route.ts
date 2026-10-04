import { NextRequest, NextResponse } from 'next/server'
import { sanitizeNewsletterAttribution } from '@/lib/newsletter-attribution'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getEmail(body: unknown) {
  if (typeof body !== 'object' || body === null) return undefined
  const email = (body as Record<string, unknown>).email
  return typeof email === 'string' ? email.trim().toLowerCase() : undefined
}

export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = getEmail(body)
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const attribution = sanitizeNewsletterAttribution(body)

  try {
    let notificationStatus: 'sent' | 'failed' = 'failed'
    const submissionId = await recordPublicFormSubmission({
      kind: 'newsletter', email, payload: { email, ...attribution },
      notificationFailure: 'log',
      onNotificationResult: status => { notificationStatus = status },
    })
    return NextResponse.json({ success: true, submissionId, notificationStatus })
  } catch (error) {
    console.error('Newsletter storage error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not send your request right now' }, { status: 502 })
  }
}
