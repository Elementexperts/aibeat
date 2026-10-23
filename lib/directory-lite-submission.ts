// Pure local validation only. No persistence, identity verification, duplicate lookup or URL fetching.
export const DIRECTORY_LITE_SUBMISSION_CATEGORIES = Object.freeze([
  'AI Writing', 'AI Image', 'AI Video', 'AI Audio', 'AI Agents', 'Developer Tools',
  'Productivity', 'Marketing', 'Education', 'Design', 'Business',
] as const)

export type DirectoryLiteSubmissionCategory = typeof DIRECTORY_LITE_SUBMISSION_CATEGORIES[number]
export type DirectoryLiteSubmissionField = 'name' | 'url' | 'shortDescription' | 'category' | 'email'
export type DirectoryLiteSubmission = {
  name: string
  url: string
  shortDescription: string
  category: DirectoryLiteSubmissionCategory
  email: string
  consent: true
}
export type DirectoryLiteSubmissionErrorCode =
  | 'INVALID_STRUCTURE' | 'UNEXPECTED_FIELDS' | 'REQUIRED' | 'INVALID_TYPE'
  | 'INVALID_LENGTH' | 'INVALID_TEXT' | 'INVALID_URL' | 'INVALID_EMAIL'
  | 'INVALID_CATEGORY' | 'CONSENT_REQUIRED'
export type DirectoryLiteSubmissionErrors = Partial<Record<
  DirectoryLiteSubmissionField | 'consent' | 'form', DirectoryLiteSubmissionErrorCode
>>
export type DirectoryLiteSubmissionResult =
  | { ok: true; value: DirectoryLiteSubmission }
  | { ok: false; errors: DirectoryLiteSubmissionErrors }

const FIELDS: readonly DirectoryLiteSubmissionField[] = ['name', 'url', 'shortDescription', 'category', 'email']
// Lengths use UTF-16 code units, matching Nitro 1A's string.length contract.
const LIMITS: Record<DirectoryLiteSubmissionField, readonly [number, number]> = {
  name: [2, 100], url: [1, 2048], shortDescription: [10, 280], category: [1, 15], email: [1, 254],
}
const INVALID_TEXT = /[<>\x00-\x1f\x7f-\x9f]/
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i

function normalizedWebsite(raw: string): string | undefined {
  if (!/^https:\/\//i.test(raw) || /[\\\s]/.test(raw)) return undefined
  // Reject even empty user-info delimiters; URL.username alone cannot detect those.
  if (raw.slice(8).split(/[/?#]/, 1)[0].includes('@')) return undefined
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase().replace(/\.$/, '')
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        host.length > 253 || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') ||
        /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host) ||
        !host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) return undefined
    url.hostname = host
    url.hash = ''
    return url.href.length <= LIMITS.url[1] ? url.href : undefined
  } catch {
    return undefined
  }
}

export function validateDirectoryLiteSubmission(input: unknown): DirectoryLiteSubmissionResult {
  const values: Record<string, unknown> = {}
  // Accept JSON-style own data properties, including null-prototype records. Never read getters.
  // Reflection can still invoke Proxy traps: this is not a sandbox for hostile JavaScript objects.
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return { ok: false, errors: { form: 'INVALID_STRUCTURE' } }
    }
    const prototype = Object.getPrototypeOf(input)
    if (prototype !== Object.prototype && prototype !== null) {
      return { ok: false, errors: { form: 'INVALID_STRUCTURE' } }
    }
    const keys = Reflect.ownKeys(input)
    if (keys.some(key => typeof key !== 'string' ||
      (key !== 'consent' && !(FIELDS as readonly string[]).includes(key)))) {
      return { ok: false, errors: { form: 'UNEXPECTED_FIELDS' } }
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key)
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
        return { ok: false, errors: { form: 'INVALID_STRUCTURE' } }
      }
      values[key as string] = descriptor.value as unknown
    }
  } catch {
    // Never return exception details, property names or submitted values.
    return { ok: false, errors: { form: 'INVALID_STRUCTURE' } }
  }

  const errors: DirectoryLiteSubmissionErrors = {}
  const normalized: Record<DirectoryLiteSubmissionField, string> = {
    name: '', url: '', shortDescription: '', category: '', email: '',
  }
  for (const field of FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(values, field)) {
      errors[field] = 'REQUIRED'
      continue
    }
    const raw = values[field]
    if (typeof raw !== 'string') {
      errors[field] = 'INVALID_TYPE'
      continue
    }
    if (INVALID_TEXT.test(raw)) {
      errors[field] = 'INVALID_TEXT'
      continue
    }
    const value = raw.trim()
    const [min, max] = LIMITS[field]
    if (!value) errors[field] = 'REQUIRED'
    else if (value.length < min || value.length > max) errors[field] = 'INVALID_LENGTH'
    else normalized[field] = value
  }

  if (!errors.url) {
    const url = normalizedWebsite(normalized.url)
    if (url === undefined) errors.url = 'INVALID_URL'
    else normalized.url = url
  }
  if (!errors.category && !(DIRECTORY_LITE_SUBMISSION_CATEGORIES as readonly string[]).includes(normalized.category)) {
    errors.category = 'INVALID_CATEGORY'
  }
  if (!errors.email) {
    normalized.email = normalized.email.toLowerCase()
    const local = normalized.email.split('@', 1)[0]
    if (!EMAIL.test(normalized.email) || local.startsWith('.') || local.endsWith('.') || normalized.email.includes('..')) {
      errors.email = 'INVALID_EMAIL'
    }
  }
  if (!Object.prototype.hasOwnProperty.call(values, 'consent') || values.consent !== true) {
    errors.consent = 'CONSENT_REQUIRED'
  }
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, value: {
    ...normalized, category: normalized.category as DirectoryLiteSubmissionCategory, consent: true,
  } }
}
