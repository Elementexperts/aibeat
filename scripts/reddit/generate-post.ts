import { randomUUID } from 'crypto'
import type { AINewsItem, RedditAutomationConfig, RedditPostDraft, RedditPostType } from './types'
import { loadRecentAIBeatContent } from './load-aibeat-content'
import { COMMUNITY_QUESTIONS, aiNewsRoundupTemplate, communityQuestionTemplate, createDraft, showAndTellTemplate, weeklyToolsTemplate } from './templates'
import { recentlyUsedQuestionTitles } from './duplicate-check'

function selectCommunityQuestion() {
  const used = new Set(recentlyUsedQuestionTitles())
  const unused = COMMUNITY_QUESTIONS.filter((question) => !used.has(question))
  return (unused[0] ?? COMMUNITY_QUESTIONS[0]) as string
}

function manualTemplate() {
  return {
    title: 'AIBeat community thread',
    body: 'Use this draft as a starting point for a manually edited r/AIBeat post.',
  }
}

export function generateRedditPost(options: {
  type: RedditPostType
  config: RedditAutomationConfig
  limit?: number
  date?: Date
  articles?: AINewsItem[]
}): RedditPostDraft {
  const generatedAt = (options.date ?? new Date()).toISOString()
  const base = {
    id: randomUUID(),
    type: options.type,
    subreddit: options.config.subreddit,
    generatedAt,
    scheduledFor: generatedAt,
  }

  if (options.type === 'weekly-tools') {
    return createDraft({ ...base, ...weeklyToolsTemplate() })
  }

  if (options.type === 'show-and-tell') {
    return createDraft({ ...base, ...showAndTellTemplate() })
  }

  if (options.type === 'community-question') {
    return createDraft({ ...base, ...communityQuestionTemplate(selectCommunityQuestion()) })
  }

  if (options.type === 'ai-news-roundup') {
    const articles = options.articles ?? loadRecentAIBeatContent({
      limit: options.limit ?? 5,
      days: 7,
      siteUrl: options.config.siteUrl,
      now: options.date,
    })
    const template = aiNewsRoundupTemplate(articles)
    return createDraft({ ...base, ...template })
  }

  return createDraft({ ...base, ...manualTemplate() })
}
