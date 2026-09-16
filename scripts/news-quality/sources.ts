import { lookup } from 'node:dns/promises'
import { isPublicAddress } from '../news-images'
import Parser from 'rss-parser'
import { articleNodes, documentLinks, metadata, publicationDate, decode } from './documents'
import { diagnosticUrl, failureDetail } from './diagnostics'
import { classifySource, QUALITY, OFFICIAL_DISCOVERY } from './config'
import { classifyEditorial, ordinaryTrustedCandidate } from './trust'
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
      if (!response.ok) throw new Rejection('SOURCE_RETRIEVAL_FAILED', `HTTP_${response.status}`)
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
        if (!location) throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'REDIRECT_WITHOUT_LOCATION')
        value = canonicalSource(new URL(location, value).href)
        continue
      }
      if (!response.ok || !/html|xml|text\/plain/i.test(response.headers.get('content-type') || '') || Number(response.headers.get('content-length')) > QUALITY.maxSourceBytes || !response.body) {
        await response.body?.cancel(); throw new Rejection('SOURCE_RETRIEVAL_FAILED', !response.ok ? `HTTP_${response.status}` : Number(response.headers.get('content-length')) > QUALITY.maxSourceBytes ? 'BODY_TOO_LARGE' : 'UNSUPPORTED_CONTENT_TYPE_OR_EMPTY_BODY')
      }
      const chunks: Uint8Array[] = []
      const reader = response.body.getReader()
      let size = 0
      try {
        while (true) {
          const item = await reader.read()
          if (item.done) break
          size += item.value.length
          if (size > QUALITY.maxSourceBytes) throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'BODY_TOO_LARGE')
          chunks.push(item.value)
        }
      } finally { await reader.cancel() }
      return { url: value, body: Buffer.concat(chunks).toString('utf8') }
    }
    throw new Rejection('SOURCE_RETRIEVAL_FAILED')
  }
}
export function extractSource(url: string, html: string, id: string): Source {
  const classification = classifySource(url)
  const meta = metadata(html)
  const body = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i))?.[1]
  if (!body) throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'ARTICLE_BODY_MISSING')
  const publishedAt = publicationDate(html, body)
  const cleaned = body.replace(/<(script|style|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const text = decode(cleaned.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, QUALITY.maxSourceChars)
  if (text.length < QUALITY.minSourceChars || /enable javascript to continue|verify you are human|access denied/i.test(text)) throw new Rejection('LOW_INFORMATION_VALUE')
  const links = documentLinks(html, url).map(link => link.url)
  const group = classification.group
  // A cited newsroom must never split one publisher into independent groups.
  // Only byline-level wire attribution adds a shared origin; retain ownership.
  const byline = (meta.author || '') + ' ' + text.slice(0, 300)
  const originGroups: string[] = []
  if (/\b(?:by|via|reporting by) Reuters\b/i.test(byline) || /^Reuters$/i.test(meta.author || '')) originGroups.push('reuters')
  if (/\b(?:by|via|reporting by) (?:the )?Associated Press\b/i.test(byline) || /^(?:The )?Associated Press$/i.test(meta.author || '')) originGroups.push('ap')
  let imageUrl: string | undefined
  try { if (meta['og:image']) imageUrl = canonicalSource(new URL(meta['og:image'], url).href) } catch { /* Optional image. */ }
  const editorial = classifyEditorial(url, html)
  const tier = classification.tier === 2 && editorial.contentType !== 'STAFF_REPORTING' ? 3 : classification.tier
  const headline = articleNodes(html).find(node => typeof node.headline === 'string')?.headline
  const title = decode(meta['og:title'] || (typeof headline === 'string' ? headline : '') || html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g, ' ') || '').slice(0, 220)
  return { id, url, title, editorial, name: classification.name, tier, group, text, publishedAt, links: Array.from(new Set(links)), imageUrl, originGroups }
}
export function relatedCandidate(a: Candidate, b: Candidate) {
  const first = eventTokens(a.title), second = eventTokens(b.title)
  const common = Array.from(first).filter(t => second.has(t)).length
  return common >= 2 && common / Math.max(1, Math.min(first.size, second.size)) >= 0.4
}
export function mergeSourceOrigins(sources: Source[]) {
  const groups = sources.map(s => new Set([s.group, ...(s.originGroups || [])]))
  // At most four documents. Revisit after each union to handle transitive origins.
  for (let pass = 0; pass < sources.length; pass++) for (let i = 0; i < sources.length; i++) for (let j = 0; j < i; j++) {
    if (Array.from(groups[i]).some(g => groups[j].has(g)) || normalize(sources[i].text) === normalize(sources[j].text)) {
      const union = new Set([...Array.from(groups[i]), ...Array.from(groups[j])])
      groups[i] = union; groups[j] = union
    }
  }
  sources.forEach((s, i) => { s.group = Array.from(groups[i]).sort().join('|') })
}
export async function collectSources(candidate: Candidate, candidates: Candidate[], fetcher: SourceFetcher, log: (message: string) => void = () => {}, now = new Date(), forceEnhanced = false) {
  const sources: Source[] = []
  const queue = [candidate.url]
  const seen = new Set<string>()
  const official = new Set<string>()
  const hubs = OFFICIAL_DISCOVERY.filter(entry => entry.mentions.test(candidate.title)).flatMap(entry => [...entry.urls]).slice(0, 2)
  const plannedHubs = new Set(hubs)
  let attempts = 0, documents = 0, serial = 0
  const enqueue = (value: string, label = '', primaryOnly = false) => {
    try {
      const url = canonicalSource(value), classification = classifySource(url)
      if (seen.has(url) || queue.includes(url)) return
      if (classification.tier === 1) { official.add(url); queue.unshift(url) }
      else if (!primaryOnly && classification.tier === 2 && relatedCandidate(candidate, { ...candidate, title: label })) queue.push(url)
    } catch { /* An untrusted hint never creates authority. */ }
  }
  const hintLinks = candidate.discoveryLinks || []
  // Retrieve the candidate first, then prioritize its official RSS hints.
  for (const url of hintLinks.slice(0, 30)) enqueue(url, '', true)
  const first = queue.indexOf(candidate.url); if (first > 0) queue.unshift(...queue.splice(first, 1))
  if (classifySource(candidate.url).tier === 1) official.add(candidate.url)
  for (const related of candidates.filter(c => c.url !== candidate.url && relatedCandidate(candidate, c))) enqueue(related.url, related.title)
  try {
    while (attempts < QUALITY.maxSourceAttempts) {
      if (sources.length >= QUALITY.maxSources && sources.some(s => s.tier === 1)) break
      const primaryIndex = queue.findIndex(url => classifySource(url).tier === 1 && !seen.has(url))
      // Leave room for a primary source even after four secondary documents.
      const needPrimary = !sources.some(s => s.tier === 1)
      let url: string | undefined, hub = false
      if (attempts === 0) url = queue.shift()
      else if (primaryIndex >= 0) url = queue.splice(primaryIndex, 1)[0]
      else if (needPrimary && hubs.length) { url = hubs.shift(); hub = true }
      else if (sources.length < QUALITY.maxSources) url = queue.shift()
      else break
      if (!url) break
      if (seen.has(url)) continue
      seen.add(url); attempts++
      const tier = classifySource(url).tier
      try {
        const page = await fetcher.get(url)
        documents++
        if (hub) {
          if (classifySource(page.url).tier !== 1) throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'OFFICIAL_ENDPOINT_REDIRECTED_OUTSIDE_REGISTRY')
          if (/<(?:rss|feed)\b/i.test(page.body)) {
            let items
            try { items = (await new Parser().parseString(page.body)).items } catch { throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'FEED_PARSE_ERROR') }
            for (const item of items.slice(0, 30)) if (item.link && item.title && relatedCandidate(candidate, { ...candidate, title: item.title })) enqueue(item.link, item.title, true)
          } else {
            for (const link of documentLinks(page.body, page.url)) if (relatedCandidate(candidate, { ...candidate, title: link.label + ' ' + new URL(link.url).pathname.replace(/[-/]/g, ' ') })) enqueue(link.url, link.label, true)
          }
          log(`[AIBeat Discovery] Official endpoint: ${diagnosticUrl(url)} | Matching official URLs: ${official.size}`)
          continue // Listing pages and feed summaries are discovery, never evidence.
        }
        // Extract links BEFORE date/body validation, from EVERY retrieved page.
        // This allows a paywall shell or undated document to lead to real evidence.
        for (const link of documentLinks(page.body, page.url)) enqueue(link.url, link.label)
        const articleText = (page.body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || page.body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '').replace(/<(script|style|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').slice(0, QUALITY.maxSourceChars)
        for (const entry of OFFICIAL_DISCOVERY) if (entry.mentions.test(articleText)) for (const endpoint of entry.urls) {
          if (plannedHubs.size < 2 && !plannedHubs.has(endpoint)) { hubs.push(endpoint); plannedHubs.add(endpoint) }
        }
        if (sources.some(s => s.url === page.url)) continue
        const source = extractSource(page.url, page.body, `s${++serial}`)
        source.requestedUrl = url
        if (sources.length >= QUALITY.maxSources) {
          const replace = sources.findIndex(s => s.tier !== 1)
          if (source.tier !== 1 || replace < 0) continue
          sources.splice(replace, 1)
        }
        sources.push(source)
        const age = now.getTime() - Date.parse(source.publishedAt)
        const dateStatus = age < 0 ? 'FUTURE_PUBLICATION_DATE' : age > QUALITY.freshnessHours * 3600000 ? 'OUTSIDE_48H_CONTEXT_ONLY' : 'WITHIN_48H'
        log(`[AIBeat Discovery] Retrieved: ${diagnosticUrl(source.url)} | Tier: ${source.tier} | Published: ${source.publishedAt} | ${dateStatus}`)
        if (!forceEnhanced && ordinaryTrustedCandidate(candidate, source)) {
          log('[AIBeat Discovery] Original trusted editorial article retrieved; deferring corroboration to risk validation.')
          return sources
        }
      } catch (error) {
        log(`[AIBeat Discovery] ${hub ? 'Official endpoint' : tier === 1 ? 'Primary retrieval' : 'Discovery retrieval'} failed: ${diagnosticUrl(url)} | ${failureDetail(error)}`)
        if (error instanceof Rejection && error.reason === 'BUDGET_EXHAUSTED') throw error
      }
    }
    mergeSourceOrigins(sources)
    return sources
  } finally {
    const secondary = sources.filter(s => s.tier === 2)
    log(`[AIBeat Discovery] Documents retrieved: ${documents} | Official-domain candidates: ${official.size} | Primary documents retrieved: ${sources.filter(s => s.tier === 1).length} | Tier 2 documents: ${secondary.length} | Tier 2 groups before semantic review: ${new Set(secondary.map(s => s.group)).size} | Attempts: ${attempts}/${QUALITY.maxSourceAttempts}`)
  }
}
