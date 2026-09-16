import { Rejection } from './types'

export function decode(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
    const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
  }).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}
export function attrs(tag: string) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)).map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]))
}
export function metadata(html: string): Record<string, string> {
  return Object.fromEntries((html.match(/<meta\b[^>]*>/gi) || []).map(tag => { const a = attrs(tag); return [(a.property || a.name || a.itemprop || '').toLowerCase(), a.content] }))
}
export function articleNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  const walk = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(walk); return }
    if (!value || typeof value !== 'object') return
    const object = value as Record<string, unknown>
    const types = Array.isArray(object['@type']) ? object['@type'] : [object['@type']]
    if (types.some(t => typeof t === 'string' && /^(?:NewsArticle|Article|BlogPosting|TechArticle|ScholarlyArticle|Report)$/.test(t))) nodes.push(object)
    if (object['@graph']) walk(object['@graph'])
    if (object.mainEntity) walk(object.mainEntity)
  }
  for (const match of Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))) {
    if (attrs(match[1]).type?.toLowerCase() !== 'application/ld+json') continue
    try { walk(JSON.parse(match[2])) } catch { /* Malformed structured data is not evidence. */ }
  }
  return nodes
}
export function publicationDate(html: string, body: string) {
  const meta = metadata(html)
  const raw = [meta['article:published_time'], meta.datepublished, meta.citation_publication_date,
    ...articleNodes(html).map(n => n.datePublished)].filter((v): v is string => typeof v === 'string' && !!v.trim())
  if (!raw.length) {
    const tag = body.match(/<time\b[^>]*>/i)?.[0]
    const value = tag && attrs(tag).datetime
    if (value) raw.push(value)
  }
  if (!raw.length) throw new Rejection('INVALID_DATE', 'PUBLICATION_DATE_MISSING')
  const dates = raw.map(value => {
    const parsed = Date.parse(value)
    // Date.parse silently rolls impossible ISO dates into the next month.
    const day = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
    if (!Number.isFinite(parsed) || (day && new Date(day).toISOString().slice(0, 10) !== day)) throw new Rejection('INVALID_DATE', 'PUBLICATION_DATE_UNPARSABLE')
    return new Date(parsed).toISOString()
  })
  if (new Set(dates.map(d => d.slice(0, 10))).size > 1) throw new Rejection('INVALID_DATE', 'PUBLICATION_DATES_CONFLICT')
  return dates[0]
}

export type DiscoveredLink = { url: string; label: string }
export function documentLinks(html: string, base: string): DiscoveredLink[] {
  const links: DiscoveredLink[] = []
  const add = (value: unknown, label = '') => {
    if (typeof value !== 'string' || !value || value.startsWith('#')) return
    try {
      const url = new URL(value, base)
      if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return
      url.hash = ''
      if (url.pathname === '/' || /\/(?:tags?|category|authors?|privacy|login|subscribe|wp-admin|wp-json)(?:\/|$)/i.test(url.pathname) || /\/page\/\d+\/?$/i.test(url.pathname)) return
      links.push({ url: url.href, label: decode(label.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim() })
    } catch { /* Ignore malformed discovery hints. */ }
  }
  const region = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i))?.[1] || html
  const cleaned = region.replace(/<(script|style|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  for (const m of Array.from(cleaned.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi))) add(attrs(m[1]).href, m[2])
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const a = attrs(tag)
    if (/\b(canonical|source)\b/i.test(a.rel || '')) add(a.href)
  }
  const visitReference = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visitReference); return }
    if (typeof value === 'string') add(value)
    else if (value && typeof value === 'object') {
      const object = value as Record<string, unknown>; add(object.url || object['@id'], typeof object.name === 'string' ? object.name : '')
    }
  }
  for (const node of articleNodes(html)) for (const key of ['url', 'mainEntityOfPage', 'isBasedOn', 'citation']) visitReference(node[key])
  return Array.from(new Map(links.map(l => [l.url, l])).values())
}
