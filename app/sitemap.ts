import { MetadataRoute } from 'next'
import { ARTICLES, TOOLS } from '@/lib/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://aibeat.dev'

  const staticPages = ['', '/news', '/tools', '/compare', '/directory', '/free-tools', '/newsletter'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const articlePages = ARTICLES.map((article) => ({
    url: `${base}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const toolPages = TOOLS.map((tool) => ({
    url: `${base}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...articlePages, ...toolPages]
}
