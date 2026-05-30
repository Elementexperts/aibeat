// ============================================================
// AIBeat — Sanity Client & Query Helpers
// Project ID: uk52fboh
// ============================================================
import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: 'uk52fboh',
  dataset: 'production',
  apiVersion: '2026-05-30',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN?.trim(),
})

// ─── Query Helpers ───────────────────────────────────────────

/** Fetch all published articles ordered by date */
export async function getArticles() {
  return sanityClient.fetch<Article[]>(`
    *[_type == "article" && status == "published"]
    | order(publishedAt desc) {
      slug,
      title,
      deck,
      category,
      author,
      publishedAt,
      readTime,
      featured,
      content,
      relatedTools,
      status
    }
  `)
}

/** Fetch a single article by slug */
export async function getArticleBySlug(slug: string) {
  return sanityClient.fetch<Article | null>(`
    *[_type == "article" && slug == $slug && status == "published"][0] {
      slug,
      title,
      deck,
      category,
      author,
      publishedAt,
      readTime,
      featured,
      content,
      relatedTools
    }
  `, { slug })
}

/** Fetch only featured articles (for homepage hero) */
export async function getFeaturedArticles() {
  return sanityClient.fetch<Article[]>(`
    *[_type == "article" && status == "published" && featured == true]
    | order(publishedAt desc) {
      slug,
      title,
      deck,
      category,
      author,
      publishedAt,
      readTime,
      featured,
      content,
      relatedTools
    }
  `)
}

/** Fetch articles by category */
export async function getArticlesByCategory(category: string) {
  return sanityClient.fetch<Article[]>(`
    *[_type == "article" && status == "published" && category == $category]
    | order(publishedAt desc) {
      slug,
      title,
      deck,
      category,
      author,
      publishedAt,
      readTime,
      featured,
      content,
      relatedTools
    }
  `, { category })
}

/** Fetch all articles pending review (for the n8n → Slack approval flow) */
export async function getDraftArticles() {
  return sanityClient.fetch<Article[]>(`
    *[_type == "article" && status == "review"]
    | order(_createdAt desc) {
      _id,
      slug,
      title,
      deck,
      category,
      publishedAt,
      status
    }
  `)
}

/** Publish a draft article by its Sanity document ID */
export async function publishArticle(documentId: string) {
  return sanityClient
    .patch(documentId)
    .set({ status: 'published' })
    .commit()
}

// ─── Type (mirrors your existing Article interface) ──────────

export interface Article {
  _id?: string
  slug: string
  title: string
  deck: string
  category: 'breaking' | 'news' | 'tools' | 'compare' | 'deep-dive'
  author: string
  publishedAt: string
  readTime: number
  featured: boolean
  content?: string
  relatedTools?: string[]
  status?: 'draft' | 'review' | 'published'
}
