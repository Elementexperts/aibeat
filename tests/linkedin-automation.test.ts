import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getLinkedInConfig, getMissingLinkedInCredentials } from '../scripts/linkedin/config'
import { buildLinkedInDraftPayload, createLinkedInDraft, refreshLinkedInAccessToken } from '../scripts/linkedin/linkedin-client'
import { generateLinkedInDraft } from '../scripts/linkedin/generate-draft'
import { loadRecentAIBeatNews } from '../scripts/linkedin/load-aibeat-news'
import { runLinkedInAutomation } from '../scripts/linkedin'
import type { LinkedInArticleSource } from '../scripts/linkedin/types'

const originalCwd = process.cwd()
let tempRoot = ''

test.before(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'aibeat-linkedin-test-'))
  process.chdir(tempRoot)
  mkdirSync(join(tempRoot, 'content', 'articles'), { recursive: true })
})

test.after(() => {
  process.chdir(originalCwd)
})

function writeArticle(slug: string, date = '2026-08-04') {
  writeFileSync(join(tempRoot, 'content', 'articles', `${slug}.mdx`), [
    '---',
    `title: "AI agents reshape founder workflows ${slug}"`,
    'deck: "New AI agent capabilities are changing how small teams evaluate automation."',
    `slug: "${slug}"`,
    'category: "news"',
    `publishedAt: "${date}"`,
    'readTime: 4',
    'coverImageUrl: "https://example.com/image.jpg"',
    'coverImageSourceUrl: "https://example.com/story"',
    '---',
    '',
    '<p>Story body.</p>',
  ].join('\n'))
}

function article(overrides?: Partial<LinkedInArticleSource>): LinkedInArticleSource {
  return {
    slug: 'ai-agents',
    title: 'AI agents reshape founder workflows',
    deck: 'New AI agent capabilities are changing how small teams evaluate automation.',
    category: 'news',
    publishedAt: '2026-08-04',
    url: 'https://www.aibeat.dev/news/ai-agents',
    coverImageUrl: 'https://example.com/image.jpg',
    coverImageSourceUrl: 'https://example.com/story',
    ...overrides,
  }
}

test('loads recent AIBeat news from generated MDX files', () => {
  writeArticle('recent-linkedin-story')

  const items = loadRecentAIBeatNews({
    limit: 3,
    days: 7,
    siteUrl: 'https://www.aibeat.dev',
    now: new Date('2026-08-04T12:00:00Z'),
  })

  assert.equal(items[0]?.slug, 'recent-linkedin-story')
  assert.equal(items[0]?.url, 'https://www.aibeat.dev/news/recent-linkedin-story')
  assert.equal(items[0]?.coverImageSourceUrl, 'https://example.com/story')
})

test('generates humanized LinkedIn drafts with engagement question and source link', () => {
  const draft = generateLinkedInDraft({
    article: article(),
    tone: 'humanized',
    now: new Date('2026-08-04T12:00:00Z'),
  })

  assert.match(draft.body, /I saw this AI story today/)
  assert.match(draft.body, /today and it feels worth discussing:\n\nAI agents reshape/)
  assert.match(draft.body, /Why it matters:/)
  assert.match(draft.body, /Full AIBeat story: https:\/\/www\.aibeat\.dev\/news\/ai-agents/)
  assert.match(draft.body, /Image\/source reference: https:\/\/example\.com\/story/)
  assert.ok(draft.hashtags.includes('#AI'))
})

test('site URL is normalized when GitHub variables contain line breaks', () => {
  writeArticle('line-break-url-story')

  const items = loadRecentAIBeatNews({
    limit: 20,
    days: 7,
    siteUrl: 'https://aibeat.dev\r\n',
    now: new Date('2026-08-04T12:00:00Z'),
  })

  const item = items.find((entry) => entry.slug === 'line-break-url-story')
  assert.equal(item?.url, 'https://aibeat.dev/news/line-break-url-story')
})

test('LinkedIn draft payload uses DRAFT lifecycle and never publishes by default', () => {
  const draft = generateLinkedInDraft({ article: article(), tone: 'founder', now: new Date('2026-08-04T12:00:00Z') })
  const payload = buildLinkedInDraftPayload(draft, getLinkedInConfig({
    authorUrn: 'urn:li:person:test',
    accessToken: 'secret',
  }))

  assert.equal(payload.lifecycleState, 'DRAFT')
  assert.equal(payload.distribution.feedDistribution, 'NONE')
  assert.equal(payload.author, 'urn:li:person:test')
})

test('dry run writes exactly three local drafts and does not call LinkedIn', async () => {
  writeArticle('story-one')
  writeArticle('story-two')
  writeArticle('story-three')
  writeArticle('story-four')

  const results = await runLinkedInAutomation({
    now: new Date('2026-08-04T12:00:00Z'),
    config: {
      siteUrl: 'https://www.aibeat.dev',
      dataDir: 'data/linkedin-test',
      draftCount: 3,
      lookbackDays: 7,
      dryRun: true,
      createDraftsEnabled: false,
    },
  })

  assert.equal(results.length, 3)
  assert.equal(results.every((item) => item.status === 'drafted'), true)
  assert.equal(results.every((item) => item.draftPath && existsSync(item.draftPath)), true)
})

