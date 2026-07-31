export type RedditPostType =
  | 'weekly-tools'
  | 'ai-news-roundup'
  | 'show-and-tell'
  | 'community-question'
  | 'manual'

export type RedditHistoryStatus = 'drafted' | 'published' | 'failed' | 'skipped'

export interface RedditPostDraft {
  id: string
  type: RedditPostType
  title: string
  body: string
  subreddit: string
  flair?: string
  sourceUrls?: string[]
  generatedAt: string
  scheduledFor?: string
}

export interface RedditPostHistoryItem {
  id: string
  type: RedditPostType
  title: string
  generatedAt: string
  publishedAt?: string
  redditPostId?: string
  redditUrl?: string
  status: RedditHistoryStatus
  contentHash: string
}

export interface RedditHistory {
  posts: RedditPostHistoryItem[]
}

export interface AINewsItem {
  slug: string
  title: string
  summary?: string
  description?: string
  publishedAt: string
  url: string
  sourceUrl?: string
  category?: string
}

export interface RedditAutomationConfig {
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  userAgent: string
  subreddit: string
  publishEnabled: boolean
  dryRun: boolean
  siteUrl: string
}

export interface CliOptions {
  type: RedditPostType
  dryRun?: boolean
  publish?: boolean
  force: boolean
  limit: number
  date?: string
}

export interface PublishResult {
  id: string
  url: string
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}
