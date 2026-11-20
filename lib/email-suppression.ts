// Backend/CLI only: node:crypto also prevents inclusion in a browser bundle.
import { createHash } from 'node:crypto'

export type SuppressionFailureCode = 'missing_configuration' | 'invalid_url' | 'credentials_rejected' | 'migration_unavailable' | 'database_unavailable' | 'invalid_response'
const failureGuidance: Record<SuppressionFailureCode, string> = {
  missing_configuration: 'Configure the EMAIL_SUPPRESSION_SUPABASE_URL Actions variable and EMAIL_SUPPRESSION_SERVICE_ROLE_KEY secret.',
  invalid_url: 'EMAIL_SUPPRESSION_SUPABASE_URL must be the verified HTTPS Supabase project URL.',
  credentials_rejected: 'The suppression backend credential was rejected. Verify its project pairing and RPC permission.',
  migration_unavailable: 'The suppression RPC was not found. Verify the target project and apply the reviewed suppression migration before retrying.',
  database_unavailable: 'The suppression service could not be reached or returned an error. Retry only after verifying service availability.',
  invalid_response: 'The suppression RPC returned an unexpected response. Verify the reviewed migration and backend configuration.',
}
export class SuppressionUnavailableError extends Error {
  constructor(public readonly code: SuppressionFailureCode = 'database_unavailable') {
    super('Marketing suppression could not be verified; operation blocked. [' + code + '] ' + failureGuidance[code])
    this.name = 'SuppressionUnavailableError'
  }
}
export class RecipientSuppressedError extends Error {
  constructor() { super('Marketing recipient is suppressed; operation blocked.'); this.name = 'RecipientSuppressedError' }
}
export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email) || email.length > 254) {
    throw new Error('A single valid email address is required.')
  }
  return email
}
// Logs may identify an operation without exposing its recipient.
export const recipientReference = (email: string) => createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 12)
export interface SuppressionGuard {
  blocked(emails: string[]): Promise<Set<string>>
  assertAllowed(emails: string[]): Promise<void>
}
export class EmailSuppressionService implements SuppressionGuard {
  constructor(private options: { env?: Readonly<Record<string, string | undefined>>; fetchImpl?: typeof fetch } = {}) {}
  private config() {
    if (typeof window !== 'undefined') throw new SuppressionUnavailableError()
    const env = this.options.env ?? process.env
    // Deliberately no NEXT_PUBLIC or Business database fallback.
    const url = env.EMAIL_SUPPRESSION_SUPABASE_URL?.replace(/\/$/, '')
    const key = env.EMAIL_SUPPRESSION_SERVICE_ROLE_KEY?.trim()
    if (!url || !key) throw new SuppressionUnavailableError('missing_configuration')
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new SuppressionUnavailableError('invalid_url')
    return { url, key }
  }
  async rpc(name: 'check_marketing_recipients' | 'list_marketing_suppressions' | 'record_email_unsubscribe' | 'claim_unsubscribe_automation' | 'step_unsubscribe_automation', body: Record<string, unknown>): Promise<unknown> {
    const { url, key } = this.config()
    try {
      const r = await (this.options.fetchImpl ?? fetch)(`${url}/rest/v1/rpc/${name}`, {
        method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) {
        const code = r.status === 401 || r.status === 403 ? 'credentials_rejected' : r.status === 404 ? 'migration_unavailable' : 'database_unavailable'
        throw new SuppressionUnavailableError(code)
      }
      try { return await r.json() } catch { throw new SuppressionUnavailableError('invalid_response') }
    } catch (error) {
      if (error instanceof SuppressionUnavailableError) throw error
      throw new SuppressionUnavailableError()
    }
  }
  async blocked(emails: string[]) {
    const normalized = Array.from(new Set(emails.map(normalizeEmail)))
    const blocked = new Set<string>()
    // No cache: each boundary obtains a fresh committed database decision.
    for (let i = 0; i < normalized.length; i += 200) {
      const batch = normalized.slice(i, i + 200)
      const result = await this.rpc('check_marketing_recipients', { recipient_emails: batch })
      if (!Array.isArray(result) || result.some(e => typeof e !== 'string' || !batch.includes(e))) throw new SuppressionUnavailableError('invalid_response')
      for (const email of result) blocked.add(email)
    }
    return blocked
  }
  async assertAllowed(emails: string[]) {
    if ((await this.blocked(emails)).size) throw new RecipientSuppressedError()
  }
  async list() {
    const all = new Set<string>()
    for (let offset = 0; ; offset += 500) {
      const page = await this.rpc('list_marketing_suppressions', { page_offset: offset })
      if (!Array.isArray(page) || page.length > 500 || page.some(e => typeof e !== 'string')) throw new SuppressionUnavailableError()
      for (const email of page) all.add(normalizeEmail(email))
      if (page.length < 500) return all
    }
  }
  async unsubscribe(email: string, payload: Record<string, unknown>) {
    const normalized = normalizeEmail(email)
    const id = await this.rpc('record_email_unsubscribe', { submission_email: normalized, submission_payload: { ...payload, email: normalized } })
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new SuppressionUnavailableError()
    return id
  }
}
export async function filterMarketingRecipients<T>(rows: T[], email: (row: T) => string, guard: SuppressionGuard = new EmailSuppressionService()): Promise<T[]> {
  const blocked = await guard.blocked(rows.map(email))
  return rows.filter(row => !blocked.has(normalizeEmail(email(row))))
}
// Every delivery adapter must call this AFTER preparing its request and again on retries.
// Transactional exemptions are purpose-specific, never a caller-supplied marketing=false flag.
export type EmailPurpose = 'marketing' | 'password-reset' | 'security-notification' | 'internal-form-notification' | 'submission-confirmation'
export async function deliverEmail<T>(purpose: EmailPurpose, recipients: string[], send: () => Promise<T>, guard: SuppressionGuard = new EmailSuppressionService()): Promise<T> {
  const normalized = recipients.map(normalizeEmail)
  if (!['password-reset', 'security-notification', 'internal-form-notification', 'submission-confirmation'].includes(purpose)) await guard.assertAllowed(normalized)
  return send()
}
