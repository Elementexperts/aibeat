export const SITE_URL = 'https://www.aibeat.dev'
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const SITE_LOGO = `${SITE_URL}/aibeat-logo.png`
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

export function canonicalUrl(path = '/') {
  const url = new URL(path, SITE_URL)
  url.protocol = 'https:'
  url.host = 'www.aibeat.dev'
  url.search = ''
  url.hash = ''
  return url.href.replace(/\/$/, path === '/' ? '/' : '')
}

export function safeHttpUrl(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, SITE_URL)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined
    return url.href
  } catch { return undefined }
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function breadcrumbs(items: Array<{ name: string; path: string }>) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path) })) }
}

export const organizationSchema = {
  '@type': ['Organization', 'NewsMediaOrganization'], '@id': ORGANIZATION_ID,
  name: 'AIBeat', url: SITE_URL, logo: { '@type': 'ImageObject', url: SITE_LOGO },
  // Existing company profile from the root layout; no new social identities.
  sameAs: ['https://www.linkedin.com/company/aibeat-dev'],
}

export const websiteSchema = { '@type': 'WebSite', '@id': WEBSITE_ID, name: 'AIBeat', url: SITE_URL, publisher: { '@id': ORGANIZATION_ID }, inLanguage: 'en' }
