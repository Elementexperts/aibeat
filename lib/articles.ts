import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'

const ARTICLES_DIR = path.join(process.cwd(), 'content/articles')

export interface Article {
  slug: string
  title: string
  deck: string
  category: 'breaking' | 'news' | 'tools' | 'compare' | 'deep-dive'
  author: string
  publishedAt: string
  readTime: number
  featured: boolean
  content: string
  coverImageUrl?: string
  coverImageSource?: string
  coverImageSourceUrl?: string
  relatedTools?: string[]
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
  return readAllArticles()
}

export function getArticleBySlug(slug: string): Article | null {
  return readAllArticles().find(a => a.slug === slug) ?? null
}

export function getFeaturedArticles(): Article[] {
  return readAllArticles().filter(a => a.featured)
}
