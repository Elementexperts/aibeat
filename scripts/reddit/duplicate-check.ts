import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { RedditHistory, RedditPostHistoryItem } from './types'
import { ensureRedditDataDirs, getRedditHistoryPath, stableContentHash } from './utils'
import type { RedditPostDraft } from './types'

export function readHistory(): RedditHistory {
  ensureRedditDataDirs()
  const historyPath = getRedditHistoryPath()
  if (!existsSync(historyPath)) return { posts: [] }

  try {
    const parsed = JSON.parse(readFileSync(historyPath, 'utf-8')) as RedditHistory
    return { posts: Array.isArray(parsed.posts) ? parsed.posts : [] }
  } catch {
    return { posts: [] }
  }
}

export function writeHistory(history: RedditHistory) {
  ensureRedditDataDirs()
  writeFileSync(getRedditHistoryPath(), JSON.stringify(history, null, 2) + '\n', 'utf-8')
}

export function getContentHash(draft: RedditPostDraft) {
  return stableContentHash({ type: draft.type, title: draft.title, body: draft.body })
}

export function findDuplicate(draft: RedditPostDraft) {
  const hash = getContentHash(draft)
  return readHistory().posts.find((post) => post.contentHash === hash)
}

export function upsertHistoryItem(item: RedditPostHistoryItem) {
  const history = readHistory()
  const existingIndex = history.posts.findIndex((post) => post.id === item.id)
  if (existingIndex >= 0) {
    history.posts[existingIndex] = item
  } else {
    history.posts.push(item)
  }
  writeHistory(history)
}

export function createHistoryItem(
  draft: RedditPostDraft,
  status: RedditPostHistoryItem['status'],
  extra?: Partial<RedditPostHistoryItem>,
): RedditPostHistoryItem {
  return {
    id: draft.id,
    type: draft.type,
    title: draft.title,
    generatedAt: draft.generatedAt,
    status,
    contentHash: getContentHash(draft),
    ...extra,
  }
}

export function recentlyUsedQuestionTitles() {
  return readHistory().posts
    .filter((post) => post.type === 'community-question')
    .map((post) => post.title)
}
