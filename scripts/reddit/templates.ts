import type { AINewsItem, RedditPostDraft, RedditPostType } from './types'

export const COMMUNITY_QUESTIONS = [
  'Which AI tool has saved you the most time recently?',
  'What is one AI feature you wish existed but still does not?',
  'Which AI subscription is actually worth paying for?',
  'What is the biggest problem with current AI tool directories?',
  'Are you using AI mainly for work, learning, coding, or creativity?',
]

export function weeklyToolsTemplate() {
  return {
    title: 'What AI tools did you discover this week?',
    body: `Share an AI tool you discovered or used this week.

Please include:

- What the tool does
- Who it is useful for
- Whether it is free or paid
- What you liked or disliked
- Whether you would recommend it

Self-promotion is allowed only when clearly disclosed and accompanied by useful context.

Let's help each other find genuinely useful AI tools.`,
  }
}

export function showAndTellTemplate() {
  return {
    title: 'Show us what you built with AI this week',
    body: `Built something with AI recently? Share it with the community.

You can post:

- AI apps
- Automations
- Agents
- Websites
- Prompts
- Creative projects
- Research experiments
- Open-source tools

Please include:

- What you built
- What problem it solves
- Which tools or models you used
- What feedback you are looking for

Constructive feedback is encouraged. Low-effort link drops may be removed.`,
  }
}

export function communityQuestionTemplate(question: string) {
  return {
    title: question,
    body: `${question}

Share your experience, context, and tradeoffs. Short answers are welcome, but the most useful replies usually include:

- What you tried
- What worked
- What did not work
- Whether you would recommend it to others`,
  }
}

function twoSentenceSummary(item: AINewsItem) {
  const source = item.summary || item.description || 'This AIBeat story covers a recent AI development and why it matters for builders.'
  const sentences = source
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 2)
  return sentences.join(' ')
}

function roundupTheme(items: AINewsItem[]) {
  const categories = new Set(items.map((item) => item.category).filter(Boolean))
  if (categories.has('tools') && categories.has('compare')) return 'tools, platforms, and practical tradeoffs'
  if (categories.has('breaking')) return 'major launches and fast-moving updates'
  if (categories.has('tools')) return 'new tools and product updates'
  return 'the latest AI shifts for builders'
}

export function aiNewsRoundupTemplate(items: AINewsItem[]) {
  const limited = items.slice(0, 5)
  const title = `This Week in AI: ${roundupTheme(limited)}`
  const storyLines = limited.map((item, index) => {
    return `${index + 1}. ${item.title}
   ${twoSentenceSummary(item)}`
  }).join('\n\n')
  const sourceLinks = limited.map((item) => `- ${item.sourceUrl || item.url}`).join('\n')

  return {
    title,
    body: `Here are some of the most important AI developments from the past week:

${storyLines || 'No recent AIBeat stories were available for this roundup.'}

Discussion questions:

- Which update matters most to you?
- What impact could these changes have?
- Did we miss an important story?

Source links:
${sourceLinks || '- No source links available'}

More AI coverage is available on AIBeat.dev.`,
    sourceUrls: limited.map((item) => item.sourceUrl || item.url),
  }
}

export function createDraft(input: {
  id: string
  type: RedditPostType
  title: string
  body: string
  subreddit: string
  generatedAt: string
  scheduledFor?: string
  sourceUrls?: string[]
}): RedditPostDraft {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    body: input.body,
    subreddit: input.subreddit,
    generatedAt: input.generatedAt,
    scheduledFor: input.scheduledFor,
    sourceUrls: input.sourceUrls,
  }
}
