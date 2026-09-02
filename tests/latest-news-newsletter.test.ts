import assert from 'node:assert/strict'
import test from 'node:test'
import type { Article } from '../lib/articles'
import { buildLatestNewsNewsletter } from '../lib/latest-news-newsletter'
import { getToolBySlug, getToolsByCategory, TOOLS } from '../lib/data'

function article(input: Partial<Article> & Pick<Article, 'slug' | 'title' | 'publishedAt'>): Article {
  return { deck: '', category: 'news', author: 'AIBeat', readTime: 3, featured: false, content: '<p>Deterministic article content supplies a safe excerpt without asking a model to create any additional claims or unsupported details for the newsletter.</p>', ...input }
}

test('latest-news newsletter selects the newest three valid published articles', () => {
  const newsletter = buildLatestNewsNewsletter({
    now: new Date('2026-09-02T12:00:00Z'),
    articles: [
      article({ slug: 'older', title: 'Older', publishedAt: '2026-08-30' }),
      article({ slug: 'newest', title: 'Newest', deck: 'Verified deck.', publishedAt: '2026-09-02', coverImageUrl: 'https://images.example/new.jpg', coverImageSource: 'og', coverImageSourceUrl: 'https://source.example/story' }),
      article({ slug: 'middle', title: 'Middle', publishedAt: '2026-09-01', coverImageUrl: '/local-news.jpg' }),
      article({ slug: 'third', title: 'Third', publishedAt: '2026-08-31' }),
      article({ slug: 'future', title: 'Future draft', publishedAt: '2026-09-03' }),
      article({ slug: '', title: 'Malformed', publishedAt: '2026-09-02' }),
    ],
  })
  assert.deepEqual(newsletter.selectedArticles.map((item) => item.slug), ['newest', 'middle', 'third'])
  assert.equal(newsletter.selectedArticles[0].url, 'https://www.aibeat.dev/news/newest')
  assert.equal(newsletter.selectedArticles[0].imageUrl, 'https://images.example/new.jpg')
  assert.equal(newsletter.selectedArticles[1].imageUrl, 'https://www.aibeat.dev/local-news.jpg')
  assert.equal(newsletter.selectedArticles[2].imageUrl, 'https://www.aibeat.dev/ai-news-banner.png')
})

test('newsletter HTML is email-safe, factual-source-only, and retains CTA and unsubscribe links', () => {
  const newsletter = buildLatestNewsNewsletter({ now: new Date('2026-09-02T12:00:00Z'), articles: [article({ slug: 'safe-story', title: 'Safe <Story>', deck: '', publishedAt: '2026-09-02' })] })
  assert.match(newsletter.html, /<table role="presentation"/)
  assert.match(newsletter.html, /Safe &lt;Story&gt;/)
  assert.match(newsletter.html, /https:\/\/www\.aibeat\.dev\/submit/)
  assert.match(newsletter.html, /https:\/\/www\.aibeat\.dev\/unsubscribe/)
  assert.match(newsletter.html, /display:block;width:100%;max-width:620px/)
  assert.doesNotMatch(newsletter.html, /<script/i)
  assert.match(newsletter.plainText, /Read the story: https:\/\/www\.aibeat\.dev\/news\/safe-story/)
})

test('Avenyora is a unique non-featured freemium AI Lifestyle listing', () => {
  const tool = getToolBySlug('avenyora')
  assert.ok(tool)
  assert.equal(TOOLS.filter((item) => item.slug === 'avenyora').length, 1)
  assert.equal(tool.category, 'AI Lifestyle')
  assert.equal(tool.pricingType, 'freemium')
  assert.equal(tool.pricing, 'Free tools · Premium readings available')
  assert.equal(tool.featured, false)
  assert.equal(tool.logoInitials, 'A')
  assert.equal(getToolsByCategory('AI Lifestyle').some((item) => item.slug === 'avenyora'), true)
})
