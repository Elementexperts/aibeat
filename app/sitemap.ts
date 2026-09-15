import { MetadataRoute } from 'next'
import { TOOLS, COMPARISONS } from '@/lib/data'
import { getArticles } from '@/lib/articles'
import { modifiedDate, validDate } from '@/lib/article-seo'
import { canonicalUrl } from '@/lib/site-seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ['', '/news', '/tools', '/compare', '/directory', '/categories', '/ai-score',
    '/launches', '/for-founders', '/launch', '/spotlight', '/free-tools', '/free-tools/roi-calculator',
    '/business', '/business/demo', '/business/pricing', '/business/ai-spend-calculator',
    '/newsletter', '/submit', '/advertise', '/partners', '/claim', '/affiliate-disclosure', '/about', '/privacy']
  const pages: MetadataRoute.Sitemap = paths.map(path => ({ url: canonicalUrl(path) }))
  for (const article of getArticles()) pages.push({ url: canonicalUrl(`/news/${article.slug}`), lastModified: modifiedDate(article) })
  pages.push({ url: canonicalUrl('/news/best-ai-writing-tools-2026'), lastModified: '2026-05-28' })
  for (const tool of TOOLS) pages.push({ url: canonicalUrl(`/tools/${tool.slug}`) })
  for (const comparison of COMPARISONS) pages.push({ url: canonicalUrl(`/compare/${comparison.slug}`), lastModified: validDate(comparison.publishedAt) })
  return Array.from(new Map(pages.map(page => [page.url, page])).values())
}
