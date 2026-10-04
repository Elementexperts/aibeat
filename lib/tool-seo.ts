import type { Metadata } from 'next'
import type { Tool } from './data'
import type { Article } from './articles'
import { canonicalUrl, safeHttpUrl } from './site-seo'


const DESCRIPTION_MIN = 120
const DESCRIPTION_MAX = 160
const TITLE_MAX = 65
const TITLE_SUFFIX = ' | AIBeat.dev'

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sentence(value: string) {
  return /[.!?]$/.test(value) ? value : value + '.'
}

export function toolDescription(tool: Tool): string {
  const name = cleanText(tool.name)
  let description = cleanText(tool.description) || cleanText(tool.tagline)
  if (!description.toLowerCase().includes(name.toLowerCase())) {
    description = name + ': ' + description
  }
  description = sentence(description)
  // Submission/placement labels are not product pricing information.
  const pricing = cleanText(tool.pricing)
  if (description.length < DESCRIPTION_MIN && pricing && !/listing|featured|submitted/i.test(pricing)) {
    description += ' ' + sentence(pricing)
  }
  if (description.length < DESCRIPTION_MIN && tool.category) {
    description += ' Listed in AIBeat’s ' + cleanText(tool.category) + ' directory.'
  }
  if (description.length <= DESCRIPTION_MAX) return description
  // Prefer complete sentences, otherwise end at a word boundary, never mid-word.
  const prefix = description.slice(0, DESCRIPTION_MAX - 1)
  const sentences = Array.from(prefix.matchAll(/[.!?](?=\s|$)/g))
  const last = sentences.at(-1)?.index
  if (last !== undefined && last + 1 >= DESCRIPTION_MIN) return prefix.slice(0, last + 1)
  return prefix.slice(0, prefix.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'
}

export function toolMetadata(tool: Tool): Metadata {
  const description = toolDescription(tool)
  let title = tool.rating === null
    ? tool.name + ' — Features, Pricing & Alternatives'
    : tool.name + ' Review (2026) — Is It Worth It?'
  if ((title + TITLE_SUFFIX).length > TITLE_MAX) title = tool.name + ' — Features & Pricing'
  const url = canonicalUrl('/tools/' + tool.slug)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: tool.name, description },
    twitter: { card: 'summary_large_image', title: tool.name, description },
  }
}

export function toolSchema(tool: Tool) {
  return {
    '@context': 'https://schema.org', '@type': tool.listingType === 'service' ? 'Service' : 'SoftwareApplication',
    name: tool.name, description: tool.description, url: canonicalUrl(`/tools/${tool.slug}`),
    ...(tool.listingType === 'service' ? { serviceType: tool.category } : { applicationCategory: tool.category }),
    image: safeHttpUrl(tool.logoUrl), sameAs: safeHttpUrl(tool.websiteUrl),
  }
}

export function articleMentionsTool(article: Article, tool: Tool) {
  if (article.relatedTools?.includes(tool.slug)) return true
  // Short/common names need an explicit relationship to avoid incidental SEO links.
  if (tool.name.length < 5) return false
  const escaped = tool.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(`${article.title} ${article.deck}`)
}
