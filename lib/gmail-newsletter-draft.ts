import type { LatestNewsNewsletter } from './latest-news-newsletter'

const GMAIL_COMPOSE_SCOPE = 'https://www.googleapis.com/auth/gmail.compose'

export interface GmailDraftConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  to: string
  fromName?: string
  fromEmail: string
}

export interface GmailDraftMessage {
  to: string
  subject: string
  plainText: string
  html: string
  key: string
}

export async function createGmailNewsletterDraft(input: { newsletter: LatestNewsNewsletter; config: GmailDraftConfig; fetchImpl?: typeof fetch }) {
  const key = newsletterDraftKey(input.newsletter)
  return createGmailDraft({
    message: { to: input.config.to, subject: input.newsletter.subject, plainText: input.newsletter.plainText, html: input.newsletter.html, key },
    config: input.config,
    fetchImpl: input.fetchImpl,
  })
}

export async function createGmailDraft(input: { message: GmailDraftMessage; config: GmailDraftConfig; fetchImpl?: typeof fetch }) {
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = await refreshGmailAccessToken(input.config, fetchImpl)
  const existingDraftId = await findExistingDraft(accessToken, input.message.key, fetchImpl)
  if (existingDraftId) return { created: false as const, draftId: existingDraftId, duplicate: true as const }

  const raw = buildGenericMimeMessage(input.message, input.config)
  const response = await fetchImpl('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: base64UrlEncode(raw) } }),
  })
  if (!response.ok) throw new Error(`Gmail draft creation failed (${response.status}): ${(await response.text()).slice(0, 240)}`)
  const result = await response.json() as { id?: string }
  if (!result.id) throw new Error('Gmail draft creation response did not include a draft ID.')
  return { created: true as const, draftId: result.id, duplicate: false as const }
}

export function getGmailDraftConfig(env: Readonly<Record<string, string | undefined>> = process.env): GmailDraftConfig {
  const config = {
    clientId: env.GMAIL_CLIENT_ID?.trim() ?? '',
    clientSecret: env.GMAIL_CLIENT_SECRET?.trim() ?? '',
    refreshToken: env.GMAIL_REFRESH_TOKEN?.trim() ?? '',
    to: env.GMAIL_DRAFT_TO?.trim() ?? '',
    fromName: env.GMAIL_FROM_NAME?.trim() || 'AIBeat',
    fromEmail: env.GMAIL_FROM_EMAIL?.trim() ?? '',
  }
  const missing = Object.entries(config).filter(([key, value]) => key !== 'fromName' && !value).map(([key]) => key)
  if (missing.length) throw new Error(`Missing Gmail draft configuration: ${missing.join(', ')}`)
  return config
}

export function newsletterDraftKey(newsletter: LatestNewsNewsletter) {
  return `aibeat-weekly-${newsletter.selectedArticles.map((article) => article.slug).join('-')}`.slice(0, 180)
}

export function buildMimeMessage(newsletter: LatestNewsNewsletter, config: Pick<GmailDraftConfig, 'to' | 'fromName' | 'fromEmail'>, newsletterKey = newsletterDraftKey(newsletter)) {
  return buildGenericMimeMessage({ to: config.to, subject: newsletter.subject, plainText: newsletter.plainText, html: newsletter.html, key: newsletterKey }, config)
}

export function buildGenericMimeMessage(message: GmailDraftMessage, config: Pick<GmailDraftConfig, 'fromName' | 'fromEmail'>) {
  const boundary = `aibeat_${message.key.replace(/[^a-z0-9]/gi, '_')}`
  return [
    `To: ${sanitizeHeader(message.to)}`,
    `From: ${sanitizeHeader(config.fromName || 'AIBeat')} <${sanitizeHeader(config.fromEmail)}>`,
    `Subject: ${encodeMimeHeader(message.subject)}`,
    `X-AIBeat-Newsletter-Key: ${sanitizeHeader(message.key)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(message.plainText, 'utf8').toString('base64'),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(message.html, 'utf8').toString('base64'),
    `--${boundary}--`,
  ].join('\r\n')
}

async function refreshGmailAccessToken(config: GmailDraftConfig, fetchImpl: typeof fetch) {
  const body = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: config.refreshToken, grant_type: 'refresh_token' })
  const response = await fetchImpl('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error(`Gmail OAuth refresh failed (${response.status}): ${(await response.text()).slice(0, 240)}`)
  const result = await response.json() as { access_token?: string; scope?: string }
  if (!result.access_token) throw new Error('Gmail OAuth refresh response did not include an access token.')
  if (result.scope && !result.scope.split(' ').includes(GMAIL_COMPOSE_SCOPE)) throw new Error('Gmail OAuth token is missing the gmail.compose scope.')
  return result.access_token
}

async function findExistingDraft(accessToken: string, newsletterKey: string, fetchImpl: typeof fetch) {
  const list = await fetchImpl('https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=50', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!list.ok) throw new Error(`Gmail draft list failed (${list.status}): ${(await list.text()).slice(0, 240)}`)
  const listed = await list.json() as { drafts?: Array<{ id?: string }> }
  for (const draft of listed.drafts ?? []) {
    if (!draft.id) continue
    const response = await fetchImpl(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${encodeURIComponent(draft.id)}?format=metadata&metadataHeaders=X-AIBeat-Newsletter-Key`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) continue
    const detail = await response.json() as { message?: { payload?: { headers?: Array<{ name?: string; value?: string }> } } }
    const match = detail.message?.payload?.headers?.some((header) => header.name?.toLowerCase() === 'x-aibeat-newsletter-key' && header.value === newsletterKey)
    if (match) return draft.id
  }
  return undefined
}

function sanitizeHeader(value: string) { return value.replace(/[\r\n]+/g, ' ').trim() }
function encodeMimeHeader(value: string) { return `=?UTF-8?B?${Buffer.from(sanitizeHeader(value), 'utf8').toString('base64')}?=` }
function base64UrlEncode(value: string) { return Buffer.from(value, 'utf8').toString('base64url') }
