import { lookup } from 'node:dns/promises'
import { isPublicAddress } from '../news-images'
import { classifySource, QUALITY } from './config'
import { eventTokens, normalize } from './gate'
import { Rejection, type Candidate, type Source } from './types'

export function canonicalSource(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
  url.hash = ''
  Array.from(url.searchParams.keys()).filter(k => /^utm_|^(fbclid|gclid)$/.test(k)).forEach(k => url.searchParams.delete(k))
  return url.href
}
export async function publicUrl(value: string) {
  const url = new URL(canonicalSource(value))
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
}
export class SourceFetcher {
  private cache = new Map<string, Promise<{ url: string; body: string }>>()
  count = 0
  constructor(private fetcher: typeof fetch = fetch, private validate: (url: string) => Promise<void> = publicUrl) {}
  async get(value: string): Promise<{ url: string; body: string }> {
    const key = canonicalSource(value)
    const cached = this.cache.get(key)
    if (cached) return cached
    const pending = this.download(key)
    this.cache.set(key, pending)
    return pending
  }
  async verifyAvailable(sources: Source[]) {
    for (const source of sources) {
      if (this.count >= QUALITY.maxFetches) throw new Rejection('BUDGET_EXHAUSTED')
      this.count++
      await this.validate(source.url)
      const response = await this.fetcher(source.url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(QUALITY.timeoutMs), headers: { 'User-Agent': 'AIBeat-NewsEvidence/1.0' } })
      await response.body?.cancel()
      if (!response.ok) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
    }
  }
  private async download(value: string) {
    const signal = AbortSignal.timeout(QUALITY.timeoutMs)
    for (let redirect = 0; redirect <= 3; redirect++) {
      if (this.count >= QUALITY.maxFetches) throw new Rejection('BUDGET_EXHAUSTED')
      this.count++
      await this.validate(value)
      signal.throwIfAborted()
      const response = await this.fetcher(value, { redirect: 'manual', signal, headers: { 'User-Agent': 'AIBeat-NewsEvidence/1.0', Accept: 'text/html, application/rss+xml, application/atom+xml, application/xml, text/xml' } })
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel()
        const location = response.headers.get('location')
        if (!location) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
        value = canonicalSource(new URL(location, value).href)
        continue
      }
      if (!response.ok || !/html|xml|text\/plain/i.test(response.headers.get('content-type') || '') || Number(response.headers.get('content-length')) > QUALITY.maxSourceBytes || !response.body) {
        await response.body?.cancel(); throw new Rejection('SOURCE_RETRIEVAL_FAILED')
      }
      const chunks: Uint8Array[] = []
      const reader = response.body.getReader()
      let size = 0
      try {
        while (true) {
          const item = await reader.read()
          if (item.done) break
          size += item.value.length
          if (size > QUALITY.maxSourceBytes) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
          chunks.push(item.value)
        }
      } finally { await reader.cancel() }
      return { url: value, body: Buffer.concat(chunks).toString('utf8') }
    }
    throw new Rejection('SOURCE_RETRIEVAL_FAILED')
  }
}
export function decode(value: string) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
    const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
  }).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}
function attrs(tag: string) {
  return Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)).map(m => [m[1].toLowerCase(), decode(m[2])]))
}
export function extractSource(url: string, html: string, id: string): Source {
  const classification = classifySource(url)
  const metadata = Object.fromEntries((html.match(/<meta\b[^>]*>/gi) || []).map(tag => { const a = attrs(tag); return [a.property || a.name, a.content] }))
  const body = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i))?.[1]
  if (!body) throw new Rejection('SOURCE_RETRIEVAL_FAILED')
  const rawDate = metadata['article:published_time'] || metadata['datePublished'] || metadata['citation_publication_date'] || html.match(/"datePublished"\s*:\s*"([^"\n]+)"/i)?.[1] || body.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]
  const parsedDate = rawDate ? Date.parse(rawDate) : NaN
  if (!Number.isFinite(parsedDate)) throw new Rejection('INVALID_DATE')
  const cleaned = body.replace(/<(script|style|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const text = decode(cleaned.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, QUALITY.maxSourceChars)
  if (text.length < QUALITY.minSourceChars || /enable javascript to continue|verify you are human|access denied/i.test(text)) throw new Rejection('LOW_INFORMATION_VALUE')
  const links = (cleaned.match(/<a\b[^>]*>/gi) || []).flatMap(tag => {
    const href = attrs(tag).href
    if (!href || href.startsWith('#')) return []
    try {
      const target = new URL(href, url)
      if (target.pathname === '/' || /^\/(?:tags?|category|privacy|about|login|subscribe)\/?$/i.test(target.pathname)) return []
      return [canonicalSource(target.href)]
    } catch { return [] }
  })
  let group = classification.group
  // Explicit wire attribution is not an independent corroborating newsroom.
  if (/\b(?:by|via|according to|reported by|reporting by) Reuters\b/i.test(text)) group = 'reuters'
  if (/\b(?:by|via|according to|reported by) (?:the )?Associated Press\b/i.test(text)) group = 'ap'
  let imageUrl: string | undefined
  try { if (metadata['og:image']) imageUrl = canonicalSource(new URL(metadata['og:image'], url).href) } catch { /* Optional image. */ }
  return { id, url, name: classification.name, tier: classification.tier, group, text, publishedAt: new Date(parsedDate).toISOString(), links: Array.from(new Set(links)), imageUrl }
}
export function relatedCandidate(a: Candidate, b: Candidate) {
  const first = eventTokens(a.title), second = eventTokens(b.title)
  const common = Array.from(first).filter(t => second.has(t)).length
  return common >= 2 && common / Math.max(1, Math.min(first.size, second.size)) >= 0.4
}
export async function collectSources(candidate: Candidate, candidates: Candidate[], fetcher: SourceFetcher) {
  const sources: Source[] = []
  const queue = [candidate.url, ...candidates.filter(c => c.url !== candidate.url && relatedCandidate(candidate, c)).sort((a, b) => classifySource(a.url).tier - classifySource(b.url).tier).map(c => c.url)]
  const seen = new Set<string>()
  let attempts = 0
  while (queue.length && attempts < QUALITY.maxSourceAttempts && sources.length < QUALITY.maxSources) {
    const url = queue.shift()!
    if (seen.has(url)) continue
    seen.add(url); attempts++
    try {
      const page = await fetcher.get(url)
      if (sources.some(s => s.url === page.url)) continue
      const source = extractSource(page.url, page.body, `s${sources.length + 1}`)
      sources.push(source)
      if (sources.length === 1) queue.unshift(...source.links.filter(link => classifySource(link).tier <= 2 && link !== source.url).sort((a, b) => classifySource(a).tier - classifySource(b).tier).slice(0, QUALITY.maxSourceAttempts - attempts))
    } catch (error) {
      if (error instanceof Rejection && error.reason === 'BUDGET_EXHAUSTED') throw error
      // No summary fallback: an inaccessible document cannot support publication.
    }
  }
  // Exact copied documents do not count as independent reporting.
  for (let i = 0; i < sources.length; i++) for (let j = 0; j < i; j++) {
    if (normalize(sources[i].text) === normalize(sources[j].text)) sources[i].group = sources[j].group
  }
  return sources
}
