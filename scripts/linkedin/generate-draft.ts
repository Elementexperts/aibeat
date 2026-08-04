import { createHash } from 'crypto'
import type { LinkedInArticleSource, LinkedInDraft, LinkedInTone } from './types'

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function firstSentence(value: string) {
  const cleaned = cleanText(value)
  const match = cleaned.match(/^(.+?[.!?])(\s|$)/)
  return match?.[1] || cleaned
}

function hashtagsFor(article: LinkedInArticleSource) {
  const text = `${article.title} ${article.deck} ${article.category}`.toLowerCase()
  const tags = ['#AI', '#ArtificialIntelligence', '#AINews']

  if (/startup|funding|raise|valuation|founder|launch/.test(text)) tags.push('#Startups')
  if (/developer|coding|code|software|open source|github/.test(text)) tags.push('#Developers')
  if (/enterprise|business|workflow|productivity/.test(text)) tags.push('#BusinessAI')
  if (/policy|regulation|law|copyright|safety/.test(text)) tags.push('#AIPolicy')
  if (/model|llm|gpt|claude|gemini|openai|anthropic/.test(text)) tags.push('#LLM')

  return Array.from(new Set(tags)).slice(0, 5)
}

function questionFor(article: LinkedInArticleSource) {
  const text = `${article.title} ${article.deck}`.toLowerCase()
  if (/startup|funding|launch|founder/.test(text)) return 'What would make you trust a new AI startup enough to try it?'
  if (/developer|coding|code|software/.test(text)) return 'Would this change how your team builds or ships software?'
  if (/policy|regulation|law|copyright|safety/.test(text)) return 'Where do you think the line should be between speed and guardrails?'
  if (/model|llm|agent|openai|anthropic|google/.test(text)) return 'Is this a meaningful shift, or just another fast-moving AI headline?'
  return 'What is your read on this: useful signal, or mostly noise?'
}

function introFor(tone: LinkedInTone) {
  if (tone === 'founder') return 'A founder lens on today\'s AI news:'
  if (tone === 'editorial') return 'One AI story worth slowing down for today:'
  return 'I saw this AI story today and it feels worth discussing:'
}

function imageLine(article: LinkedInArticleSource) {
  if (!article.coverImageUrl) return ''
  const source = article.coverImageSourceUrl || article.coverImageUrl
  return `\n\nImage/source reference: ${source}`
}

export function generateLinkedInDraft(input: {
  article: LinkedInArticleSource
  tone: LinkedInTone
  now?: Date
}): LinkedInDraft {
  const article = input.article
  const generatedAt = (input.now || new Date()).toISOString()
  const insight = firstSentence(article.deck || article.title)
  const hashtags = hashtagsFor(article)
  const sourceUrls = [article.url, article.coverImageSourceUrl].filter((url): url is string => Boolean(url))
  const id = createHash('sha256').update(`${article.slug}:${generatedAt.slice(0, 10)}:linkedin`).digest('hex')

  const body = [
    introFor(input.tone),
    '',
    `${article.title}`,
    '',
    insight,
    '',
    'Why it matters:',
    `- For builders: it is another signal of where AI products are moving.`,
    `- For founders: the opportunity is not just to chase the headline, but to understand what users will actually adopt.`,
    `- For teams: the practical question is whether this creates a workflow advantage or just another tool to evaluate.`,
    '',
    questionFor(article),
    '',
    `Full AIBeat story: ${article.url}`,
    imageLine(article),
    '',
    hashtags.join(' '),
  ].filter((line): line is string => line !== undefined).join('\n')

  return {
    id,
    articleSlug: article.slug,
    articleUrl: article.url,
    title: article.title,
    body,
    generatedAt,
    status: 'draft',
    imageUrl: article.coverImageUrl,
    imageSourceUrl: article.coverImageSourceUrl,
    sourceUrls,
    hashtags,
  }
}
