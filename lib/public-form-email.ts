import type { PublicFormKind } from './public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TO_VARIABLES: Record<PublicFormKind, string> = {
  tool_submission: 'SUBMISSION_TO_EMAIL',
  newsletter: 'NEWSLETTER_TO_EMAIL',
  unsubscribe: 'UNSUBSCRIBE_TO_EMAIL',
  business_early_access: 'BUSINESS_EARLY_ACCESS_TO_EMAIL',
}
const FROM_VARIABLES: Record<PublicFormKind, string> = {
  tool_submission: 'SUBMISSION_FROM_EMAIL',
  newsletter: 'NEWSLETTER_FROM_EMAIL',
  unsubscribe: 'UNSUBSCRIBE_FROM_EMAIL',
  business_early_access: 'BUSINESS_EARLY_ACCESS_FROM_EMAIL',
}
const SUBJECTS: Record<PublicFormKind, string> = {
  tool_submission: 'New AIBeat tool submission',
  newsletter: 'New AIBeat newsletter request',
  unsubscribe: 'AIBeat newsletter unsubscribe request',
  business_early_access: 'New AIBeat Business early access request',
}

function parseRecipients(value?: string): string[] {
  return (value || '').toLowerCase().split(/[,\s]+/).filter((email) => EMAIL_RE.test(email))
}

// Hello is mandatory. Route-specific valid recipients take precedence over the
// shared setting; blank or invalid lists fall back to the shared recipients.
export function getPublicFormRecipients(kind: PublicFormKind, env: Record<string, string | undefined> = process.env): string[] {
  const specific = parseRecipients(env[TO_VARIABLES[kind]])
  const configured = specific.length ? specific : parseRecipients(env.SUBMISSION_TO_EMAIL)
  return Array.from(new Set(['hello@aibeat.dev', ...configured]))
}

export async function sendPublicFormNotification(input: {
  kind: PublicFormKind
  email?: string
  payload: Record<string, unknown>
  submissionId: string
  fetchImpl?: typeof fetch
}) {
  const fetchImpl = input.fetchImpl ?? fetch
  const clientId = process.env.GMAIL_CLIENT_ID?.trim()
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim()
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim()
  const missing = [['GMAIL_CLIENT_ID', clientId], ['GMAIL_CLIENT_SECRET', clientSecret], ['GMAIL_REFRESH_TOKEN', refreshToken]].filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) throw new Error(`Missing production Gmail configuration: ${missing.join(', ')}. Set these in the website hosting environment; GitHub Actions secrets are separate.`)
  const tokenResponse = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, refresh_token: refreshToken!, grant_type: 'refresh_token' }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!tokenResponse.ok) throw new Error(`Gmail OAuth refresh failed (${tokenResponse.status}).`)
  const token = await tokenResponse.json() as { access_token?: string }
  if (!token.access_token) throw new Error('Gmail OAuth refresh did not return an access token.')
  const from = process.env[FROM_VARIABLES[input.kind]]?.trim()
    || process.env.SUBMISSION_FROM_EMAIL?.trim()
    || 'AIBeat <hello@aibeat.dev>'
  const cleanHeader = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()
  const text = `${SUBJECTS[input.kind]}\nSubmission ID: ${input.submissionId}\n\n${JSON.stringify(input.payload, null, 2)}`
  const mime = [
    `From: ${cleanHeader(from)}`,
    `To: ${getPublicFormRecipients(input.kind).join(', ')}`,
    ...(input.email && EMAIL_RE.test(input.email) ? [`Reply-To: ${cleanHeader(input.email)}`] : []),
    `Subject: ${SUBJECTS[input.kind]}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(text, 'utf8').toString('base64').match(/.{1,76}/g)!.join('\r\n'),
  ].join('\r\n')
  const response = await fetchImpl('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(mime, 'utf8').toString('base64url') }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { errors?: Array<{ reason?: string }> } }
    const reason = error.error?.errors?.[0]?.reason?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 80)
    throw new Error(`Public form notification failed (${response.status}${reason ? `, ${reason}` : ''}).`)
  }
  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('Public form notification did not return an email ID.')
  return result.id
}
