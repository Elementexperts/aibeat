import { MetadataRoute } from 'next'
import { ARTICLES, TOOLS, COMPARISONS } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.aibeat.dev'

  const staticPages = [
    '',
    '/news',
    '/tools',
    '/compare',
    '/directory',
    '/free-tools',
    '/free-tools/roi-calculator',
    '/newsletter',
    '/submit',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const articlePages = ARTICLES.map((article) => ({
    url: `${base}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: article.featured ? 0.9 : 0.7,
  }))

  const toolPages = TOOLS.map((tool) => ({
    url: `${base}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: tool.featured ? 0.8 : 0.7,
  }))

  const comparisonPages = COMPARISONS.map((comp) => ({
    url: `${base}/compare/${comp.slug}`,
    lastModified: new Date(comp.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...articlePages, ...toolPages, ...comparisonPages]
}
