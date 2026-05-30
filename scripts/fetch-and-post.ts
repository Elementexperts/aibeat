// ============================================================
// AIBeat — Daily News Automation Script
// Fetch AI news → Gemini Flash writes article → Save to Sanity
// Run manually: npx tsx scripts/fetch-and-post.ts
// ============================================================
import { config } from 'dotenv'
import { resolve }  from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@sanity/client'
import Parser          from 'rss-parser'

// ─── Config ──────────────────────────────────────────────────

const SANITY = createClient({
  projectId: 'uk52fboh',
  dataset:   'production',
  apiVersion: '2026-05-30',
  token:  process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL     =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// ─── RSS Feeds to monitor ────────────────────────────────────

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',                 source: 'VentureBeat' },
  { url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', source: 'The Verge' },
  { url: 'https://hnrss.org/frontpage?q=AI+LLM+GPT+Claude+Gemini',        source: 'Hacker News' },
]

// ─── Helpers ─────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function estimateReadTime(html: string): number {
  const words = html.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.max(3, Math.ceil(words / 200))
}

function detectCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase()
  if (text.match(/raises|funding|series|valuation|billion|million|invests/)) return 'news'
  if (text.match(/vs|versus|compared|comparison|better than/))              return 'compare'
  if (text.match(/how to|guide|tutorial|best \d|top \d|review/))           return 'tools'
  if (text.match(/regulation|policy|law|ban|eu|congress|government/))      return 'news'
  if (text.match(/breaking|just|announces|launches|releases|unveiled/))    return 'breaking'
  return 'news'
}

async function alreadyExists(title: string): Promise<boolean> {
  const slug = slugify(title)
  const existing = await SANITY.fetch(
    `*[_type == "article" && slug == $slug][0]._id`,
    { slug }
  )
  return !!existing
}

// ─── Gemini Flash — Write Article ────────────────────────────

async function writeArticle(item: {
  title: string
  summary: string
  source: string
  link: string
}): Promise<{ title: string; deck: string; content: string } | null> {
  const prompt = `You are the editorial AI for AIBeat.dev — a daily AI news site for developers, founders, and researchers.

Write a complete news article based on this story:

HEADLINE: ${item.title}
SUMMARY: ${item.summary}
SOURCE: ${item.source}
ORIGINAL URL: ${item.link}

Requirements:
- Write a punchy, improved headline (max 90 chars)
- Write a 1-2 sentence deck/sub-headline that explains why this matters
- Write the full article body in HTML using only: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>, <thead>, <tbody>, <tr>, <th>, <td>
- Length: 400-700 words
- Tone: Direct, editorial, developer-focused. No fluff. No "In conclusion".
- Include: what happened, why it matters, what developers/founders should do about it
- Do NOT include the headline or deck in the body HTML

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "title": "the improved headline",
  "deck": "the deck/sub-headline",
  "content": "the full article body HTML"
}`

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 2048,
        },
      }),
    })

    const data = await res.json()
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error(`  ⚠️  Gemini error for "${item.title}":`, err)
    return null
  }
}

// ─── Save to Sanity as Draft ─────────────────────────────────

async function saveToDraft(article: {
  title: string
  deck: string
  content: string
  category: string
  slug: string
}): Promise<void> {
  await SANITY.create({
    _type:       'article',
    slug:        article.slug,
    title:       article.title,
    deck:        article.deck,
    content:     article.content,
    category:    article.category,
    author:      'AIBeat AI',
    publishedAt: new Date().toISOString().slice(0, 10),
    readTime:    estimateReadTime(article.content),
    featured:    false,
    status:      'review',   // ← editor must approve before going live
  })
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('\n🤖 AIBeat Daily News Automation')
  console.log(`   ${new Date().toUTCString()}\n`)

  const parser   = new Parser()
  const cutoff   = Date.now() - 24 * 60 * 60 * 1000 // last 24 hours
  let   saved    = 0
  let   skipped  = 0
  let   failed   = 0

  for (const feed of RSS_FEEDS) {
    console.log(`📡 Fetching ${feed.source}...`)

    let feedData
    try {
      feedData = await parser.parseURL(feed.url)
    } catch {
      console.log(`  ⚠️  Could not fetch ${feed.url}`)
      continue
    }

    // Filter to items published in the last 24 hours
    const recent = feedData.items.filter((item) => {
      const pub = item.pubDate ? new Date(item.pubDate).getTime() : 0
      return pub > cutoff
    })

    console.log(`   Found ${recent.length} new items in the last 24h`)

    for (const item of recent.slice(0, 3)) { // max 3 per feed
      const title = item.title?.trim() ?? ''
      if (!title) continue

      // Skip if already in Sanity
      if (await alreadyExists(title)) {
        console.log(`  ⏭️  Already exists: "${title.slice(0, 60)}"`)
        skipped++
        continue
      }

      console.log(`  ✍️  Writing: "${title.slice(0, 60)}..."`)

      const summary = item.contentSnippet ?? item.content ?? item.summary ?? ''
      const generated = await writeArticle({
        title,
        summary: summary.slice(0, 500),
        source:  feed.source,
        link:    item.link ?? '',
      })

      if (!generated) { failed++; continue }

      const slug     = slugify(generated.title)
      const category = detectCategory(generated.title, generated.content)

      try {
        await saveToDraft({ ...generated, slug, category })
        console.log(`  ✅ Saved as draft: "${generated.title.slice(0, 60)}"`)
        saved++
      } catch (err: any) {
        console.error(`  ❌ Sanity error: ${err.message}`)
        failed++
      }

      // Avoid rate limiting Gemini
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`  ✅ Saved as drafts : ${saved}`)
  console.log(`  ⏭️  Already existed : ${skipped}`)
  if (failed > 0) console.log(`  ❌ Failed          : ${failed}`)
  console.log('\n📋 Review drafts at:')
  console.log('   https://sanity.io/manage/project/uk52fboh\n')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
