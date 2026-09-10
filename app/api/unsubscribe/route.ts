import { NextRequest, NextResponse } from 'next/server'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_REASON_LENGTH = 600

function getString(body: unknown, key: string): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
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

  try {
    const submissionId = await recordPublicFormSubmission({
      kind: 'unsubscribe',
      email: normalizedEmail,
      payload: { email: normalizedEmail, reason, pageUrl },
      notificationFailure: 'log',
    })
    return NextResponse.json({ success: true, submissionId })
  } catch (err) {
    console.error('Unsubscribe storage failed:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not save your unsubscribe request right now' }, { status: 502 })
  }
}
