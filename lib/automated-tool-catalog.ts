import type { Tool } from './data'

// Shared by the website and the worker; deliberately contains no server imports.
export function productIdentity(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Invalid product URL')
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const path = url.pathname.replace(/\/+$/, '')
  // These reviewed localized pages represent one product, not separate listings.
  if (host === 'mangatranslate.com' && /^(?:\/(?:ru|ar|ko))?(?:\/ai-manga-translator)?$/.test(path)) return host
  if (host === 'toolsvio.online' && /^(?:\/tools)?$/.test(path)) return host
  return host + path
}

export function mergeToolCatalog(manual: Tool[], automated: Tool[]): Tool[] {
  const slugs = new Set(manual.map(t => t.slug))
  const urls = new Set(manual.map(t => productIdentity(t.websiteUrl)))
  return [...manual, ...automated.filter(t => {
    const key = productIdentity(t.websiteUrl)
    if (slugs.has(t.slug) || urls.has(key)) return false
    slugs.add(t.slug); urls.add(key)
    return true
  })]
}
