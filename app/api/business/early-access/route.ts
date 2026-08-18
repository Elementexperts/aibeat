import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD_LENGTH = 500
const DEFAULT_TO_EMAIL = 'info@aibeat.dev'
const DEFAULT_FROM_EMAIL = 'AIBeat Business <onboarding@resend.dev>'
const COMPANY_SIZES = new Set(['1-9', '10-19', '20-49', '50-100', '101-250', '250+'])

type EarlyAccessPayload = {
  email?: string
  company?: string
  companySize?: string
  designPartner?: boolean
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

function getRecipients() {
  return (process.env.BUSINESS_EARLY_ACCESS_TO_EMAIL || process.env.SUBMISSION_TO_EMAIL || DEFAULT_TO_EMAIL)
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, all) => EMAIL_RE.test(email) && all.indexOf(email) === index)
}

function leadHtml(input: { email: string; company: string; companySize: string; designPartner: boolean }) {
  const rows = [
    ['Work email', input.email],
    ['Company', input.company],
    ['Company size', input.companySize],
    ['Design partner interest', input.designPartner ? 'Yes' : 'No'],
  ]

  return `
    <div style="margin:0;background:#07080b;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#f7f8fa;line-height:1.5">
      <div style="max-width:680px;margin:0 auto;background:#0d0f14;border:1px solid rgba(255,255,255,0.14);border-radius:24px;overflow:hidden">
        <div style="padding:24px 24px 12px">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#22d3ee;font-weight:bold">AIBeat Business early access</div>
          <h1 style="font-size:30px;line-height:1.15;margin:12px 0 8px;color:#fff">New early access request</h1>
          <p style="margin:0;color:#a7adba;font-size:14px">A company joined the AIBeat Business interest list.</p>
        </div>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:calc(100% - 48px);margin:18px 24px 24px">
          ${rows.map(([label, value]) => `
            <tr>
              <td style="border:1px solid rgba(255,255,255,0.12);background:#13161d;color:#747b8a;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;padding:11px;width:190px">${escapeHtml(label)}</td>
              <td style="border:1px solid rgba(255,255,255,0.12);color:#f7f8fa;font-size:14px;padding:11px">${escapeHtml(value)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    </div>
  `
}

function leadText(input: { email: string; company: string; companySize: string; designPartner: boolean }) {
  return [
    'New AIBeat Business early access request',
    '',
    `Work email: ${input.email}`,
    `Company: ${input.company}`,
    `Company size: ${input.companySize}`,
    `Design partner interest: ${input.designPartner ? 'Yes' : 'No'}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  let body: EarlyAccessPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (clean(body.website)) {
    return NextResponse.json({ success: true })
  }

  const email = clean(body.email).toLowerCase()
  const company = clean(body.company)
  const companySize = clean(body.companySize)
  const designPartner = body.designPartner === true

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid work email' }, { status: 400 })
  }

  if (!company) {
    return NextResponse.json({ error: 'Enter your company name' }, { status: 400 })
  }

  if (!COMPANY_SIZES.has(companySize)) {
    return NextResponse.json({ error: 'Select a company size' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmails = getRecipients()
  const fromEmail = process.env.BUSINESS_EARLY_ACCESS_FROM_EMAIL || process.env.SUBMISSION_FROM_EMAIL || DEFAULT_FROM_EMAIL

  if (!apiKey) {
    console.error('Missing RESEND_API_KEY env var')
    return NextResponse.json({ error: 'Early access signup is not configured' }, { status: 500 })
  }

  if (toEmails.length === 0) {
    console.error('No valid business early access recipients configured')
    return NextResponse.json({ error: 'Early access signup is not configured' }, { status: 500 })
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
        to: toEmails,
        reply_to: email,
        subject: `[AIBeat Business Early Access] ${company}`,
        html: leadHtml({ email, company, companySize, designPartner }),
        text: leadText({ email, company, companySize, designPartner }),
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Resend early access failed:', res.status, detail)
      return NextResponse.json({ error: 'Could not join early access right now' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Business early access error:', error)
    return NextResponse.json({ error: 'Could not join early access right now' }, { status: 502 })
  }
}
