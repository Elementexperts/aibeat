import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { AINewsItem } from './types'

type ArticleFrontmatter = {
  slug?: string
  title?: string
  deck?: string
  description?: string
  publishedAt?: string
  category?: string
  draft?: boolean
  published?: boolean
  coverImageSourceUrl?: string
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function excerptFromContent(content: string) {
  return stripHtml(content).slice(0, 260)
}

function isRecent(dateValue: string, days: number, now: Date) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000
  return date.getTime() >= cutoff
}

export function loadRecentAIBeatContent(options?: {
  limit?: number
  days?: number
  siteUrl?: string
  now?: Date
}): AINewsItem[] {
  const limit = options?.limit ?? 5
  const days = options?.days ?? 7
  const siteUrl = (options?.siteUrl ?? 'https://aibeat.dev').replace(/\/$/, '')
  const now = options?.now ?? new Date()
  const articlesDir = path.join(process.cwd(), 'content', 'articles')

  if (!fs.existsSync(articlesDir)) return []

  return fs
    .readdirSync(articlesDir)
    .filter((filename) => filename.endsWith('.mdx') || filename.endsWith('.md'))
    .map((filename): AINewsItem | null => {
      const raw = fs.readFileSync(path.join(articlesDir, filename), 'utf-8')
      const parsed = matter(raw)
      const data = parsed.data as ArticleFrontmatter
      if (data.draft || data.published === false) return null

      const slug = data.slug || filename.replace(/\.(mdx|md)$/, '')
      const title = data.title?.trim()
      const publishedAt = data.publishedAt?.trim()
      if (!slug || !title || !publishedAt) return null
      if (!isRecent(publishedAt, days, now)) return null

      const summary = data.deck || data.description || excerptFromContent(parsed.content)
      return {
        slug,
        title,
        summary,
        description: data.description || data.deck,
        publishedAt,
        url: `${siteUrl}/news/${slug}`,
        sourceUrl: data.coverImageSourceUrl,
        category: data.category,
      }
    })
    .filter((item): item is AINewsItem => item !== null)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, limit)
}
