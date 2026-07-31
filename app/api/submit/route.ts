import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+\..+/i
const MAX_FIELD_LENGTH = 2000
const SITE_URL = 'https://www.aibeat.dev'

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
  const safeName = escapeHtml(name)
  const safeUrl = escapeHtml(url)
  const safeDescription = escapeHtml(description)
  const rows = [
    ['Submission type', type],
    ['Tool name', name],
    ['Tool URL', `<a href="${safeUrl}" style="color:#d4380d;text-decoration:none">${safeUrl}</a>`],
    ['Category', category],
    ['Submitter email', email || 'Not provided'],
  ]

  return `
    <div style="margin:0;background:#f0ede8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;line-height:1.5">
      <div style="max-width:680px;margin:0 auto;background:#f8f7f4;border:2px solid #0a0a0a">
        <div style="border-bottom:2px solid #0a0a0a;padding:18px 22px 14px">
          <img
            src="${SITE_URL}/aibeat-logo.png"
            width="220"
            alt="AIBeat.dev"
            style="display:block;max-width:220px;height:auto;margin-bottom:10px"
          />
          <div style="font-family:Consolas,Monaco,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#666">
            Tool submission received
          </div>
        </div>

        <div style="padding:24px 22px 10px">
          <div style="display:inline-block;background:#d4380d;color:#fff;font-family:Consolas,Monaco,monospace;font-size:11px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;padding:5px 8px;margin-bottom:14px">
            Review Queue
          </div>
          <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.1;margin:0 0 8px;color:#0a0a0a">
            ${safeName}
          </h1>
          <p style="margin:0 0 20px;color:#666;font-size:14px">
            A new tool was submitted through AIBeat.dev.
          </p>

          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:22px">
            ${rows.map(([label, value]) => `
              <tr>
                <td style="border:1px solid #ddd9d2;background:#f0ede8;font-family:Consolas,Monaco,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;width:180px;padding:10px">
                  ${escapeHtml(label)}
                </td>
                <td style="border:1px solid #ddd9d2;background:#fff;font-size:14px;color:#0a0a0a;padding:10px">
                  ${label === 'Tool URL' ? value : escapeHtml(value)}
                </td>
              </tr>
            `).join('')}
          </table>

          <div style="border-left:4px solid #d4380d;background:#fff;padding:14px 16px;margin-bottom:22px">
            <h2 style="font-family:Georgia,serif;font-size:20px;line-height:1.2;margin:0 0 8px;color:#0a0a0a">
              Why review it?
            </h2>
            <p style="white-space:pre-wrap;margin:0;color:#2d2d2d;font-size:14px">${safeDescription}</p>
          </div>

          <a
            href="${safeUrl}"
            style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;padding:11px 16px;margin-bottom:8px"
          >
            Open submitted tool
          </a>
        </div>

        <div style="border-top:1px solid #ddd9d2;padding:16px 22px 20px;background:#f0ede8">
          <p style="margin:0 0 6px;font-family:Consolas,Monaco,monospace;font-size:11px;color:#666">
            AIBeat.dev submissions
          </p>
          <p style="margin:0;color:#666;font-size:12px">
            This notification was sent from the AIBeat submit form. Replies go to the submitter when they provided an email address.
          </p>
        </div>
      </div>
    </div>
  `
}

function submissionText({
  type,
  name,
  url,
  category,
  description,
  email,
}: Required<Omit<SubmitPayload, 'website'>>) {
  return [
    'New AIBeat tool submission',
    '',
    `Submission type: ${type}`,
    `Tool name: ${name}`,
    `Tool URL: ${url}`,
    `Category: ${category}`,
    `Submitter email: ${email || 'Not provided'}`,
    '',
    'Why review it?',
    description,
  ].join('\n')
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
        text: submissionText({ type, name, url, category, description, email }),
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
