import { TRUSTED_EDITORIAL_PUBLISHERS, classifySource } from './config'
import { articleNodes, attrs, decode, metadata } from './documents'
import type { Candidate, EditorialClassification, Source } from './types'

const plain = (value: string) => decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
export { routineTechnology as ordinaryTechnology } from './risk'
import { storyRisk } from './risk'
export function classifyEditorial(url: string, html: string): EditorialClassification {
  const rule = classifySource(url)
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  const policy = TRUSTED_EDITORIAL_PUBLISHERS.find(p => p.host === host)
  const result = (contentType: EditorialClassification['contentType'], ...indicators: string[]): EditorialClassification => ({
    publisherTrust: policy && rule.tier === 2 ? 'TRUSTED_EDITORIAL' : 'NOT_TRUSTED', contentType, indicators,
  })
  if (rule.tier === 1) return result('PRIMARY', 'REGISTERED_PRIMARY_HOST')
  const path = new URL(url).pathname
  if (/\/(community|forums?|users?|discussions?|answers|comments)(\/|$)/i.test(path)) return result('COMMUNITY', 'USER_CONTENT_PATH')
  if (!policy || rule.tier !== 2) return result('AMBIGUOUS', 'NO_EXACT_EDITORIAL_RULE')
  const meta = metadata(html), nodes = articleNodes(html)
  const authors = nodes.flatMap(node => Array.isArray(node.author) ? node.author : node.author ? [node.author] : [])
  const authorText = authors.map(author => typeof author === 'string' ? author : JSON.stringify(author)).join(' ')
  const region = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i))?.[1] || ''
  const cleanRegion = region.replace(/<(script|style|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const heading = plain(cleanRegion).slice(0, 900)
  const bylines = Array.from(cleanRegion.matchAll(/<(?:span|div|p|a)\b([^>]*)>([\s\S]*?)<\/(?:span|div|p|a)>/gi))
    .filter(m => /byline|author|contributor/i.test([attrs(m[1]).class, attrs(m[1])['data-testid'], attrs(m[1]).itemprop].join(' ')))
    .map(m => plain(m[2]).slice(0, 200)).join(' ')
  const labels = [meta.author, meta['article:section'], meta['article:type'], meta.genre, authorText, bylines,
    ...nodes.map(n => [n.articleSection, n.genre, n.creativeWorkStatus].filter(Boolean).join(' ')), heading].filter(Boolean).join(' ')
  // Negative indicators always outrank staff markers. Inspect labels/bylines,
  // not related-story cards or a publisher name somewhere in page chrome.
  if (/\/(?:sponsored|brandvoice|paid-content|advertorial|advisor|councils)(?:\/|$)|\/sites\/(?:forbespr|[^/]*council)\//i.test(path) || /\b(sponsored content|paid post|advertorial|brandvoice|partner content|paid program|sponsored by|forbes councils)\b/i.test(labels)) return result('SPONSORED', 'SPONSORED_OR_BRAND_CONTENT')
  if (/\/(?:press-releases?|pressreleases)(?:\/|$)/i.test(path) || /\b(press release|pr newswire|prnewswire|business wire|news provided by)\b/i.test(labels)) return result('SYNDICATED', 'PRESS_RELEASE_INDICATOR')
  if (/\/(?:opinion|editorials?|commentary)(?:\/|$)/i.test(path) || /\b(opinion|opinions expressed|guest essay|editorial column)\b/i.test(labels)) return result('OPINION', 'OPINION_INDICATOR')
  if (/\/(?:contributors?|guest-posts?)(?:\/|$)/i.test(path) || /\b(contributor|guest author|guest writer|former staff)\b/i.test(labels)) return result('CONTRIBUTOR', 'NON_STAFF_BYLINE')
  if (/\b(originally published|republished from|reprinted from|content provided by|aggregated from)\b/i.test(labels)) return result('AGGREGATION', 'DERIVATIVE_CONTENT_LABEL')
  const wire = labels.match(/\b(?:by|via) (Reuters|Associated Press)\b/i)?.[1]
  if (wire && !['reuters', 'ap'].includes(rule.group)) return result('SYNDICATED', 'WIRE_BYLINE_ON_ANOTHER_PUBLISHER')
  const authorKnown = !!meta.author?.trim() || authors.some(a => typeof a === 'string' ? !!a.trim() : a && typeof a === 'object' && typeof (a as Record<string, unknown>).name === 'string')
  const articleKnown = nodes.length > 0 || meta['og:type']?.toLowerCase() === 'article'
  if (policy.staffEvidence === 'explicit' && !/\bForbes Staff\b/i.test([meta.author, authorText, bylines].join(' '))) return result('AMBIGUOUS', 'EXPLICIT_STAFF_BYLINE_REQUIRED')
  if (!authorKnown || !articleKnown) return result('AMBIGUOUS', 'ARTICLE_AND_AUTHOR_METADATA_REQUIRED')
  return result('STAFF_REPORTING', 'ARTICLE_METADATA', 'AUTHOR_METADATA', policy.staffEvidence === 'explicit' ? 'EXPLICIT_STAFF_BYLINE' : 'NO_NON_EDITORIAL_LABELS')
}
export function trustedEditorial(source: Source) {
  return classifySource(source.url).tier === 2 && source.tier === 2 &&
    source.editorial?.publisherTrust === 'TRUSTED_EDITORIAL' && source.editorial.contentType === 'STAFF_REPORTING' &&
    !source.originGroups?.some(group => group !== classifySource(source.url).group)
}
export function originalEditorial(candidate: Candidate, sources: Source[]) {
  if (classifySource(candidate.url).tier !== 2) return undefined
  return sources.find(source => (source.url === candidate.url || source.requestedUrl === candidate.url) && trustedEditorial(source))
}
export function ordinaryTrustedCandidate(candidate: Candidate, source: Source) {
  return originalEditorial(candidate, [source]) && storyRisk(candidate, source).level !== 'high'
}
