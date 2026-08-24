export const BUSINESS_PUBLIC_PATHS = new Set([
  '/business',
  '/business/demo',
  '/business/pricing',
  '/business/ai-spend-calculator',
  '/business/sign-up',
  '/business/sign-in',
  '/business/forgot-password',
  '/business/reset-password',
  '/business/auth/callback',
])

export const BUSINESS_AUTHENTICATED_PATHS = new Set(['/business/onboarding'])

export const BUSINESS_PRIVATE_PREFIXES = [
  '/business/dashboard',
  '/business/workflows',
  '/business/agents',
  '/business/context',
  '/business/ai-stack',
  '/business/recommendations',
  '/business/approvals',
  '/business/integrations',
  '/business/reports',
  '/business/audit',
  '/business/settings',
]

const FALLBACK_PRIVATE_PATH = '/business/dashboard'
const FALLBACK_PUBLIC_PATH = '/business'

export function isBusinessPath(pathname: string) {
  return pathname === '/business' || pathname.startsWith('/business/')
}

export function isPublicBusinessPath(pathname: string) {
  return BUSINESS_PUBLIC_PATHS.has(normalizeBusinessPath(pathname))
}

export function isAuthenticatedBusinessPath(pathname: string) {
  return BUSINESS_AUTHENTICATED_PATHS.has(normalizeBusinessPath(pathname))
}

export function isPrivateBusinessPath(pathname: string) {
  const normalized = normalizeBusinessPath(pathname)
  return BUSINESS_PRIVATE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

export function sanitizeBusinessNext(value: string | null | undefined, fallback = FALLBACK_PRIVATE_PATH) {
  if (!value) return fallback

  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return fallback
  }

  if (!decoded.startsWith('/business')) return fallback
  if (decoded.startsWith('//')) return fallback
  if (decoded.includes('\\')) return fallback

  let url: URL
  try {
    url = new URL(decoded, 'https://www.aibeat.dev')
  } catch {
    return fallback
  }

  if (url.origin !== 'https://www.aibeat.dev') return fallback
  if (!isBusinessPath(url.pathname)) return fallback
  if (url.pathname === '/business/sign-in' || url.pathname === '/business/sign-up') return fallback
  if (url.pathname === '/business/auth/callback') return fallback

  return `${url.pathname}${url.search}${url.hash}`
}

export function sanitizeBusinessPublicNext(value: string | null | undefined, fallback = FALLBACK_PUBLIC_PATH) {
  const next = sanitizeBusinessNext(value, fallback)
  if (isPrivateBusinessPath(next) || isAuthenticatedBusinessPath(next)) return next
  return next
}

function normalizeBusinessPath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}
