export type AttributionField =
  | 'page_url'
  | 'referrer'
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'utm_content'
  | 'utm_term'

export type SourceKey =
  | 'direct'
  | 'linkedin'
  | 'reddit'
  | 'fazier'
  | 'uneed'
  | 'partner'
  | 'other'

export type NewsletterAttribution = Partial<Record<AttributionField, string>>

const FALLBACK_REFERRER = 'https://www.aibeat.dev/newsletter'
const URL_FIELDS: AttributionField[] = ['page_url', 'referrer']
const TEXT_FIELDS: AttributionField[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
const MAX_URL_LENGTH = 2048
const MAX_TEXT_LENGTH = 160

const SOURCE_TAG_ENV: Record<SourceKey, string> = {
  direct: 'KIT_TAG_SOURCE_DIRECT',
  linkedin: 'KIT_TAG_SOURCE_LINKEDIN',
  reddit: 'KIT_TAG_SOURCE_REDDIT',
  fazier: 'KIT_TAG_SOURCE_FAZIER',
  uneed: 'KIT_TAG_SOURCE_UNEED',
  partner: 'KIT_TAG_SOURCE_PARTNER',
  other: 'KIT_TAG_SOURCE_OTHER',
}

function readString(input: unknown): string | undefined {
  return typeof input === 'string' ? input.trim() : undefined
}

function sanitizeText(input: unknown): string | undefined {
  const value = readString(input)
  if (!value) return undefined
  return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, MAX_TEXT_LENGTH)
}

export function sanitizeUrl(input: unknown): string | undefined {
  const value = readString(input)
  if (!value || value.length > MAX_URL_LENGTH) return undefined

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

export function sanitizeNewsletterAttribution(input: unknown): NewsletterAttribution {
  const source = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {}
  const attribution: NewsletterAttribution = {}

  for (const field of URL_FIELDS) {
    const value = sanitizeUrl(source[field])
    if (value) attribution[field] = value
  }

  for (const field of TEXT_FIELDS) {
    const value = sanitizeText(source[field])
    if (value) attribution[field] = value
  }

  return attribution
}

export function normalizeUtmSource(source: string | undefined): string | undefined {
  const value = sanitizeText(source)?.toLowerCase()
  if (!value) return undefined
  return value.replace(/[\s-]+/g, '_')
}

export function isAIBeatUrl(url: string | undefined): boolean {
  const sanitized = sanitizeUrl(url)
  if (!sanitized) return false

  try {
    const host = new URL(sanitized).hostname.toLowerCase()
    return host === 'aibeat.dev' || host === 'www.aibeat.dev'
  } catch {
    return false
  }
}

export function getSourceKey(attribution: NewsletterAttribution): SourceKey {
  const source = normalizeUtmSource(attribution.utm_source)

  if (source === 'linkedin') return 'linkedin'
  if (source === 'reddit') return 'reddit'
  if (source === 'fazier') return 'fazier'
  if (source === 'uneed') return 'uneed'
  if (source === 'partner' || source === 'newsletter_partner' || source === 'cross_promotion') return 'partner'
  if (!source && isAIBeatUrl(attribution.page_url)) return 'direct'

  return 'other'
}

export function getSourceTagEnvName(source: SourceKey): string {
  return SOURCE_TAG_ENV[source]
}

export function getSourceTagId(env: NodeJS.ProcessEnv, source: SourceKey): string | undefined {
  return sanitizeText(env[getSourceTagEnvName(source)])
}

export function getKitReferrer(attribution: NewsletterAttribution): string {
  return attribution.page_url || attribution.referrer || FALLBACK_REFERRER
}

export function getAttributionLimits() {
  return {
    maxUrlLength: MAX_URL_LENGTH,
    maxTextLength: MAX_TEXT_LENGTH,
  }
}
