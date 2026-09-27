import type { Tool } from './data'

// Shared by the website and the worker; deliberately contains no server imports.
export function productIdentity(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Invalid product URL')
  return url.hostname.toLowerCase().replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')
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
