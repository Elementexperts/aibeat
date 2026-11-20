import { createHash, randomUUID } from 'node:crypto'
import { EmailSuppressionService, normalizeEmail, SuppressionUnavailableError } from './email-suppression'
import { buildGenericMimeMessage } from './gmail-newsletter-draft'

export const UNSUBSCRIBE_LABEL = 'AIBeat/Unsubscribed - Do Not Contact'
export const MAILBOX = 'hello@aibeat.dev'
type DraftStatus = 'pending' | 'creating' | 'created' | 'skipped' | 'review'
export type Job = { email: string; draft_status: DraftStatus; gmail_draft_id?: string; complaint: boolean }
export interface Ledger {
  claim(token: string): Promise<Job | null>
  step(token: string, email: string, operation: string, details?: Record<string, unknown>): Promise<{ complaint: boolean; draft_status: DraftStatus }>
}
export interface UnsubscribeMailbox {
  verify(): Promise<void>
  label(email: string, fence: () => Promise<void>): Promise<'done' | 'skipped'>
  findDraft(email: string): Promise<{ id?: string; uncertain?: boolean }>
  createDraft(email: string): Promise<string>
}
export class UnsubscribeLedger implements Ledger {
  constructor(private db = new EmailSuppressionService()) {}
  async claim(token: string) {
    const result = await this.db.rpc('claim_unsubscribe_automation', { worker_token: token }) as Job | null
    if (result === null) return null
    if (!result || typeof result.email !== 'string' || typeof result.complaint !== 'boolean' ||
      !['pending','creating','created','skipped','review'].includes(result.draft_status)) throw new SuppressionUnavailableError()
    return { ...result, email: normalizeEmail(result.email) }
  }
  async step(token: string, email: string, operation: string, details: Record<string, unknown> = {}) {
    const result = await this.db.rpc('step_unsubscribe_automation', { worker_token: token, contact_email: email, operation, details }) as { complaint: boolean; draft_status: DraftStatus }
    if (!result || typeof result.complaint !== 'boolean' || !['pending','creating','created','skipped','review'].includes(result.draft_status)) throw new SuppressionUnavailableError()
    return result
  }
}
export function confirmationMessage(email: string) {
  const subject = 'Your AIBeat unsubscribe request is confirmed'
  const paragraphs = [
    'Your unsubscribe request has been recorded. Your address is suppressed from AIBeat newsletters, outreach and promotional email. No further action is needed.',
    'Essential account or security messages, if applicable, are separate from marketing.',
    'Optional: what was the main reason you unsubscribed? You may reply with one answer: Never subscribed; Too many emails; Content was not relevant; No longer interested; Other. You do not need to reply.',
    'Thank you,\nAIBeat',
  ]
  // Same 580px, text-branding design as the local submission template. No submission
  // status is reused: unsubscribe is not a tool submission or a promotional message.
  const html = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head><body style="margin:0;background:#eef1f7;font:16px/1.6 Arial,sans-serif;color:#20283b"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px"><!--[if mso]><table width="580" role="presentation"><tr><td><![endif]--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff"><tr><td style="padding:24px;background:#15192c;color:#fff;font-size:26px;font-weight:bold">AI<span style="color:#bdabff">Beat</span></td></tr><tr><td style="padding:24px"><h1 style="font-size:24px">You are unsubscribed</h1>' + paragraphs.map(p => '<p>' + p.replace(/\n/g,'<br>') + '</p>').join('') + '</td></tr><tr><td style="padding:16px 24px;background:#f8f9fc;font-size:12px">AIBeat В· Email preferences В· hello@aibeat.dev</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>'
  return { to: normalizeEmail(email), subject, plainText: paragraphs.join('\n\n'), html, key: confirmationKey(email) }
}
export function confirmationKey(email: string) {
  return 'aibeat-unsubscribe-v1-' + createHash('sha256').update(normalizeEmail(email)).digest('hex')
}
export class GmailUnavailable extends Error { constructor() { super('Gmail operation unavailable'); this.name = 'GmailUnavailable' } }
export function headerHasRecipient(value: string, email: string) {
  // Do not mistake an address appearing in a quoted display name for a mailbox.
  const parts: string[] = []; let part = '', quoted = false, escaped = false
  for (const char of value) {
    if (escaped) { part += char; escaped = false; continue }
    if (char === '\\' && quoted) { escaped = true; part += char; continue }
    if (char === '"') quoted = !quoted
    if (char === ',' && !quoted) { parts.push(part); part = '' } else part += char
  }
  if (quoted) return false
  parts.push(part)
  return parts.some(p => {
    const angle = p.match(/^[^<>]*<([^<>]+)>\s*$/)
    try { return normalizeEmail(angle ? angle[1] : p.trim()) === normalizeEmail(email) } catch { return false }
  })
}
export class GmailUnsubscribeMailbox implements UnsubscribeMailbox {
  private token = ''
  constructor(private env: Readonly<Record<string, string | undefined>> = process.env, private fetchImpl: typeof fetch = fetch) {}
  // Explicit method/path allowlist; no send, delete, trash, thread-wide modification
  // or arbitrary URLs. Deliberately no retry of draft POST, including HTTP 429/5xx.
  async request(path: string, method = 'GET', body?: unknown): Promise<any> {
    const base = path.split('?')[0]
    const allowed = method === 'GET' ? /^(profile|labels|messages|messages\/[a-zA-Z0-9_-]+|drafts|drafts\/[a-zA-Z0-9_-]+)$/.test(base)
      : method === 'POST' && /^(messages\/[a-zA-Z0-9_-]+\/modify|drafts)$/.test(base)
    if (!allowed || !this.token) throw new GmailUnavailable()
    try {
      const response = await this.fetchImpl('https://gmail.googleapis.com/gmail/v1/users/me/' + path, {
        method, headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new GmailUnavailable()
      return await response.json()
    } catch { throw new GmailUnavailable() }
  }
  async verify() {
    const { GMAIL_CLIENT_ID: client, GMAIL_CLIENT_SECRET: secret, UNSUBSCRIBE_GMAIL_REFRESH_TOKEN: refresh } = this.env
    if (!client || !secret || !refresh) throw new GmailUnavailable()
    try {
      const r = await this.fetchImpl('https://oauth2.googleapis.com/token', { method: 'POST',
        body: new URLSearchParams({ client_id: client, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' }),
        redirect: 'error', signal: AbortSignal.timeout(15000) })
      if (!r.ok) throw new GmailUnavailable()
      const data = await r.json()
      if (!data.access_token || (data.scope && !data.scope.split(' ').includes('https://www.googleapis.com/auth/gmail.modify'))) throw new GmailUnavailable()
      this.token = data.access_token
      const profile = await this.request('profile')
      if (profile.emailAddress?.toLowerCase() !== MAILBOX) throw new GmailUnavailable()
    } catch { this.token = ''; throw new GmailUnavailable() }
  }
  private async pages(path: string, field: string) {
    const all: any[] = []; const seen = new Set<string>(); let token = ''
    do {
      const data = await this.request(path + (token ? '&pageToken=' + encodeURIComponent(token) : ''))
      if (data[field] !== undefined && !Array.isArray(data[field])) throw new GmailUnavailable()
      all.push(...(data[field] ?? []))
      token = data.nextPageToken ?? ''
      if (typeof token !== 'string' || (token && seen.has(token)) || all.length > 1000) throw new GmailUnavailable()
      seen.add(token)
    } while (token)
    return all
  }
  async label(email: string, fence: () => Promise<void>) {
    email = normalizeEmail(email)
    if (email === MAILBOX) throw new GmailUnavailable()
    const labels = await this.request('labels')
    const matches = labels.labels?.filter((l: any) => l.name === UNSUBSCRIBE_LABEL) ?? []
    if (matches.length !== 1 || !matches[0].id) throw new GmailUnavailable() // Existing label only.
    const labelId = matches[0].id
    const q = '{from:' + email + ' to:' + email + ' cc:' + email + ' bcc:' + email + '} -in:spam -in:trash -in:drafts'
    const messages = await this.pages('messages?maxResults=100&includeSpamTrash=false&q=' + encodeURIComponent(q), 'messages')
    let relevant = 0
    for (const message of messages) {
      if (!/^[a-zA-Z0-9_-]+$/.test(message.id ?? '')) throw new GmailUnavailable()
      const detail = await this.request('messages/' + message.id + '?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc')
      if (detail.labelIds?.some((l: string) => ['SPAM','TRASH','DRAFT'].includes(l))) continue
      const headers = detail.payload?.headers ?? []
      // Gmail search may expand aliases; verify exact participants before any mutation.
      const matchesRecipient = headers.some((h: any) => ['from','to','cc','bcc'].includes(h.name?.toLowerCase()) && headerHasRecipient(String(h.value), email))
      if (!matchesRecipient) continue
      relevant++
      if (detail.labelIds?.includes(labelId)) continue
      await fence()
      await this.request('messages/' + message.id + '/modify', 'POST', { addLabelIds: [labelId] })
    }
    return relevant ? 'done' as const : 'skipped' as const
  }
  async findDraft(email: string) {
    const key = confirmationKey(email)
    const q = encodeURIComponent('rfc822msgid:' + key + '@aibeat.dev')
    const messages = await this.pages('messages?maxResults=100&includeSpamTrash=true&q=' + q, 'messages')
    const drafts = await this.pages('drafts?maxResults=100&q=' + q, 'drafts')
    if (drafts.length > 1) return { uncertain: true }
    if (drafts.length === 1) {
      const id = drafts[0].id
      if (!/^[a-zA-Z0-9_-]+$/.test(id ?? '')) throw new GmailUnavailable()
      const detail = await this.request('drafts/' + id + '?format=metadata&metadataHeaders=X-AIBeat-Newsletter-Key&metadataHeaders=To')
      const headers = detail.message?.payload?.headers ?? []
      if (!headers.some((h: any) => h.name?.toLowerCase() === 'x-aibeat-newsletter-key' && h.value === key) ||
          !headers.some((h: any) => h.name?.toLowerCase() === 'to' && h.value?.trim().toLowerCase() === normalizeEmail(email))) return { uncertain: true }
      return { id }
    }
    if (messages.length > 0) return { uncertain: true }
    // Older/manual confirmations may predate our marker. Never create another
    // when the exact subject and recipient already exist, including sent/trash.
    const legacyQuery = encodeURIComponent('in:anywhere to:' + normalizeEmail(email) + ' subject:"Your AIBeat unsubscribe request is confirmed"')
    const legacy = await this.pages('messages?maxResults=100&includeSpamTrash=true&q=' + legacyQuery, 'messages')
    for (const item of legacy) {
      if (!/^[a-zA-Z0-9_-]+$/.test(item.id ?? '')) throw new GmailUnavailable()
      const detail = await this.request('messages/' + item.id + '?format=metadata&metadataHeaders=To&metadataHeaders=Subject')
      const headers = detail.payload?.headers ?? []
      if (headers.some((h: any) => h.name?.toLowerCase() === 'to' && headerHasRecipient(String(h.value), email)) &&
          headers.some((h: any) => h.name?.toLowerCase() === 'subject' && h.value === 'Your AIBeat unsubscribe request is confirmed')) return { uncertain: true }
    }
    return { uncertain: false }
  }
  async createDraft(email: string) {
    const message = confirmationMessage(email)
    const mime = buildGenericMimeMessage(message, { fromName: 'AIBeat', fromEmail: MAILBOX })
      .replace(/^Message-ID:.*$/m, 'Message-ID: <' + message.key + '@aibeat.dev>')
    const result = await this.request('drafts', 'POST', { message: { raw: Buffer.from(mime).toString('base64url') } })
    if (!/^[a-zA-Z0-9_-]{1,200}$/.test(result.id ?? '')) throw new GmailUnavailable()
    return result.id as string
  }
}
export async function reconcileUnsubscribes(input: { ledger: Ledger; gmail: UnsubscribeMailbox; limit?: number; drafts: boolean; repair: boolean }) {
  const summary = { processed: 0, drafts: 0, skipped: 0, review: 0, failed: 0 }
  await input.gmail.verify() // Verify hello@ mailbox before claiming any work.
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100)
  for (let n=0; n<limit; n++) {
    const token = randomUUID()
    const job = await input.ledger.claim(token) // On DB failure stop the entire run.
    if (!job) break
    const step = (op: string, details?: Record<string, unknown>) => input.ledger.step(token, job.email, op, details)
    try {
      await step('verify', { repair: input.repair })
      const labeling = await input.gmail.label(job.email, async () => { await step('heartbeat') })
      await step('label', { status: labeling })
      const current = await step('heartbeat')
      let state = current.draft_status
      if (current.complaint) {
        // A later complaint never causes creation or modification of a survey.
        state = ['creating','created','review'].includes(state) ? 'review' : 'skipped'
        await step('draft', { status: state })
      } else if (state === 'pending' || state === 'creating' || state === 'review') {
        const found = await input.gmail.findDraft(job.email)
        if (found.id) {
          if (state === 'pending') await step('reserve')
          await step('draft', { status: 'created', id: found.id }); state = 'created'
        } else if (found.uncertain || state !== 'pending') {
          await step('draft', { status: 'review' }); state = 'review'
        } else if (!input.drafts) {
          await step('draft', { status: 'skipped' }); state = 'skipped'
        } else {
          const reserved = await step('reserve') // Durable reservation BEFORE external POST.
          state = reserved.draft_status
          if (!reserved.complaint && state === 'creating') {
            const id = await input.gmail.createDraft(job.email)
            await step('draft', { status: 'created', id }); state = 'created'; summary.drafts++
          }
        }
      }
      await step('finish')
      summary.processed++
      if (state === 'review') summary.review++
      if (state === 'skipped') summary.skipped++
    } catch (error) {
      summary.failed++
      await step('fail', { code: error instanceof GmailUnavailable ? 'gmail_unavailable' : error instanceof SuppressionUnavailableError ? 'database_unavailable' : 'processing_failed' })
      // Unknown DB state must stop this run. Gmail retries occur on a later claim.
      if (!(error instanceof GmailUnavailable)) throw new Error('Unsubscribe reconciliation stopped; inspect private ledger.')
    }
  }
  return summary
}
