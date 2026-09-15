import type { Article } from './articles'
import { articleImage, validDate } from './article-seo'
import { canonicalUrl, SITE_URL } from './site-seo'

export function xml(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function publishedArticles(articles: Article[], now = new Date()) {
  const seen = new Set<string>()
  return articles.filter((a) => {
    if (a.draft || !a.title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || !validDate(a.publishedAt) || Date.parse(a.publishedAt) > now.getTime() || seen.has(a.slug)) return false
    seen.add(a.slug)
    return true
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.slug.localeCompare(b.slug))
}

export function newsSitemap(articles: Article[], now = new Date()) {
  const recent = publishedArticles(articles, now).filter((a) => now.getTime() - Date.parse(a.publishedAt) < 48 * 60 * 60 * 1000).slice(0, 1000)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${recent.map((a) => `<url><loc>${xml(canonicalUrl(`/news/${a.slug}`))}</loc><news:news><news:publication><news:name>AIBeat</news:name><news:language>en</news:language></news:publication><news:publication_date>${xml(a.publishedAt)}</news:publication_date><news:title>${xml(a.title)}</news:title></news:news></url>`).join('')}</urlset>`
}

export function rssFeed(articles: Article[], now = new Date()) {
  const recent = publishedArticles(articles, now).slice(0, 50)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>AIBeat AI News</title><link>${SITE_URL}/news</link><description>AI news, product launches and analysis from AIBeat.</description><language>en</language><atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>${recent.map((a) => {
    const url = xml(canonicalUrl(`/news/${a.slug}`))
    const image = articleImage(a)
    return `<item><title>${xml(a.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${xml(a.deck)}</description><pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>${a.author ? `<dc:creator>${xml(a.author)}</dc:creator>` : ''}<category>${xml(a.category)}</category><media:content url="${xml(image.url)}" medium="image" width="${image.width}" height="${image.height}"/></item>`
  }).join('')}</channel></rss>`
}
