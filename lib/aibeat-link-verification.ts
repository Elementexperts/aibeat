import { AIBEAT_BADGE_PATHS, AIBEAT_CANONICAL_URL } from '@/data/founder-services'

export type VerificationMethod = 'badge' | 'text'
export type VerificationStatus = 'not_required' | 'pending' | 'verified' | 'failed' | 'manual_review' | 'expired'

export type VerificationEvidence = {
  matchedHref: string
  matchedBadgeSrc?: string
  pageTitle?: string
  checkedAt: string
}

export type VerificationResult = {
  ok: boolean
  status: VerificationStatus
  reason?: string
  evidence?: VerificationEvidence
}

type VerifyInput = {
  websiteUrl: string
  verificationPageUrl: string
  verificationMethod: VerificationMethod
  fetchImpl?: typeof fetch
  timeoutMs?: number
  maxBytes?: number
  maxRedirects?: number
}

const APPROVED_HOSTS = new Set(['aibeat.dev', 'www.aibeat.dev'])
const APPROVED_PATHS = new Set(['/', '/tools', '/submit'])
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
]

function parseHttpsUrl(value: string, allowLocalhost = false): URL | undefined {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && !(allowLocalhost && url.protocol === 'http:' && url.hostname === 'localhost')) return undefined
    return url
  } catch {
    return undefined
  }
}

function isUnsafeHost(hostname: string) {
  const host = hostname.toLowerCase()
  if (BLOCKED_HOSTS.includes(host)) return true
  if (PRIVATE_IPV4.some((pattern) => pattern.test(host))) return true
  return /^\d+\.\d+\.\d+\.\d+$/.test(host)
}

function rootDomain(hostname: string) {
  const parts = hostname.toLowerCase().replace(/^www\./, '').split('.')
  return parts.slice(-2).join('.')
}

function sameOrSubdomain(pageHost: string, websiteHost: string) {
  const page = pageHost.toLowerCase()
  const website = websiteHost.toLowerCase()
  return page === website || page.endsWith(`.${website}`) || rootDomain(page) === rootDomain(website)
}

export function normalizeAibeatDestination(raw: string) {
  try {
    const url = new URL(raw, AIBEAT_CANONICAL_URL)
    const host = url.hostname.toLowerCase()
    const pathname = url.pathname.replace(/\/$/, '') || '/'
    if (!APPROVED_HOSTS.has(host)) return undefined
    if (!APPROVED_PATHS.has(pathname)) return undefined
    return `https://aibeat.dev${pathname === '/' ? '' : pathname}`
  } catch {
    return undefined
  }
}

function visibleHtml(fragment: string) {
  const lower = fragment.toLowerCase()
  return ![
    'display:none',
    'visibility:hidden',
    'opacity:0',
    'font-size:0',
    'width:0',
    'height:0',
    'hidden',
    'aria-hidden="true"',
    "aria-hidden='true'",
  ].some((marker) => lower.replace(/\s+/g, '').includes(marker.replace(/\s+/g, '')))
}

function attr(fragment: string, name: string) {
  const match = fragment.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match?.[1]
}

function pageTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 160)
}

export function inspectAibeatLink(html: string, method: VerificationMethod, checkedAt = new Date().toISOString()): VerificationResult {
  const anchors = Array.from(html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)).map((match) => match[0])
  for (const anchor of anchors) {
    if (!visibleHtml(anchor)) continue
    const href = attr(anchor, 'href')
    if (!href) continue
    const matchedHref = normalizeAibeatDestination(href)
    if (!matchedHref) continue

    if (method === 'text') {
      return { ok: true, status: 'verified', evidence: { matchedHref, pageTitle: pageTitle(html), checkedAt } }
    }

    const imageMatch = anchor.match(/<img\b[^>]*>/i)?.[0]
    const src = imageMatch ? attr(imageMatch, 'src') : undefined
    const matchedBadgeSrc = src && AIBEAT_BADGE_PATHS.some((path) => {
      try {
        const normalized = new URL(src, AIBEAT_CANONICAL_URL)
        return APPROVED_HOSTS.has(normalized.hostname.toLowerCase()) && normalized.pathname === path
      } catch {
        return false
      }
    }) ? src : undefined

    if (matchedBadgeSrc) {
      return { ok: true, status: 'verified', evidence: { matchedHref, matchedBadgeSrc, pageTitle: pageTitle(html), checkedAt } }
    }
    return { ok: false, status: 'failed', reason: 'The badge image was found, but it is not wrapped in the required AIBeat link.' }
  }

  return { ok: false, status: 'failed', reason: method === 'badge' ? 'The page does not contain the approved linked AIBeat badge.' : 'The page does not contain a visible link to AIBeat.' }
}

async function readLimitedText(response: Response, maxBytes: number) {
  const text = await response.text()
  if (text.length > maxBytes) throw new Error('The verification page response is too large.')
  return text
}

export async function verifyAibeatLink(input: VerifyInput): Promise<VerificationResult> {
  const websiteUrl = parseHttpsUrl(input.websiteUrl)
  const pageUrl = parseHttpsUrl(input.verificationPageUrl)
  if (!websiteUrl || !pageUrl) return { ok: false, status: 'failed', reason: 'Both URLs must use HTTPS.' }
  if (isUnsafeHost(websiteUrl.hostname) || isUnsafeHost(pageUrl.hostname)) return { ok: false, status: 'failed', reason: 'Unsafe internal or IP hostnames are not allowed.' }
  if (!sameOrSubdomain(pageUrl.hostname, websiteUrl.hostname)) return { ok: false, status: 'failed', reason: 'Verification page must be on the official website domain or an allowed subdomain.' }

  const fetchImpl = input.fetchImpl || fetch
  const timeoutMs = input.timeoutMs || 8000
  const maxBytes = input.maxBytes || 250000
  const maxRedirects = input.maxRedirects ?? 3
  let current = pageUrl.toString()

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(current, { redirect: 'manual', signal: controller.signal, headers: { Accept: 'text/html' } })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location) return { ok: false, status: 'failed', reason: 'Redirect response did not include a destination.' }
        const next = new URL(location, current)
        if (isUnsafeHost(next.hostname)) return { ok: false, status: 'failed', reason: 'Redirect points to an unsafe host.' }
        current = next.toString()
        continue
      }

      if (!response.ok) return { ok: false, status: 'failed', reason: 'We could not access the supplied page.' }
      const type = response.headers.get('content-type') || ''
      if (!type.includes('text/html')) return { ok: false, status: 'failed', reason: 'The verification page must return HTML content.' }
      const html = await readLimitedText(response, maxBytes)
      return inspectAibeatLink(html, input.verificationMethod)
    } catch (err) {
      return { ok: false, status: 'failed', reason: err instanceof Error && err.name === 'AbortError' ? 'Verification timed out. Please try again.' : err instanceof Error ? err.message : 'Verification failed.' }
    } finally {
      clearTimeout(timeout)
    }
  }

  return { ok: false, status: 'failed', reason: 'Redirect limit exceeded.' }
}
