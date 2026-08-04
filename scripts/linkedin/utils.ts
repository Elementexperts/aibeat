import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { LinkedInDraft, LinkedInHistory, LinkedInHistoryItem } from './types'

export function getLinkedInDataDir(dataDir = process.env.LINKEDIN_DATA_DIR || 'data/linkedin') {
  return join(process.cwd(), dataDir)
}

export function getLinkedInDraftsDir(dataDir?: string) {
  return join(getLinkedInDataDir(dataDir), 'drafts')
}

export function getLinkedInHistoryPath(dataDir?: string) {
  return join(getLinkedInDataDir(dataDir), 'history.json')
}

export function ensureLinkedInDataDirs(dataDir?: string) {
  mkdirSync(getLinkedInDraftsDir(dataDir), { recursive: true })
  const historyPath = getLinkedInHistoryPath(dataDir)
  mkdirSync(dirname(historyPath), { recursive: true })
  if (!existsSync(historyPath)) writeFileSync(historyPath, JSON.stringify({ posts: [] }, null, 2) + '\n', 'utf-8')
}

export function stableLinkedInContentHash(input: { title: string; body: string }) {
  return createHash('sha256').update(`${input.title.trim()}\n${input.body.trim()}`).digest('hex')
}

export function readLinkedInHistory(dataDir?: string): LinkedInHistory {
  ensureLinkedInDataDirs(dataDir)
  try {
    return JSON.parse(readFileSync(getLinkedInHistoryPath(dataDir), 'utf-8')) as LinkedInHistory
  } catch {
    return { posts: [] }
  }
}

export function writeLinkedInHistory(history: LinkedInHistory, dataDir?: string) {
  ensureLinkedInDataDirs(dataDir)
  writeFileSync(getLinkedInHistoryPath(dataDir), JSON.stringify(history, null, 2) + '\n', 'utf-8')
}

export function findDuplicateDraft(draft: LinkedInDraft, dataDir?: string) {
  const hash = stableLinkedInContentHash({ title: draft.title, body: draft.body })
  return readLinkedInHistory(dataDir).posts.find((item) => item.contentHash === hash || item.articleSlug === draft.articleSlug)
}

export function upsertLinkedInHistoryItem(item: LinkedInHistoryItem, dataDir?: string) {
  const history = readLinkedInHistory(dataDir)
  const next = history.posts.filter((existing) => existing.id !== item.id && existing.articleSlug !== item.articleSlug)
  next.unshift(item)
  writeLinkedInHistory({ posts: next.slice(0, 300) }, dataDir)
}

function yamlList(values: string[]) {
  return values.map((value) => `  - "${value.replace(/"/g, '\\"')}"`).join('\n')
}

export function draftFilename(draft: LinkedInDraft) {
  const date = draft.generatedAt.slice(0, 10)
  return `${date}-${draft.articleSlug}-${draft.id.slice(0, 8)}.md`
}

export function draftToMarkdown(draft: LinkedInDraft) {
  return [
    '---',
    `id: "${draft.id}"`,
    `articleSlug: "${draft.articleSlug}"`,
    `articleUrl: "${draft.articleUrl}"`,
    `generatedAt: "${draft.generatedAt}"`,
    'status: "draft"',
    draft.imageUrl ? `imageUrl: "${draft.imageUrl.replace(/"/g, '\\"')}"` : undefined,
    draft.imageSourceUrl ? `imageSourceUrl: "${draft.imageSourceUrl.replace(/"/g, '\\"')}"` : undefined,
    draft.hashtags.length ? 'hashtags:' : undefined,
    draft.hashtags.length ? yamlList(draft.hashtags) : undefined,
    draft.sourceUrls.length ? 'sourceUrls:' : undefined,
    draft.sourceUrls.length ? yamlList(draft.sourceUrls) : undefined,
    '---',
    '',
    '# LinkedIn Draft',
    '',
    draft.body,
    '',
  ].filter((line): line is string => line !== undefined).join('\n')
}

export function saveLinkedInDraft(draft: LinkedInDraft, dataDir?: string) {
  ensureLinkedInDataDirs(dataDir)
  const path = join(getLinkedInDraftsDir(dataDir), draftFilename(draft))
  writeFileSync(path, draftToMarkdown(draft), 'utf-8')
  return path
}
