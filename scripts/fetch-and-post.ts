// ============================================================
// AIBeat — Daily News Automation Script
// Fetch AI news → Groq writes article → Save to Sanity as draft
// Run manually: npx tsx scripts/fetch-and-post.ts
// ============================================================
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@sanity/client'
import Parser          from 'rss-parser'

// ─── Config ──────────────────────────────────────────────────

const SANITY = createClient({
  projectId:  'uk52fboh',
  dataset:    'production',
  apiVersion: '2026-05-30',
  token:      process.env.SANITY_API_TOKEN?.replace(/\s/g, ''),
  useCdn:     false,
})

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'

// How many articles to process per run (set via ARTICLE_LIMIT env var).
// Default: 1 — keeps us well under Groq's 12K TPM free-tier limit.
// The GitHub workflow fires 3× per day (07:00 / 12:00 / 18:00 UTC),
// so we naturally get 3 fresh articles per day without hitting rate limits.
const ARTICLE_LIMIT = parseInt(process.env.ARTICLE_LIMIT ?? '1', 10)

// ─── RSS Feeds to monitor ────────────────────────────────────

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',                 source: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/index.xml',                        source: 'The Verge'   },
  { url: 'https://hnrss.org/frontpage?q=AI+LLM+GPT+Claude+Gemini',       source: 'Hacker News' },
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
  if (text.match(/vs|versus|compared|comparison|better than/))               return 'compare'
  if (text.match(/how to|guide|tutorial|best \d|top \d|review/))            return 'tools'
  if (text.match(/regulation|policy|law|ban|eu|congress|government/))       return 'news'
  if (text.match(/breaking|just|announces|launches|releases|unveiled/))     return 'breaking'
  return 'news'
}

async function alreadyExists(title: string): Promise<boolean> {
  const slug     = slugify(title)
  const existing = await SANITY.fetch(
    `*[_type == "article" && slug == $slug][0]._id`,
    { slug }
  )
  return !!existing
}

// ─── Image helpers ───────────────────────────────────────────

/**
 * Try to extract the og:image from the article's source URL.
 * Returns the image URL string, or null if nothing found.
 */
async function fetchOgImage(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res  = await fetch(url, {
      signal:  AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'AIBeat-bot/1.0' },
    })
    const html = await res.text()

    // og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]

    // twitter:image fallback
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (twMatch?.[1]) return twMatch[1]

    return null
  } catch {
    return null
  }
}

/**
 * Build a free Pollinations.ai image URL as a last resort.
 * No API key required — great for fallback cover images.
 */
