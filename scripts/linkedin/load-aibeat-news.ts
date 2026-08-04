import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import matter from 'gray-matter'
import type { LinkedInArticleSource } from './types'

function getArticlesDir() {
  return resolve(process.cwd(), 'content/articles')
}

function parseDate(value: unknown) {
  const date = typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function cleanSiteUrl(value: string) {
  return value.replace(/\/$/, '')
}

export function loadRecentAIBeatNews(input: {
  limit: number
  days: number
  siteUrl: string
  now?: Date
}): LinkedInArticleSource[] {
  const articlesDir = getArticlesDir()
  if (!existsSync(articlesDir)) return []

  const now = input.now || new Date()
  const cutoff = now.getTime() - input.days * 24 * 60 * 60 * 1000
  const siteUrl = cleanSiteUrl(input.siteUrl)

  return readdirSync(articlesDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const raw = readFileSync(join(articlesDir, file), 'utf-8')
      const { data } = matter(raw)
      const slug = String(data.slug || file.replace(/\.mdx$/, ''))
      return {
        slug,
        title: String(data.title || slug),
        deck: String(data.deck || ''),
        category: String(data.category || 'news'),
        publishedAt: String(data.publishedAt || ''),
        readTime: Number(data.readTime || 0) || undefined,
        url: `${siteUrl}/news/${slug}`,
        coverImageUrl: typeof data.coverImageUrl === 'string' ? data.coverImageUrl : undefined,
        coverImageSource: typeof data.coverImageSource === 'string' ? data.coverImageSource : undefined,
        coverImageSourceUrl: typeof data.coverImageSourceUrl === 'string' ? data.coverImageSourceUrl : undefined,
      } satisfies LinkedInArticleSource
    })
    .filter((article) => {
      const publishedAt = parseDate(article.publishedAt)
      return publishedAt ? publishedAt.getTime() >= cutoff : false
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, input.limit)
}
