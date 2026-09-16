import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'
import { publishedArticles } from './news-feeds'

const ARTICLES_DIR = path.join(process.cwd(), 'content/articles')

export interface Article {
  slug: string
  title: string
  deck: string
  category: 'breaking' | 'news' | 'tools' | 'compare' | 'deep-dive'
  author: string
  publishedAt: string
  updatedAt?: string
  draft?: boolean
  tags?: string[]
  sources?: Array<{ name: string; url: string }>
  readTime: number
  featured: boolean
  content: string
  coverImageUrl?: string
  coverImageAlt?: string
  coverImageWidth?: number
  coverImageHeight?: number
  coverImageSource?: string
  coverImageSourceUrl?: string
  qualityScore?: number
  sourceCount?: number
  primarySourceCount?: number
  newsEvent?: { entities: string[]; action: string; product: string; eventDate: string }
  relatedTools?: string[]
  relatedArticles?: string[]
}

// cache() deduplicates calls within a single request — no matter how many
// server components call getArticles(), the disk is read only once per render.
const readAllArticles = cache((): Article[] => {
  if (!fs.existsSync(ARTICLES_DIR)) return []

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(filename => {
      const raw  = fs.readFileSync(path.join(ARTICLES_DIR, filename), 'utf-8')
      const { data, content } = matter(raw)
      return { ...data, content } as Article
    })
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
})

export function getArticles(): Article[] {
  return publishedArticles(readAllArticles())
}

export function getArticleBySlug(slug: string): Article | null {
  return publishedArticles(readAllArticles()).find(a => a.slug === slug) ?? null
}

export function getFeaturedArticles(): Article[] {
  return publishedArticles(readAllArticles()).filter(a => a.featured)
}
