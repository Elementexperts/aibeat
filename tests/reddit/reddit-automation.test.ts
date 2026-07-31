import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getRedditConfig } from '../../scripts/reddit/config'
import { generateRedditPost } from '../../scripts/reddit/generate-post'
import { getContentHash, readHistory } from '../../scripts/reddit/duplicate-check'
import { publishOrDraftPost } from '../../scripts/reddit/publish-post'
import { validateRedditPost } from '../../scripts/reddit/validation'
import { loadRecentAIBeatContent } from '../../scripts/reddit/load-aibeat-content'
import type { AINewsItem, RedditPostDraft } from '../../scripts/reddit/types'

const originalCwd = process.cwd()
let tempRoot = ''

test.before(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'aibeat-reddit-test-'))
  process.chdir(tempRoot)
  process.env.REDDIT_DATA_DIR = 'data/reddit-test'
  mkdirSync(join(tempRoot, 'content', 'articles'), { recursive: true })
})

test.after(() => {
  process.chdir(originalCwd)
  delete process.env.REDDIT_DATA_DIR
})

function config() {
  return getRedditConfig({
    subreddit: 'AIBeat',
    siteUrl: 'https://aibeat.dev',
    dryRun: true,
    publishEnabled: false,
  })
}

function sampleDraft(overrides?: Partial<RedditPostDraft>): RedditPostDraft {
  return {
    id: 'test-draft',
    type: 'weekly-tools',
    title: 'What AI tools did you discover this week?',
    body: 'Share an AI tool you discovered or used this week.',
    subreddit: 'AIBeat',
    generatedAt: '2026-07-31T00:00:00.000Z',
    ...overrides,
  }
}

test('weekly-tools post generation', () => {
  const draft = generateRedditPost({ type: 'weekly-tools', config: config(), date: new Date('2026-07-31') })
  assert.equal(draft.type, 'weekly-tools')
  assert.match(draft.title, /AI tools/)
  assert.match(draft.body, /Self-promotion/)
})

test('AI-news-roundup generation', () => {
  const articles: AINewsItem[] = [
    {
      slug: 'sample',
      title: 'AI model update changes developer workflows',
      summary: 'A major AI model update shipped this week. Developers are evaluating what it means for production apps.',
      publishedAt: '2026-07-31',
      url: 'https://aibeat.dev/news/sample',
      category: 'news',
    },
  ]
  const draft = generateRedditPost({ type: 'ai-news-roundup', config: config(), articles })
  assert.match(draft.title, /This Week in AI/)
  assert.match(draft.body, /AI model update/)
  assert.equal(draft.sourceUrls?.length, 1)
})

test('empty article list behavior', () => {
  const draft = generateRedditPost({ type: 'ai-news-roundup', config: config(), articles: [] })
  assert.match(draft.body, /No recent AIBeat stories/)
})

test('duplicate detection', async () => {
  const draft = sampleDraft({ id: 'duplicate-one' })
  const first = await publishOrDraftPost({ draft, config: config(), publishRequested: false })
  const second = await publishOrDraftPost({ draft: { ...draft, id: 'duplicate-two' }, config: config(), publishRequested: false })
  assert.equal(first.status, 'drafted')
  assert.equal(second.status, 'skipped')
})

test('stable content hash generation', () => {
  const a = getContentHash(sampleDraft({ id: 'a' }))
  const b = getContentHash(sampleDraft({ id: 'b' }))
  assert.equal(a, b)
})

test('dry-run behavior', async () => {
  const result = await publishOrDraftPost({ draft: sampleDraft({ id: 'dry-run' }), config: config(), publishRequested: true, force: true })
  assert.equal(result.status, 'drafted')
  assert.match(result.message, /REDDIT_PUBLISH_ENABLED is false/)
})

test('missing credentials behavior', async () => {
  const cfg = getRedditConfig({
    publishEnabled: true,
    dryRun: false,
    subreddit: 'AIBeat',
    clientId: undefined,
    clientSecret: undefined,
    refreshToken: undefined,
  })
  const result = await publishOrDraftPost({ draft: sampleDraft({ id: 'missing-creds' }), config: cfg, publishRequested: true, force: true })
  assert.equal(result.status, 'drafted')
  assert.match(result.message, /missing credentials/)
})

test('publish-disabled behavior', async () => {
  const result = await publishOrDraftPost({ draft: sampleDraft({ id: 'publish-disabled' }), config: config(), publishRequested: true, force: true })
  assert.equal(result.status, 'drafted')
  assert.match(result.message, /REDDIT_PUBLISH_ENABLED is false/)
})

test('title validation', () => {
  const result = validateRedditPost(sampleDraft({ title: 'x'.repeat(301) }))
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /longer than 300/)
})

test('history file updates', async () => {
  await publishOrDraftPost({ draft: sampleDraft({ id: 'history-update' }), config: config(), publishRequested: false, force: true })
  const history = readHistory()
  assert.ok(history.posts.some((post) => post.id === 'history-update' && post.status === 'drafted'))
})

test('AIBeat link-limit validation', () => {
  const result = validateRedditPost(sampleDraft({
    body: 'Read https://aibeat.dev and also https://www.aibeat.dev/news/sample',
  }))
  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /more than one AIBeat/)
})

test('community-question rotation', async () => {
  const first = generateRedditPost({ type: 'community-question', config: config(), date: new Date('2026-07-31') })
  await publishOrDraftPost({ draft: first, config: config(), publishRequested: false, force: true })
  const second = generateRedditPost({ type: 'community-question', config: config(), date: new Date('2026-08-01') })
  assert.notEqual(first.title, second.title)
})

test('loads recent local AIBeat content', () => {
  const articlePath = join(tempRoot, 'content', 'articles', 'recent-story.mdx')
  writeFileSync(articlePath, [
    '---',
    'title: "Recent AI story"',
    'deck: "A short stored summary."',
    'slug: "recent-story"',
    'category: "news"',
    'publishedAt: "2026-07-30"',
    'featured: false',
    '---',
    '',
    '<p>Body content.</p>',
  ].join('\n'))

  const items = loadRecentAIBeatContent({
    limit: 5,
    days: 7,
    siteUrl: 'https://aibeat.dev',
    now: new Date('2026-07-31T12:00:00Z'),
  })
  assert.equal(items[0]?.slug, 'recent-story')
  assert.equal(items[0]?.summary, 'A short stored summary.')
  assert.equal(readFileSync(articlePath, 'utf-8').includes('Recent AI story'), true)
})