function pollinationsUrl(title: string): string {
  const prompt = encodeURIComponent(
    `editorial news illustration about: ${title.slice(0, 120)}, digital art, clean, modern`
  )
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true`
}

/**
 * Resolve the best available cover image for an article:
 *   1. og:image from the original source URL
 *   2. Pollinations AI-generated fallback
 * Returns an object with { url, source } where source is 'og' | 'ai'.
 */
async function resolveCoverImage(
  articleUrl: string,
  title: string
): Promise<{ url: string; source: 'og' | 'ai' }> {
  const og = await fetchOgImage(articleUrl)
  if (og) {
    console.log(`     🖼️  OG image found`)
    return { url: og, source: 'og' }
  }
  console.log(`     🎨  No OG image — using Pollinations fallback`)
  return { url: pollinationsUrl(title), source: 'ai' }
}

// ─── Groq (Llama 3.3 70B) — Write Article ───────────────────

async function writeArticle(item: {
  title:   string
  summary: string
  source:  string
  link:    string
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
    const res = await fetch(GROQ_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.7,
        max_tokens:  4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()

    if (data.error) {
      console.error(`  ⚠️  Groq API error: ${data.error.message}`)
      return null
    }

    const raw     = data?.choices?.[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start   = cleaned.indexOf('{')
    const end     = cleaned.lastIndexOf('}')

    if (start === -1 || end === -1) {
      console.error(`  ⚠️  No JSON found in Groq response`)
      return null
    }

    return JSON.parse(cleaned.slice(start, end + 1))

  } catch (err) {
    console.error(`  ⚠️  Groq error for "${item.title}":`, err)
    return null
  }
}

// ─── Save to Sanity as Draft ─────────────────────────────────

async function saveToDraft(article: {
  title:      string
  deck:       string
  content:    string
  category:   string
  slug:       string
  coverImage: { url: string; source: 'og' | 'ai'; sourceUrl: string }
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
    status:      'review',          // editor must approve before going live

    // ── Cover image (stored as a plain URL, not uploaded to Sanity assets)
    // Your frontend reads coverImage.url and renders it with an attribution
    // caption when coverImage.source === 'og'.
    coverImage: {
      url:       article.coverImage.url,
      source:    article.coverImage.source,   // 'og' | 'ai'
      sourceUrl: article.coverImage.sourceUrl, // original article URL for attribution
    },
  })
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('\n🤖 AIBeat Daily News Automation')
  console.log(`   ${new Date().toUTCString()}`)
  console.log(`   Article limit this run: ${ARTICLE_LIMIT}\n`)

  if (!process.env.SANITY_API_TOKEN) throw new Error('Missing SANITY_API_TOKEN')
  if (!GROQ_API_KEY)                  throw new Error('Missing GROQ_API_KEY')

  const parser  = new Parser()
  const cutoff  = Date.now() - 24 * 60 * 60 * 1000  // last 24 hours
  let   saved   = 0
  let   skipped = 0
  let   failed  = 0

  // Collect all recent items across every feed first, then process up to ARTICLE_LIMIT.
  // This way the limit applies globally (not per-feed), giving us one clean article per run.
  const candidates: Array<{ item: Parser.Item; source: string }> = []

  for (const feed of RSS_FEEDS) {
    console.log(`📡 Fetching ${feed.source}...`)
    let feedData
    try {
      feedData = await parser.parseURL(feed.url)
    } catch {
      console.log(`  ⚠️  Could not fetch ${feed.url}`)
      continue
    }

    const recent = feedData.items.filter((item) => {
      const pub = item.pubDate ? new Date(item.pubDate).getTime() : 0
      return pub > cutoff
    })

    console.log(`   Found ${recent.length} new items in the last 24h`)
    for (const item of recent.slice(0, 3)) {
      candidates.push({ item, source: feed.source })
    }
  }

  console.log(`\n📝 Processing up to ${ARTICLE_LIMIT} article(s) from ${candidates.length} candidates...\n`)

  for (const { item, source } of candidates) {
    if (saved + failed >= ARTICLE_LIMIT) break   // respect the per-run limit

    const title = item.title?.trim() ?? ''
    if (!title) continue

    if (await alreadyExists(title)) {
      console.log(`  ⏭️  Already exists: "${title.slice(0, 60)}"`)
      skipped++
      continue
    }

    console.log(`  ✍️  Writing: "${title.slice(0, 60)}..."`)

    const summary   = item.contentSnippet ?? item.content ?? item.summary ?? ''
    const sourceUrl = item.link ?? ''

    const generated = await writeArticle({
      title,
      summary: summary.slice(0, 500),
      source,
      link: sourceUrl,
    })

    if (!generated) {
      failed++
      continue
    }

    // Resolve cover image (OG from source → Pollinations AI fallback)
    const coverImage = await resolveCoverImage(sourceUrl, generated.title)

    const slug     = slugify(generated.title)
    const category = detectCategory(generated.title, generated.content)

    try {
      await saveToDraft({
        ...generated,
        slug,
        category,
        coverImage: { ...coverImage, sourceUrl },
      })
      const imgLabel = coverImage.source === 'og' ? '🖼️ real photo' : '🎨 AI art'
      console.log(`  ✅ Saved draft: "${generated.title.slice(0, 55)}" [${imgLabel}]`)
      saved++
    } catch (err: any) {
      console.error(`  ❌ Sanity error: ${err.message}`)
      failed++
    }

    // Safety pause between Groq calls — keeps us under 12K TPM
    if (saved + failed < ARTICLE_LIMIT) {
      await new Promise(r => setTimeout(r, 6000))
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`  ✅ Saved as drafts : ${saved}`)
  console.log(`  ⏭️  Already existed : ${skipped}`)
  if (failed > 0) console.log(`  ❌ Failed          : ${failed}`)
  console.log('\n📋 Review drafts at:')
  console.log('   https://sanity.io/manage/project/uk52fboh\n')

  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
