import { HIGH_RISK, classifySource } from './config'
import { date, duplicateEvent, numbers } from './gate'
import type { HistoricalStory } from './types'

export function auditStories(stories: Array<HistoricalStory & { content?: string }>) {
  return stories.map(story => {
    const flags: string[] = []
    const sources = story.sources || []
    if (!sources.length) flags.push('MISSING_SOURCES')
    if (!Number.isFinite(date(story.publishedAt || ''))) flags.push('INVALID_DATE')
    const body = story.title + ' ' + (story.deck || '') + ' ' + (story.content || '')
    if (numbers(body).length) flags.push('NUMERICAL_CLAIMS_REQUIRE_REVIEW')
    if (HIGH_RISK.test(body)) {
      flags.push('HIGH_RISK_CLAIMS_REQUIRE_REVIEW')
      if (!sources.some(source => { try { return classifySource(source.url).tier === 1 } catch { return false } })) flags.push('NO_PRIMARY_SOURCE')
    }
    if (sources.length === 1) flags.push('SINGLE_SOURCE')
    const event = story.newsEvent || { entities: story.title.match(/[A-Z][\w.-]{2,}/g) || [], action: '', product: '', eventDate: story.publishedAt }
    const duplicate = duplicateEvent(event, story.title, stories.filter(other => other.slug !== story.slug))
    if (duplicate) flags.push('POSSIBLE_DUPLICATE_STORY')
    return { slug: story.slug, title: story.title, flags, possibleDuplicate: duplicate?.slug }
  })
}
