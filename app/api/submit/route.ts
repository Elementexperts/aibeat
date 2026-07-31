import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+\..+/i
const MAX_FIELD_LENGTH = 2000

type SubmitPayload = {
  type?: string
  name?: string
  url?: string
  category?: string
  description?: string
  email?: string
  website?: string
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LENGTH) : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function submissionHtml({
  type,
  name,
  url,
  category,
  description,
  email,
}: Required<Omit<SubmitPayload, 'website'>>) {
  const rows = [
    ['Submission type', type],
    ['Tool name', name],
    ['Tool URL', url],
    ['Category', category],
    ['Submitter email', email || 'Not provided'],
  ]

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1 style="font-family:Georgia,serif">New AIBeat tool submission</h1>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:720px">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border:1px solid #ddd;background:#f7f4ee;font-weight:bold;width:180px">${escapeHtml(label)}</td>
            <td style="border:1px solid #ddd">${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </table>
      <h2 style="font-family:Georgia,serif">Why review it?</h2>
      <p style="white-space:pre-wrap">${escapeHtml(description)}</p>
    </div>
  `
}

export async function POST(req: NextRequest) {
  let body: SubmitPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (clean(body.website)) {
    return NextResponse.json({ success: true })
  }

  const type = clean(body.type)
  const name = clean(body.name)
  const url = clean(body.url)
  const category = clean(body.category)
  const description = clean(body.description)
  const email = clean(body.email).toLowerCase()

  if (!type || !name || !url || !category || !description) {
    return NextResponse.json({ error: 'Please complete all required fields' }, { status: 400 })
  }

  if (!URL_RE.test(url)) {
    return NextResponse.json({ error: 'Enter a valid tool URL' }, { status: 400 })
  }

  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.SUBMISSION_TO_EMAIL || 'info@aibeat.dev'
  const fromEmail = process.env.SUBMISSION_FROM_EMAIL || 'AIBeat Submissions <onboarding@resend.dev>'

  if (!apiKey) {
    console.error('Missing RESEND_API_KEY env var')
    return NextResponse.json({ error: 'Submission email is not configured' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email || undefined,
        subject: `New AIBeat submission: ${name}`,
        html: submissionHtml({ type, name, url, category, description, email }),
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Resend submit failed:', res.status, detail)
      return NextResponse.json({ error: 'Could not submit right now' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Submit form error:', err)
    return NextResponse.json({ error: 'Could not submit right now' }, { status: 502 })
  }
}
