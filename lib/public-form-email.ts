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
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) throw new Error('Missing RESEND_API_KEY for public form notifications.')
  const from = process.env[FROM_VARIABLES[input.kind]]?.trim()
    || process.env.SUBMISSION_FROM_EMAIL?.trim()
    || 'AIBeat <hello@aibeat.dev>'
  const response = await (input.fetchImpl ?? fetch)('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `public-form/${input.submissionId}`,
    },
    body: JSON.stringify({
      from,
      to: getPublicFormRecipients(input.kind),
      ...(input.email && EMAIL_RE.test(input.email) ? { reply_to: input.email } : {}),
      subject: SUBJECTS[input.kind],
      text: `${SUBJECTS[input.kind]}\nSubmission ID: ${input.submissionId}\n\n${JSON.stringify(input.payload, null, 2)}`,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Public form notification failed (${response.status}).`)
  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('Public form notification did not return an email ID.')
}
