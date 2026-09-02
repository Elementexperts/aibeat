import assert from 'node:assert/strict'
import test from 'node:test'
import type { Article } from '../lib/articles'
import { buildLatestNewsNewsletter } from '../lib/latest-news-newsletter'
import { buildMimeMessage, createGmailNewsletterDraft, getGmailDraftConfig } from '../lib/gmail-newsletter-draft'
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

test('Gmail integration builds a multipart draft and never calls the send endpoint', async () => {
  const newsletter = buildLatestNewsNewsletter({ now: new Date('2026-09-02T12:00:00Z'), articles: [article({ slug: 'gmail-story', title: 'Gmail Story', deck: 'Verified copy.', publishedAt: '2026-09-02' })] })
  const config = { clientId: 'client', clientSecret: 'secret', refreshToken: 'refresh', to: 'editor@example.com', fromName: 'AIBeat', fromEmail: 'newsletter@example.com' }
  const calls: Array<{ url: string; body?: string }> = []
  const fetchImpl = async (request: string | URL | Request, init?: RequestInit) => {
    const url = String(request); calls.push({ url, body: typeof init?.body === 'string' ? init.body : undefined })
    if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'access', scope: 'https://www.googleapis.com/auth/gmail.compose' })
    if (url.includes('/drafts?')) return Response.json({ drafts: [] })
    return Response.json({ id: 'draft-123' })
  }
  const result = await createGmailNewsletterDraft({ newsletter, config, fetchImpl: fetchImpl as typeof fetch })
  assert.deepEqual(result, { created: true, draftId: 'draft-123', duplicate: false })
  assert.equal(calls.some((call) => call.url.includes('/drafts/send')), false)
  assert.equal(calls.at(-1)?.url, 'https://gmail.googleapis.com/gmail/v1/users/me/drafts')
  const encodedRaw = JSON.parse(calls.at(-1)?.body ?? '{}').message.raw as string
  const raw = Buffer.from(encodedRaw, 'base64url').toString('utf8')
  assert.match(raw, /Content-Type: multipart\/alternative/)
  assert.match(raw, /X-AIBeat-Newsletter-Key:/)
  assert.match(buildMimeMessage(newsletter, config), /To: editor@example\.com/)
})

test('Gmail integration skips a draft with the same newsletter key', async () => {
  const newsletter = buildLatestNewsNewsletter({ now: new Date('2026-09-02T12:00:00Z'), articles: [article({ slug: 'same-story', title: 'Same Story', publishedAt: '2026-09-02' })] })
  const calls: string[] = []
  const fetchImpl = async (request: string | URL | Request) => {
    const url = String(request); calls.push(url)
    if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'access' })
    if (url.includes('/drafts?')) return Response.json({ drafts: [{ id: 'existing-1' }] })
    return Response.json({ message: { payload: { headers: [{ name: 'X-AIBeat-Newsletter-Key', value: 'aibeat-weekly-same-story' }] } } })
  }
  const result = await createGmailNewsletterDraft({ newsletter, config: { clientId: 'client', clientSecret: 'secret', refreshToken: 'refresh', to: 'editor@example.com', fromEmail: 'newsletter@example.com' }, fetchImpl: fetchImpl as typeof fetch })
  assert.deepEqual(result, { created: false, draftId: 'existing-1', duplicate: true })
  assert.equal(calls.some((url) => url === 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'), false)
})

test('Gmail draft configuration is explicit and rejects missing secrets', () => {
  assert.throws(() => getGmailDraftConfig({}), /Missing Gmail draft configuration/)
  const config = getGmailDraftConfig({ GMAIL_CLIENT_ID: 'id', GMAIL_CLIENT_SECRET: 'secret', GMAIL_REFRESH_TOKEN: 'refresh', GMAIL_DRAFT_TO: 'editor@example.com', GMAIL_FROM_EMAIL: 'newsletter@example.com' })
  assert.equal(config.to, 'editor@example.com')
})
