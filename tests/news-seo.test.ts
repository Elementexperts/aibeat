import assert from 'node:assert/strict'
import test from 'node:test'
import Parser from 'rss-parser'
import type { Article } from '../lib/articles'
import { articleMetadata, articleSchema, articleSources, articleImage, articleRevision, validDate, modifiedDate } from '../lib/article-seo'
import { newsSitemap, rssFeed, publishedArticles } from '../lib/news-feeds'
import { canonicalUrl, jsonLd } from '../lib/site-seo'
import { indexNowPayload, submitIndexNow } from '../lib/indexnow'
import { toolSchema, articleMentionsTool } from '../lib/tool-seo'
import { TOOLS } from '../lib/data'

const now = new Date('2026-09-15T12:00:00Z')
const story: Article = { slug: 'example-news', title: 'A & B <launch>', deck: 'A concise summary.', author: 'AIBeat AI', category: 'news', publishedAt: '2026-09-15T09:00:00Z', readTime: 3, featured: false, content: '<p>Evidence.</p>' }

test('article metadata and schema use canonical URLs, real dates and the existing byline', () => {
  const metadata = articleMetadata(story)
  assert.deepEqual(metadata.alternates, { canonical: 'https://www.aibeat.dev/news/example-news' })
  const schema = articleSchema(story)
  assert.equal(schema.author?.name, 'AIBeat AI')
  assert.equal(schema.author?.['@type'], 'Organization')
  assert.equal(schema.datePublished, story.publishedAt)
  assert.equal(schema.dateModified, story.publishedAt)
  assert.equal(articleSchema({ ...story, author: '' }).author, undefined)
  assert.equal(modifiedDate({ ...story, updatedAt: '2026-01-01' }), story.publishedAt)
  assert.equal(modifiedDate({ ...story, updatedAt: '2026-09-15T10:00:00Z' }), '2026-09-15T10:00:00Z')
  assert.equal(validDate('2026-02-30'), undefined)
  assert.equal(validDate('yesterday'), undefined)
  assert.equal(validDate('2026-09-15'), '2026-09-15')
  assert.equal(canonicalUrl('https://aibeat.dev/news/example-news/?utm_source=test#intro'), 'https://www.aibeat.dev/news/example-news')
})

test('images preserve existing covers, support new dimensions, and use a branded fallback', () => {
  const coverImageUrl = '/news-images/1234567890abcdef1234-1200.webp'
  assert.equal(articleImage({ ...story, coverImageUrl }).height, 630)
  assert.equal(articleImage({ ...story, coverImageUrl, coverImageHeight: 675 }).height, 675)
  assert.equal(articleImage(story).url, 'https://www.aibeat.dev/og-image.png')
  assert.equal(articleImage({ ...story, coverImageUrl }).alt, story.title)
})

test('sources reject executable URLs and JSON-LD cannot close its script element', () => {
  assert.deepEqual(articleSources({ ...story, sources: [{ name: 'Unsafe', url: 'javascript:alert(1)' }, { name: 'Report', url: 'https://example.com/a' }, { name: 'Duplicate', url: 'https://example.com/a' }] }), [{ name: 'Report', url: 'https://example.com/a' }])
  assert.ok(!jsonLd({ title: '</script><script>alert(1)</script>' }).includes('<'))
  assert.equal(articleRevision(story), articleRevision({ ...story }))
  assert.notEqual(articleRevision(story), articleRevision({ ...story, content: '<p>Correction.</p>' }))
})

test('news sitemap includes only eligible last-48-hour stories, escapes XML and caps at 1000', () => {
  const articles = [story, { ...story, slug: 'old', publishedAt: '2026-09-13T12:00:00Z' }, { ...story, slug: 'future', publishedAt: '2026-09-16' }, { ...story, slug: 'draft', draft: true }, { ...story, slug: 'invalid', publishedAt: 'bad' }]
  const xml = newsSitemap(articles, now)
  assert.ok(xml.includes('A &amp; B &lt;launch&gt;'))
  assert.ok(!xml.includes('/news/old'))
  assert.ok(!xml.includes('/news/future'))
  assert.ok(!xml.includes('/news/draft'))
  assert.ok(newsSitemap([], now).endsWith('</urlset>'))
  assert.equal((newsSitemap(Array.from({ length: 1005 }, (_, i) => ({ ...story, slug: `news-${i}` })), now).match(/<url>/g) || []).length, 1000)
  assert.equal(publishedArticles(articles, now).length, 2)
})

test('RSS parses as XML and preserves titles, order, author, date, and canonical GUID', async () => {
  const result = await new Parser().parseString(rssFeed([{ ...story, slug: 'older', publishedAt: '2026-09-14' }, story], now))
  assert.equal(result.items.length, 2)
  assert.equal(result.items[0].title, story.title)
  assert.equal(result.items[0].creator, story.author)
  assert.equal(result.items[0].guid, 'https://www.aibeat.dev/news/example-news')
  assert.equal(result.items[0].isoDate, new Date(story.publishedAt).toISOString())
})

test('IndexNow scopes requests to canonical news and makes provider failure nonfatal', async () => {
  const key = '1234567890abcdef'
  const url = 'https://www.aibeat.dev/news/example-news'
  assert.deepEqual(indexNowPayload(key, [url, url, 'https://other.test/news/a', `${url}?x=1`, 'https://www.aibeat.dev/business/dashboard']).urlList, [url])
  assert.throws(() => indexNowPayload('bad', [url]))
  const success = await submitIndexNow(key, [url], (async () => new Response('', { status: 202 })) as typeof fetch)
  assert.equal(success.submitted, 1)
  const failure = await submitIndexNow(key, [url], (async () => { throw new Error('offline') }) as typeof fetch)
  assert.equal(failure.submitted, 0)
  assert.equal(failure.error, 'offline')
})

test('tool schema does not reinterpret editorial scores or pricing prose as ratings or offers', () => {
  const schema = toolSchema(TOOLS[0])
  assert.ok(!('aggregateRating' in schema))
  assert.ok(!('offers' in schema))
  assert.equal(schema.name, TOOLS[0].name)
  assert.equal(toolSchema(TOOLS.find(tool => tool.slug === 'alchemy-leads')!)['@type'], 'Service')
  assert.equal(articleMentionsTool({ ...story, relatedTools: [TOOLS[0].slug] }, TOOLS[0]), true)
  assert.equal(articleMentionsTool(story, TOOLS[0]), false)
})


test('news search titles retain the factual headline without an inherited brand suffix', () => {
  assert.deepEqual(articleMetadata(story).title, { absolute: story.title })
  assert.equal(articleSchema(story).headline, story.title)
})
