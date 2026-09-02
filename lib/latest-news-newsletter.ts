import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import matter from 'gray-matter'
import type { Article } from './articles'

const DEFAULT_SITE_URL = 'https://www.aibeat.dev'
const DEFAULT_ARTICLE_LIMIT = 3
const FALLBACK_IMAGE_PATH = '/ai-news-banner.png'

export interface NewsletterStory {
  title: string
  slug: string
  deck: string
  publishedAt: string
  url: string
  imageUrl: string
  coverImageSource?: string
  coverImageSourceUrl?: string
}

export interface LatestNewsNewsletter {
  subject: string
  plainText: string
  html: string
  selectedArticles: NewsletterStory[]
}

export function buildLatestNewsNewsletter(input: { articles?: Article[]; articleLimit?: number; siteUrl?: string; now?: Date } = {}): LatestNewsNewsletter {
  const siteUrl = normalizeSiteUrl(input.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL)
  const configuredLimit = input.articleLimit ?? Number(process.env.NEWSLETTER_ARTICLE_LIMIT || DEFAULT_ARTICLE_LIMIT)
  const articleLimit = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : DEFAULT_ARTICLE_LIMIT
  const now = input.now ?? new Date()
  const selectedArticles = (input.articles ?? loadPublishedArticleFiles())
    .filter((article) => isPublishedArticle(article, now))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, articleLimit)
    .map((article) => toNewsletterStory(article, siteUrl))

  if (!selectedArticles.length) throw new Error('No valid published AIBeat articles are available for the newsletter.')

  const dateLine = `${formatEditionDate(now)}: The AI stories worth your attention`
  const subject = `AIBeat Weekly News: ${selectedArticles.length} AI ${selectedArticles.length === 1 ? 'story' : 'stories'} worth your attention`
  return {
    subject,
    selectedArticles,
    plainText: renderPlainText(dateLine, selectedArticles, siteUrl),
    html: renderHtml(dateLine, selectedArticles, siteUrl),
  }
}

function loadPublishedArticleFiles(): Article[] {
  const articlesDir = resolve(process.cwd(), 'content/articles')
  if (!existsSync(articlesDir)) return []
  return readdirSync(articlesDir).filter((file) => file.endsWith('.mdx')).map((file) => {
    const { data, content } = matter(readFileSync(join(articlesDir, file), 'utf8'))
    return { ...data, content } as Article
  })
}

function isPublishedArticle(article: Article, now: Date) {
  const publishedAt = new Date(article?.publishedAt)
  return Boolean(article?.slug?.trim() && article?.title?.trim() && !Number.isNaN(publishedAt.getTime()) && publishedAt.getTime() <= now.getTime())
}

function toNewsletterStory(article: Article, siteUrl: string): NewsletterStory {
  return {
    title: article.title.trim(),
    slug: article.slug.trim(),
    deck: article.deck?.trim() || excerptFromContent(article.content),
    publishedAt: article.publishedAt,
    url: `${siteUrl}/news/${encodeURIComponent(article.slug.trim())}`,
    imageUrl: resolveImageUrl(article.coverImageUrl, siteUrl),
    coverImageSource: article.coverImageSource,
    coverImageSourceUrl: validHttpUrl(article.coverImageSourceUrl) ? article.coverImageSourceUrl : undefined,
  }
}

function resolveImageUrl(value: string | undefined, siteUrl: string) {
  if (validHttpUrl(value)) return value!
  if (value?.startsWith('/')) return `${siteUrl}${value}`
  return `${siteUrl}${FALLBACK_IMAGE_PATH}`
}

function validHttpUrl(value: string | undefined) {
  if (!value) return false
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' } catch { return false }
}

function excerptFromContent(content: string) {
  const words = content.replace(/<[^>]*>/g, ' ').replace(/[#*_`>\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  return `${words.slice(0, 40).join(' ')}${words.length > 40 ? '…' : ''}`
}

function normalizeSiteUrl(value: string) {
  const normalized = value.replace(/\s+/g, '').replace(/\/$/, '')
  return /^https?:\/\//.test(normalized) ? normalized : DEFAULT_SITE_URL
}

function formatEditionDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Tashkent' }).format(date)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!))
}

function renderHtml(dateLine: string, stories: NewsletterStory[], siteUrl: string) {
  const storyHtml = stories.map((story) => `<tr><td style="padding:0 0 30px"><img src="${escapeHtml(story.imageUrl)}" width="620" alt="${escapeHtml(story.title)}" style="display:block;width:100%;max-width:620px;height:auto;border:0;border-radius:10px"><h2 style="margin:18px 0 8px;font-family:Georgia,serif;font-size:25px;line-height:1.25;color:#101820">${escapeHtml(story.title)}</h2><p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569">${escapeHtml(story.deck)}</p><a href="${escapeHtml(story.url)}" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#dc2626;text-decoration:none">Read the story →</a></td></tr>`).join('')
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:660px;background:#ffffff;border-radius:12px"><tr><td style="padding:32px 20px 18px;background:#101820;border-radius:12px 12px 0 0"><p style="margin:0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;color:#67e8f9">AIBeat Weekly</p><h1 style="margin:10px 0 8px;font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#ffffff">${escapeHtml(dateLine)}</h1><p style="margin:0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#cbd5e1">Useful AI news, product moves, startup signals, and practical context without the noise.</p></td></tr><tr><td style="padding:28px 20px"><p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:16px;color:#334155">Hi,</p><p style="margin:0 0 26px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#334155">Here are this week’s AI stories worth scanning.</p><h2 style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b">Top Stories</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${storyHtml}</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ecfeff;border-radius:10px"><tr><td style="padding:24px"><h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#101820">Building or launching an AI product?</h2><p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#475569">Submit it to AIBeat for directory discovery, newsletter consideration, or editorial coverage.</p><a href="${siteUrl}/submit" style="display:inline-block;padding:12px 16px;background:#101820;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">Submit your AI tool →</a></td></tr></table><p style="margin:28px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155">Best,<br><strong>AIBeat</strong><br><a href="${siteUrl}" style="color:#dc2626">aibeat.dev</a></p></td></tr><tr><td style="padding:22px 20px;background:#f8fafc;border-radius:0 0 12px 12px;font-family:Arial,sans-serif;font-size:12px;line-height:1.8;color:#64748b">Follow AIBeat: <a href="https://www.linkedin.com/company/aibeat-dev" style="color:#475569">LinkedIn</a> · <a href="https://wa.me/?text=${encodeURIComponent(siteUrl)}" style="color:#475569">WhatsApp</a> · <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}" style="color:#475569">Facebook</a><br><a href="${siteUrl}/unsubscribe" style="color:#64748b">Unsubscribe</a></td></tr></table></td></tr></table></body></html>`
}

function renderPlainText(dateLine: string, stories: NewsletterStory[], siteUrl: string) {
  const storyText = stories.map((story) => `${story.title}\n${story.deck}\nRead the story: ${story.url}`).join('\n\n')
  return `AIBeat Weekly\n${dateLine}\nUseful AI news, product moves, startup signals, and practical context without the noise.\n\nHi,\n\nHere are this week's AI stories worth scanning.\n\nTOP STORIES\n\n${storyText}\n\nBuilding or launching an AI product?\nSubmit it to AIBeat for directory discovery, newsletter consideration, or editorial coverage.\n${siteUrl}/submit\n\nBest,\nAIBeat\n${siteUrl}\n\nUnsubscribe: ${siteUrl}/unsubscribe`
}
