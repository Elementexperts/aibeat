import type { Tool } from './data'
import type { Article } from './articles'
import { canonicalUrl, safeHttpUrl } from './site-seo'

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
