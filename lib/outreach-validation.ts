import type { OutreachConsentStatus, OutreachContactType, OutreachLead, OutreachPriority, OutreachStatus } from './outreach-types'

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i
const BLOCKED_CONTACT_TYPES: OutreachContactType[] = ['privacy', 'legal', 'security', 'abuse', 'dpo', 'no-reply', 'noreply']
const BLOCKED_LOCAL_PARTS = ['privacy', 'legal', 'security', 'abuse', 'dpo', 'no-reply', 'noreply']
const TERMINAL_STATUSES: OutreachStatus[] = ['bounced', 'declined', 'replied', 'interested', 'unsubscribed', 'suppressed']

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email))
}

export function sanitizeText(value: unknown, max = 500): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F]/g, '')
  return trimmed ? trimmed.slice(0, max) : undefined
}

export function sanitizeUrl(value: unknown): string | undefined {
  const text = sanitizeText(value, 2048)
  if (!text) return undefined
  try {
    const url = new URL(text)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

export function sanitizeDate(value: unknown): string | undefined {
  const text = sanitizeText(value, 32)
  if (!text) return undefined
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

export function isBlockedContact(input: { email: string; contact_type: OutreachContactType }): boolean {
  if (BLOCKED_CONTACT_TYPES.includes(input.contact_type)) return true
  const local = normalizeEmail(input.email).split('@')[0]
  return BLOCKED_LOCAL_PARTS.includes(local)
}

export function canSyncLead(lead: OutreachLead): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!lead.approved_for_outreach) errors.push('This lead has not been approved.')
  if (lead.consent_status !== 'confirmed' && lead.consent_status !== 'legitimate_business_interest_reviewed') errors.push('Consent or legitimate business interest review is required.')
  if (lead.suppressed_at) errors.push('This address is on the suppression list.')
  if (lead.unsubscribed_at) errors.push('This lead is unsubscribed.')
  if (TERMINAL_STATUSES.includes(lead.status)) errors.push(`Lead status blocks outreach: ${lead.status}.`)
  if (isBlockedContact(lead)) errors.push('This contact type/address is blocked for outreach.')
  if (!lead.source) errors.push('Source is required.')
  if (!lead.public_contact_source_url) errors.push('Public contact source URL is required.')
  if (!lead.lawful_basis) errors.push('Lawful basis is required.')
  return { ok: errors.length === 0, errors }
}

export function validateFutureSendAt(sendAt: string, now = new Date()): { ok: boolean; error?: string } {
  const date = new Date(sendAt)
  if (Number.isNaN(date.getTime())) return { ok: false, error: 'send_at must be a valid ISO-8601 timestamp.' }
  if (date.getTime() < now.getTime() + 5 * 60 * 1000) return { ok: false, error: 'send_at must be at least five minutes in the future.' }
  return { ok: true }
}

function enumValue<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? value as T : fallback
}

export function makeLead(input: Record<string, unknown>, now = new Date()): { lead?: OutreachLead; errors: string[] } {
  const errors: string[] = []
  const email = normalizeEmail(String(input.email || ''))
  if (!isValidEmail(email)) errors.push('Valid email is required.')
  const toolName = sanitizeText(input.tool_name, 160)
  if (!toolName) errors.push('Tool name is required.')
  const source = sanitizeText(input.source, 160) || 'Product Hunt'
  const sourceUrl = sanitizeUrl(input.public_contact_source_url)
  if (!sourceUrl) errors.push('Public contact source URL is required and must be a valid URL.')
  const lawfulBasis = sanitizeText(input.lawful_basis, 300)
  if (!lawfulBasis) errors.push('Lawful basis is required.')

  const contactType = enumValue(String(input.contact_type || ''), ['general_business', 'partnerships', 'press', 'sales', 'support', 'founder_public', 'privacy', 'legal', 'security', 'abuse', 'dpo', 'no-reply', 'noreply', 'unknown'] as const, 'unknown')
  const priority = enumValue(String(input.priority || ''), ['high', 'medium', 'low'] as const, 'medium')
  const consentStatus = enumValue(String(input.consent_status || 'unknown'), ['confirmed', 'legitimate_business_interest_reviewed', 'unknown', 'rejected'] as const, 'unknown')
  const timestamp = now.toISOString()

  if (isBlockedContact({ email, contact_type: contactType })) errors.push('Blocked privacy/legal/security/no-reply contact type.')
  if (errors.length > 0 || !toolName || !sourceUrl || !lawfulBasis) return { errors }

  return {
    errors,
    lead: {
      id: `lead_${Buffer.from(email).toString('base64url').slice(0, 16)}`,
      email,
      first_name: sanitizeText(input.first_name, 80),
      last_name: sanitizeText(input.last_name, 80),
      founder_name: sanitizeText(input.founder_name, 120),
      company_name: sanitizeText(input.company_name, 160),
      tool_name: toolName,
      website_url: sanitizeUrl(input.website_url),
      product_hunt_url: sanitizeUrl(input.product_hunt_url),
      launch_date: sanitizeDate(input.launch_date),
      category: sanitizeText(input.category, 160),
      contact_type: contactType,
      source,
      public_contact_source_url: sourceUrl,
      personalized_opening: sanitizeText(input.personalized_opening, 1000),
      status: 'new',
      priority,
      consent_status: consentStatus,
      lawful_basis: lawfulBasis,
      approved_for_outreach: false,
      created_at: timestamp,
      updated_at: timestamp,
    },
  }
}