test('automation falls back to older recent articles when one-day content is thin', async () => {
  writeArticle('fresh-story', '2026-09-10')
  writeArticle('fallback-story-one', '2026-09-08')
  writeArticle('fallback-story-two', '2026-09-07')

  const results = await runLinkedInAutomation({
    now: new Date('2026-09-10T12:00:00Z'),
    config: {
      siteUrl: 'https://www.aibeat.dev',
      dataDir: 'data/linkedin-fallback-test',
      draftCount: 3,
      lookbackDays: 1,
      dryRun: true,
      createDraftsEnabled: false,
    },
  })

  assert.equal(results.length, 3)
  assert.ok(results.some((item) => item.draft.articleSlug === 'fresh-story'))
  assert.ok(results.some((item) => item.draft.articleSlug === 'fallback-story-one' || item.draft.articleSlug === 'fallback-story-two'))
})

test('missing credentials are detected before LinkedIn API draft creation', () => {
  const config = getLinkedInConfig({ accessToken: undefined, authorUrn: undefined })
  assert.deepEqual(getMissingLinkedInCredentials(config), ['LINKEDIN_ACCESS_TOKEN or LINKEDIN_REFRESH_TOKEN + LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET', 'LINKEDIN_AUTHOR_URN'])
})

test('refresh credentials satisfy LinkedIn access-token requirement', () => {
  const config = getLinkedInConfig({
    accessToken: undefined,
    clientId: 'client-id',
    clientSecret: 'client-secret',
    refreshToken: 'refresh-token',
    authorUrn: 'urn:li:person:test',
  })

  assert.deepEqual(getMissingLinkedInCredentials(config), [])
})

test('LinkedIn refresh token request uses OAuth refresh grant', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init || {} })
    return new Response(JSON.stringify({
      access_token: 'fresh-access-token',
      expires_in: 5184000,
      refresh_token_expires_in: 31536000,
    }), { status: 200 })
  }

  const result = await refreshLinkedInAccessToken({
    config: getLinkedInConfig({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    }),
    fetchImpl: fetchImpl as typeof fetch,
  })

  assert.equal(result.ok, true)
  assert.equal(result.accessToken, 'fresh-access-token')
  assert.equal(calls[0]?.url, 'https://www.linkedin.com/oauth/v2/accessToken')
  assert.match(String(calls[0]?.init.body), /grant_type=refresh_token/)
  assert.match(String(calls[0]?.init.body), /refresh_token=refresh-token/)
  assert.doesNotMatch(String(calls[0]?.init.body), /fresh-access-token/)
})

test('automation reports refresh failure without falling back to expired token', async () => {
  writeArticle('refresh-failure-story', '2026-10-01')
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => new Response('invalid refresh token', { status: 401 })) as typeof fetch

  try {
    const results = await runLinkedInAutomation({
      now: new Date('2026-10-01T12:00:00Z'),
      createDrafts: true,
      config: {
        siteUrl: 'https://www.aibeat.dev',
        dataDir: 'data/linkedin-refresh-failure-test',
        draftCount: 1,
        lookbackDays: 1,
        dryRun: false,
        createDraftsEnabled: true,
        accessToken: 'expired-token',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'bad-refresh-token',
        authorUrn: 'urn:li:person:test',
      },
    })

    assert.equal(results[0]?.status, 'failed')
    assert.match(results[0]?.message || '', /LinkedIn token refresh failed/)
    assert.doesNotMatch(results[0]?.message || '', /EXPIRED_ACCESS_TOKEN/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('LinkedIn client sends required versioned Posts API headers', async () => {
  const draft = generateLinkedInDraft({ article: article(), tone: 'editorial', now: new Date('2026-08-04T12:00:00Z') })
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init || {} })
    return new Response('', {
      status: 201,
      headers: { 'x-restli-id': 'urn:li:share:123' },
    })
  }

  const result = await createLinkedInDraft({
    draft,
    config: getLinkedInConfig({
      accessToken: 'secret',
      authorUrn: 'urn:li:person:test',
      linkedinVersion: '202604',
      dryRun: false,
      createDraftsEnabled: true,
    }),
    fetchImpl: fetchImpl as typeof fetch,
  })

  assert.equal(result.ok, true)
  assert.equal(result.postUrn, 'urn:li:share:123')
  assert.equal(calls[0]?.url, 'https://api.linkedin.com/rest/posts')
  const headers = calls[0]?.init.headers as Record<string, string>
  assert.equal(headers['Linkedin-Version'], '202604')
  assert.equal(headers['X-Restli-Protocol-Version'], '2.0.0')
  assert.match(String(calls[0]?.init.body), /"lifecycleState":"DRAFT"/)
})

test('history prevents duplicate LinkedIn drafts for the same article', async () => {
  const first = await runLinkedInAutomation({
    now: new Date('2026-08-04T13:00:00Z'),
    config: {
      siteUrl: 'https://www.aibeat.dev',
      dataDir: 'data/linkedin-duplicate-test',
      draftCount: 1,
      lookbackDays: 7,
      dryRun: true,
      createDraftsEnabled: false,
    },
  })
  const second = await runLinkedInAutomation({
    now: new Date('2026-08-04T13:05:00Z'),
    config: {
      siteUrl: 'https://www.aibeat.dev',
      dataDir: 'data/linkedin-duplicate-test',
      draftCount: 1,
      lookbackDays: 7,
      dryRun: true,
      createDraftsEnabled: false,
    },
  })

  assert.equal(first[0]?.status, 'drafted')
  assert.equal(second[0]?.status, 'skipped')
  const history = readFileSync(join(tempRoot, 'data', 'linkedin-duplicate-test', 'history.json'), 'utf-8')
  assert.match(history, /story/)
})
