import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KIT_API_BASE = 'https://api.kit.com/v4'
const MAX_REASON_LENGTH = 600
const DEFAULT_TO_EMAIL = 'info@aibeat.dev'
const DEFAULT_FROM_EMAIL = 'AIBeat Unsubscribe <submissions@aibeat.dev>'

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getNotificationRecipients() {
  return (process.env.UNSUBSCRIBE_TO_EMAIL || process.env.SUBMISSION_TO_EMAIL || DEFAULT_TO_EMAIL)
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, all) => EMAIL_RE.test(email) && all.indexOf(email) === index)
}

function notificationHtml(input: { email: string; reason?: string; pageUrl?: string; kitStatus: string }) {
  const rows = [
    ['Email', input.email],
    ['Kit status', input.kitStatus],
    ['Page URL', input.pageUrl || 'Not provided'],
    ['Reason', input.reason || 'No comment provided'],
  ]

  return `
    <div style="margin:0;background:#f0ede8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;line-height:1.5">
      <div style="max-width:680px;margin:0 auto;background:#f8f7f4;border:2px solid #0a0a0a">
        <div style="border-bottom:2px solid #0a0a0a;padding:18px 22px 14px">
          <div style="font-family:Consolas,Monaco,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#666">
            AIBeat newsletter unsubscribe
          </div>
          <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.1;margin:10px 0 0;color:#0a0a0a">
            Reader requested unsubscribe
          </h1>
        </div>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:calc(100% - 44px);margin:22px">
          ${rows.map(([label, value]) => `
            <tr>
              <td style="border:1px solid #ddd9d2;background:#f0ede8;font-family:Consolas,Monaco,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;width:160px;padding:10px">
                ${escapeHtml(label)}
              </td>
              <td style="border:1px solid #ddd9d2;background:#fff;font-size:14px;color:#0a0a0a;padding:10px;white-space:pre-wrap">
                ${escapeHtml(value)}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    </div>
  `
}

function notificationText(input: { email: string; reason?: string; pageUrl?: string; kitStatus: string }) {
  return [
    'AIBeat newsletter unsubscribe request',
    '',
    `Email: ${input.email}`,
    `Kit status: ${input.kitStatus}`,
    `Page URL: ${input.pageUrl || 'Not provided'}`,
    '',
    'Reason:',
    input.reason || 'No comment provided',
  ].join('\n')
}

async function sendNotification(input: { email: string; reason?: string; pageUrl?: string; kitStatus: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmails = getNotificationRecipients()

  if (!apiKey || toEmails.length === 0) {
    console.warn('Unsubscribe notification email is not configured')
    return
  }

  const fromEmail = process.env.UNSUBSCRIBE_FROM_EMAIL || process.env.SUBMISSION_FROM_EMAIL || DEFAULT_FROM_EMAIL

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmails,
      reply_to: input.email,
      subject: `[AIBeat Unsubscribe] ${input.email}`,
      html: notificationHtml(input),
      text: notificationText(input),
    }),
  })

  if (!res.ok) {
    console.error('Resend unsubscribe notification failed:', res.status, await res.text())
  }
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
      const kitStatus = 'No matching Kit subscriber found'
      await sendNotification({
        email: normalizedEmail,
        reason,
        pageUrl,
        kitStatus,
      })
      console.info('AIBeat unsubscribe requested for non-matching email:', { email: normalizedEmail, reason, pageUrl })
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

    await sendNotification({
      email: normalizedEmail,
      reason,
      pageUrl,
      kitStatus: `Unsubscribed in Kit (${subscriberId})`,
    })
    console.info('AIBeat unsubscribe requested:', { email: normalizedEmail, subscriberId, reason, pageUrl })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit unsubscribe error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Could not unsubscribe right now' }, { status: 502 })
  }
}
