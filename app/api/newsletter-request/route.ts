import { NextRequest, NextResponse } from 'next/server'
import { sanitizeNewsletterAttribution } from '@/lib/newsletter-attribution'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_TO_EMAIL = 'info@aibeat.dev'
const DEFAULT_FROM_EMAIL = 'AIBeat Newsletter <submissions@aibeat.dev>'

function getEmail(body: unknown) {
  if (typeof body !== 'object' || body === null) return undefined
  const email = (body as Record<string, unknown>).email
  return typeof email === 'string' ? email.trim().toLowerCase() : undefined
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getRecipients() {
  return (process.env.NEWSLETTER_TO_EMAIL || process.env.SUBMISSION_TO_EMAIL || DEFAULT_TO_EMAIL)
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email, index, all) => EMAIL_RE.test(email) && all.indexOf(email) === index)
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
    const submissionId = await recordPublicFormSubmission({ kind: 'newsletter', email, payload: { email, ...attribution } })
    return NextResponse.json({ success: true, submissionId })
  } catch (error) {
    console.error('Newsletter storage error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not send your request right now' }, { status: 502 })
  }
}
