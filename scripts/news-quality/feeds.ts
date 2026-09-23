import { classifySource, QUALITY } from './config'
import Parser from 'rss-parser'
import { checkFresh } from './gate'
import { documentLinks } from './documents'
import { diagnosticUrl, failureDetail } from './diagnostics'
import { SourceFetcher, canonicalSource } from './sources'
import { Rejection, type Candidate, type HistoricalStory } from './types'

// Public official feeds verified on 2026-09-23. Existing authority and freshness
// gates still apply to each retrieved article; discovery is not publication approval.
export const RSS_FEEDS = [
  'https://openai.com/news/rss.xml',
  'https://blog.google/rss/',
  'https://blogs.nvidia.com/feed/',
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://feeds.feedburner.com/venturebeat/SZYF',
  'https://www.theverge.com/rss/index.xml',
  'https://hnrss.org/frontpage?q=AI+LLM+GPT+Claude+Gemini',
]
export async function discoverFeed(feed: string, fetcher: SourceFetcher, log: (message: string) => void, now = new Date()): Promise<Candidate[]> {
  try {
    const response = await fetcher.get(feed)
    let data
    try { data = await new Parser().parseString(response.body) } catch { throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'FEED_PARSE_ERROR') }
    const candidates: Candidate[] = []
    let rejected = 0
    for (const item of data.items.slice(0, 20)) {
      try {
        if (!item.title || !item.link || !item.isoDate) { rejected++; continue }
        const url = canonicalSource(item.link)
        checkFresh(item.isoDate, now, 'RSS_PUBLICATION_DATE')
        const html = [item.content, item['content:encoded'], item.summary].filter(v => typeof v === 'string').join(' ')
        candidates.push({ title: item.title, url, publishedAt: item.isoDate, discoveryLinks: documentLinks(html, url).map(l => l.url).slice(0, 30) })
      } catch { rejected++ }
    }
    log(`[AIBeat Discovery] Feed: ${diagnosticUrl(feed)} | Items: ${data.items.length} | Recent candidates: ${candidates.length} | Invalid/stale entries: ${rejected}`)
    return candidates
  } catch (error) {
    log(`[AIBeat Discovery] Feed unavailable: ${diagnosticUrl(feed)} | ${failureDetail(error)} | Continuing`)
    return []
  }
}

// Broad technology coverage is retained. Already-published URLs must not consume
// one of the six evidence/model candidate slots. Final event dedup stays intact.
export function selectCandidates(candidates: Candidate[], history: HistoricalStory[]) {
  const published = new Set(history.flatMap(article => (article.sources || []).flatMap(source => {
    try { return [canonicalSource(source.url)] } catch { return [] }
  })))
  const pending = candidates.filter(candidate => !published.has(candidate.url))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const editorial = pending.filter(candidate => classifySource(candidate.url).tier === 2)
  const official = pending.filter(candidate => classifySource(candidate.url).tier === 1)
  // Prioritize independent reporting. Reserve up to two remaining slots for
  // official announcements, then backfill without reducing the six-slot limit.
  // Host eligibility here never bypasses article-level trust validation.
  const selected = [...editorial.slice(0, 4), ...official.slice(0, 2)]
  const seen = new Set(selected.map(candidate => candidate.url))
  for (const candidate of [...editorial.slice(4), ...official.slice(2), ...pending]) {
    if (selected.length >= QUALITY.maxCandidates) break
    if (!seen.has(candidate.url)) { selected.push(candidate); seen.add(candidate.url) }
  }
  return selected.slice(0, QUALITY.maxCandidates)
}
