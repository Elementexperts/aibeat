import type { RedditPostDraft, ValidationResult } from './types'

const SHORTENED_URLS = [
  'bit.ly',
  't.co',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'cutt.ly',
  'rebrand.ly',
]

const AGGRESSIVE_PROMO = [
  'guaranteed results',
  'number one',
  '#1',
  'best in the world',
  'must buy',
  'limited time offer',
  'act now',
]

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0
}

function repeatedParagraphs(body: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim().toLowerCase())
    .filter((paragraph) => paragraph.length > 30)
  return new Set(paragraphs).size !== paragraphs.length
}

export function validateRedditPost(draft: RedditPostDraft): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const body = draft.body.trim()
  const title = draft.title.trim()
  const combined = `${title}\n${body}`.toLowerCase()

  if (!title) errors.push('Title is empty')
  if (!body) errors.push('Body is empty')
  if (!draft.subreddit.trim()) errors.push('Target subreddit is missing')
  if (title.length > 300) errors.push('Reddit title is longer than 300 characters')

  const aiBeatLinkCount = countMatches(combined, /https?:\/\/(www\.)?aibeat\.dev|aibeat\.dev/g)
  if (aiBeatLinkCount > 1) errors.push('Post includes more than one AIBeat.dev promotional link')

  const linkCount = countMatches(body, /https?:\/\/\S+/g)
  if (linkCount > 8) warnings.push('Post contains many links')

  if (repeatedParagraphs(body)) errors.push('Post contains repeated paragraphs')

  if (SHORTENED_URLS.some((domain) => combined.includes(domain))) {
    errors.push('Post contains suspicious shortened URLs')
  }

  if (/\?[^)\s]*(ref=|aff=|affiliate|utm_content=affiliate)/i.test(body)) {
    errors.push('Post appears to contain an affiliate link')
  }

  for (const phrase of AGGRESSIVE_PROMO) {
    if (combined.includes(phrase)) warnings.push(`Potentially promotional phrase: ${phrase}`)
  }

  if (body.includes('<script') || body.includes('<iframe')) {
    errors.push('Post contains unsupported markdown or HTML')
  }

  return { ok: errors.length === 0, errors, warnings }
}
