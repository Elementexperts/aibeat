import { createHash } from 'crypto'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { RedditPostDraft, RedditPostType } from './types'

export function getRedditDataDir() {
  return process.env.REDDIT_DATA_DIR
    ? join(process.cwd(), process.env.REDDIT_DATA_DIR)
    : join(process.cwd(), 'data', 'reddit')
}

export function getRedditDraftsDir() {
  return join(getRedditDataDir(), 'drafts')
}

export function getRedditHistoryPath() {
  return join(getRedditDataDir(), 'history.json')
}

export function ensureRedditDataDirs() {
  mkdirSync(getRedditDraftsDir(), { recursive: true })
  if (!existsWritableHistory()) {
    writeFileSync(getRedditHistoryPath(), JSON.stringify({ posts: [] }, null, 2) + '\n', 'utf-8')
  }
}

function existsWritableHistory() {
  try {
    mkdirSync(dirname(getRedditHistoryPath()), { recursive: true })
    return existsSync(getRedditHistoryPath())
  } catch {
    return false
  }
}

export function stableContentHash(input: { type: RedditPostType; title: string; body: string }) {
  return createHash('sha256')
    .update(`${input.type}\n${input.title.trim()}\n${input.body.trim()}`)
    .digest('hex')
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
}

export function draftFilename(draft: RedditPostDraft) {
  const date = (draft.scheduledFor || draft.generatedAt).slice(0, 10)
  return `${date}-${draft.type}-${draft.id.slice(0, 8)}.md`
}

export function draftToMarkdown(draft: RedditPostDraft, status: 'draft' | 'published' = 'draft') {
  const sourceUrls = draft.sourceUrls?.length ? draft.sourceUrls.map((url) => `  - "${url}"`).join('\n') : ''
  return [
    '---',
    `id: "${draft.id}"`,
    `type: "${draft.type}"`,
    `subreddit: "${draft.subreddit}"`,
    `generatedAt: "${draft.generatedAt}"`,
    draft.scheduledFor ? `scheduledFor: "${draft.scheduledFor}"` : undefined,
    `status: "${status}"`,
    sourceUrls ? 'sourceUrls:' : undefined,
    sourceUrls || undefined,
    '---',
    '',
    '# Title',
    '',
    draft.title,
    '',
    '# Body',
    '',
    draft.body,
    '',
  ].filter((line): line is string => line !== undefined).join('\n')
}

export function saveDraft(draft: RedditPostDraft, status: 'draft' | 'published' = 'draft') {
  ensureRedditDataDirs()
  const path = join(getRedditDraftsDir(), draftFilename(draft))
  writeFileSync(path, draftToMarkdown(draft, status), 'utf-8')
  return path
}

export function parseDate(value?: string) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`)
  return date
}

export function formatPreview(draft: RedditPostDraft) {
  return [
    `r/${draft.subreddit}`,
    '',
    `Title: ${draft.title}`,
    '',
    draft.body,
    '',
    draft.sourceUrls?.length ? `Source URLs:\n${draft.sourceUrls.map((url) => `- ${url}`).join('\n')}` : '',
  ].filter(Boolean).join('\n')
}
