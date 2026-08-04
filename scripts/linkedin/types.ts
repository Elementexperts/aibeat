export type LinkedInPostStatus = 'drafted' | 'created' | 'failed' | 'skipped'

export type LinkedInTone = 'humanized' | 'founder' | 'editorial'

export type LinkedInArticleSource = {
  slug: string
  title: string
  deck: string
  category: string
  publishedAt: string
  url: string
  readTime?: number
  coverImageUrl?: string
  coverImageSource?: string
  coverImageSourceUrl?: string
}

export type LinkedInDraft = {
  id: string
  articleSlug: string
  articleUrl: string
  title: string
  body: string
  generatedAt: string
  status: 'draft'
  imageUrl?: string
  imageSourceUrl?: string
  sourceUrls: string[]
  hashtags: string[]
}

export type LinkedInHistoryItem = {
  id: string
  articleSlug: string
  articleUrl: string
  title: string
  generatedAt: string
  contentHash: string
  status: LinkedInPostStatus
  linkedInPostUrn?: string
  message?: string
}

export type LinkedInHistory = {
  posts: LinkedInHistoryItem[]
}

export type LinkedInAutomationConfig = {
  accessToken?: string
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  authorUrn?: string
  siteUrl: string
  dataDir: string
  draftCount: number
  lookbackDays: number
  dryRun: boolean
  createDraftsEnabled: boolean
  linkedinVersion: string
  tone: LinkedInTone
}
