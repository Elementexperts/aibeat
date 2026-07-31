import { getMissingRedditCredentials } from './config'
import { createHistoryItem, findDuplicate, upsertHistoryItem } from './duplicate-check'
import { RedditClient } from './reddit-client'
import { saveDraft } from './utils'
import { validateRedditPost } from './validation'
import type { RedditAutomationConfig, RedditPostDraft } from './types'

export async function publishOrDraftPost(input: {
  draft: RedditPostDraft
  config: RedditAutomationConfig
  force?: boolean
  publishRequested?: boolean
}) {
  const duplicate = findDuplicate(input.draft)
  if (duplicate && !input.force) {
    upsertHistoryItem(createHistoryItem(input.draft, 'skipped'))
    return {
      status: 'skipped' as const,
      draftPath: saveDraft(input.draft),
      message: `Duplicate skipped. Existing history id: ${duplicate.id}`,
    }
  }

  const validation = validateRedditPost(input.draft)
  if (!validation.ok) {
    upsertHistoryItem(createHistoryItem(input.draft, 'failed'))
    return {
      status: 'failed' as const,
      draftPath: saveDraft(input.draft),
      message: `Validation failed: ${validation.errors.join('; ')}`,
    }
  }

  const draftPath = saveDraft(input.draft)
  const missing = getMissingRedditCredentials(input.config)
  const canPublish =
    input.publishRequested === true &&
    input.config.publishEnabled &&
    !input.config.dryRun &&
    missing.length === 0

  if (!canPublish) {
    upsertHistoryItem(createHistoryItem(input.draft, 'drafted'))
    const reasons = [
      input.publishRequested !== true ? 'publish was not requested' : undefined,
      !input.config.publishEnabled ? 'REDDIT_PUBLISH_ENABLED is false' : undefined,
      input.config.dryRun ? 'REDDIT_DRY_RUN is true' : undefined,
      missing.length ? `missing credentials: ${missing.join(', ')}` : undefined,
    ].filter(Boolean)
    return {
      status: 'drafted' as const,
      draftPath,
      message: `Draft saved. Publishing skipped because ${reasons.join('; ')}.`,
    }
  }

  try {
    const client = new RedditClient(input.config)
    const published = await client.submitTextPost({
      subreddit: input.draft.subreddit,
      title: input.draft.title,
      text: input.draft.body,
    })
    upsertHistoryItem(createHistoryItem(input.draft, 'published', {
      publishedAt: new Date().toISOString(),
      redditPostId: published.id,
      redditUrl: published.url,
    }))
    saveDraft(input.draft, 'published')
    return {
      status: 'published' as const,
      draftPath,
      redditUrl: published.url,
      message: `Published to Reddit: ${published.url}`,
    }
  } catch (err) {
    upsertHistoryItem(createHistoryItem(input.draft, 'failed'))
    return {
      status: 'failed' as const,
      draftPath,
      message: err instanceof Error ? err.message : 'Unknown Reddit publishing error',
    }
  }
}
