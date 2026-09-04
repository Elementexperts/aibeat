import { NextRequest, NextResponse } from 'next/server'
import { sanitizeNewsletterAttribution } from '@/lib/newsletter-attribution'

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

  const apiKey = process.env.RESEND_API_KEY
  const recipients = getRecipients()
  if (!apiKey || recipients.length === 0) {
    console.error('Newsletter request notification is not configured')
    return NextResponse.json({ error: 'Newsletter signup is not configured' }, { status: 500 })
  }

  const attribution = sanitizeNewsletterAttribution(body)
  const details = [
    ['Subscriber email', email],
    ['Page URL', attribution.page_url || 'Not provided'],
    ['Referrer', attribution.referrer || 'Not provided'],
    ['UTM source', attribution.utm_source || 'Not provided'],
    ['UTM campaign', attribution.utm_campaign || 'Not provided'],
  ]

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM_EMAIL || process.env.SUBMISSION_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to: recipients,
        reply_to: email,
        subject: `[AIBeat Newsletter Signup] ${email}`,
        html: `<h1>New newsletter signup request</h1><table>${details.map(([label, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table>`,
        text: ['New AIBeat newsletter signup request', '', ...details.map(([label, value]) => `${label}: ${value}`)].join('\n'),
      }),
    })

    if (!response.ok) {
      console.error('Resend newsletter notification failed:', response.status, await response.text())
      return NextResponse.json({ error: 'Could not send your request right now' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter notification error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not send your request right now' }, { status: 502 })
  }
}
