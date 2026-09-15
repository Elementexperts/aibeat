import { createHash } from 'node:crypto'
import type { Metadata } from 'next'
import type { Article } from './articles'
import { breadcrumbs, canonicalUrl, DEFAULT_IMAGE, ORGANIZATION_ID, safeHttpUrl, SITE_URL } from './site-seo'

export function validDate(value?: string): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return undefined
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return undefined
  if (new Date(value.slice(0, 10)).toISOString().slice(0, 10) !== value.slice(0, 10)) return undefined
  return value
}

export function modifiedDate(article: Article) {
  const published = validDate(article.publishedAt)
  const updated = validDate(article.updatedAt)
  return updated && (!published || Date.parse(updated) >= Date.parse(published)) ? updated : published
}

export function articleImage(article: Article) {
  // Public pages only display prepared local covers. Match schema/social metadata to that UI.
  const local = /^\/news-images\/[a-f0-9]{20}-1200\.webp$/.test(article.coverImageUrl || '')
  return {
    url: local ? `${SITE_URL}${article.coverImageUrl}` : DEFAULT_IMAGE,
    width: local ? article.coverImageWidth || 1200 : 1200,
    height: local ? article.coverImageHeight || 630 : 630,
    alt: local ? article.coverImageAlt || article.title : 'AIBeat — AI news and tools',
  }
}

export function articleSources(article: Article) {
  const sources = article.sources?.length ? article.sources : article.coverImageSourceUrl ? [{ name: 'Original reporting', url: article.coverImageSourceUrl }] : []
  const seen = new Set<string>()
  return sources.flatMap((source) => {
    if (!/^https?:\/\//.test(source.url)) return []
    const url = safeHttpUrl(source.url)
    if (!url || seen.has(url)) return []
    seen.add(url)
    return [{ name: source.name || new URL(url).hostname, url }]
  })
}

export function articleRevision(article: Article) {
  return createHash('sha256').update(JSON.stringify([article.slug, article.title, article.deck, article.content, article.author, article.publishedAt, article.updatedAt, article.coverImageUrl, article.coverImageAlt, article.coverImageWidth, article.coverImageHeight, article.coverImageSource, article.coverImageSourceUrl, article.sources, article.category, article.tags, article.relatedTools])).digest('hex')
}

export function articleMetadata(article: Article): Metadata {
  const url = canonicalUrl(`/news/${article.slug}`)
  const image = articleImage(article)
  return {
    title: article.title, description: article.deck, alternates: { canonical: url },
    authors: article.author ? [{ name: article.author, ...(article.author.startsWith('AIBeat') ? { url: `${SITE_URL}/about` } : {}) }] : undefined,
    keywords: article.tags?.length ? article.tags : undefined,
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: { type: 'article', url, siteName: 'AIBeat', title: article.title, description: article.deck, images: [image], publishedTime: validDate(article.publishedAt), modifiedTime: modifiedDate(article), authors: article.author ? [article.author] : undefined, section: article.category, tags: article.tags },
    twitter: { card: 'summary_large_image', title: article.title, description: article.deck, images: [image] },
    other: { 'aibeat-content-revision': articleRevision(article), ...(process.env.VERCEL_GIT_COMMIT_SHA ? { 'aibeat-build-revision': process.env.VERCEL_GIT_COMMIT_SHA } : {}) },
  }
}

export function articleSchema(article: Article) {
  const url = canonicalUrl(`/news/${article.slug}`)
  const author = article.author ? { '@type': article.author.startsWith('AIBeat') ? 'Organization' : 'Person', name: article.author, ...(article.author.startsWith('AIBeat') ? { url: `${SITE_URL}/about` } : {}) } : undefined
  return {
    '@context': 'https://schema.org', '@type': 'NewsArticle', '@id': `${url}#article`,
    headline: article.title, description: article.deck, image: [articleImage(article).url],
    datePublished: validDate(article.publishedAt), dateModified: modifiedDate(article),
    author, publisher: { '@id': ORGANIZATION_ID }, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: article.category, inLanguage: 'en', citation: articleSources(article).map((source) => source.url),
  }
}

export function articleBreadcrumbs(article: Article) {
  return breadcrumbs([{ name: 'Home', path: '/' }, { name: 'AI News', path: '/news' }, { name: article.title, path: `/news/${article.slug}` }])
}
