// ============================================================
// AIBeat — Daily News Automation
// Fetch AI news → Groq writes article → Save as MDX file
// Run manually: npx tsx scripts/fetch-and-post.ts
// ============================================================
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Parser from 'rss-parser'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const GROQ_API_KEY  = process.env.GROQ_API_KEY
const GROQ_URL      = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL    = 'llama-3.3-70b-versatile'
const ARTICLE_LIMIT = parseInt(process.env.ARTICLE_LIMIT ?? '1', 10)
const CONTENT_DIR   = resolve(process.cwd(), 'content/articles')

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',                 source: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/index.xml',                        source: 'The Verge'   },
  { url: 'https://hnrss.org/frontpage?q=AI+LLM+GPT+Claude+Gemini',       source: 'Hacker News' },
]

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

function alreadyExists(slug: string): boolean {
  return existsSync(join(CONTENT_DIR, `${slug}.mdx`))
}

async function fetchOgImage(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'AIBeat-bot/1.0' } })
    const html = await res.text()
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (twMatch?.[1]) return twMatch[1]
    return null
  } catch { return null }
}

function pollinationsUrl(title: string): string {
  const prompt = encodeURIComponent(`editorial news illustration about: ${title.slice(0, 120)}, digital art, clean, modern`)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true`
}

async function writeArticleWithGroq(item: { title: string; summary: string; source: string; link: string }) {
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

Respond ONLY with valid JSON (no markdown, no code blocks):
{"title":"...","deck":"...","content":"..."}`

  try {
    const res  = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body:    JSON.stringify({ model: GROQ_MODEL, temperature: 0.7, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    if (data.error) { console.error(`  Groq error: ${data.error.message}`); return null }
    const raw     = data?.choices?.[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start   = cleaned.indexOf('{')
    const end     = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) { console.error(`  No JSON in Groq response`); return null }
    return JSON.parse(cleaned.slice(start, end + 1)) as { title: string; deck: string; content: string }
  } catch (err) { console.error(`  Groq error:`, err); return null }
}

function writeMdxFile(article: {
  slug: string; title: string; deck: string; content: string
  category: string; publishedAt: string; readTime: number
  coverImage: { url: string; source: string; sourceUrl: string }
}): void {
  const fm = [
    '---',
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `deck: "${article.deck.replace(/"/g, '\\"')}"`,
    `slug: "${article.slug}"`,
    `category: "${article.category}"`,
    `author: "AIBeat AI"`,
    `publishedAt: "${article.publishedAt}"`,
    `readTime: ${article.readTime}`,
    `featured: false`,
    `coverImageUrl: "${article.coverImage.url}"`,
    `coverImageSource: "${article.coverImage.source}"`,
    `coverImageSourceUrl: "${article.coverImage.sourceUrl}"`,
    '---',
    '',
  ].join('\n')

  writeFileSync(join(CONTENT_DIR, `${article.slug}.mdx`), fm + article.content)
}

async function main() {
  console.log('\n AIBeat Daily News Automation')
  console.log(`   ${new Date().toUTCString()}`)
  console.log(`   Article limit: ${ARTICLE_LIMIT}\n`)

  if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY')

  const parser  = new Parser()
  const cutoff  = Date.now() - 24 * 60 * 60 * 1000
  let saved = 0, skipped = 0, failed = 0
  const candidates: Array<{ item: Parser.Item; source: string }> = []

  for (const feed of RSS_FEEDS) {
    console.log(`Fetching ${feed.source}...`)
    try {
      const feedData = await parser.parseURL(feed.url)
      const recent   = feedData.items.filter(i => i.pubDate ? new Date(i.pubDate).getTime() > cutoff : false)
      console.log(`   ${recent.length} new items in last 24h`)
      for (const item of recent.slice(0, 3)) candidates.push({ item, source: feed.source })
    } catch { console.log(`   Could not fetch ${feed.url}`) }
  }

  console.log(`\n Processing up to ${ARTICLE_LIMIT} article(s) from ${candidates.length} candidates...\n`)

  for (const { item, source } of candidates) {
    if (saved + failed >= ARTICLE_LIMIT) break

    const title = item.title?.trim() ?? ''
    if (!title) continue

    const slug = slugify(title)
    if (alreadyExists(slug)) { console.log(`  Already exists: "${title.slice(0, 60)}"`); skipped++; continue }

    console.log(`  Writing: "${title.slice(0, 60)}..."`)

    const summary   = item.contentSnippet ?? item.content ?? item.summary ?? ''
    const sourceUrl = item.link ?? ''
    const generated = await writeArticleWithGroq({ title, summary: summary.slice(0, 500), source, link: sourceUrl })
    if (!generated) { failed++; continue }

    const ogImage    = await fetchOgImage(sourceUrl)
    const coverImage = ogImage
      ? { url: ogImage, source: 'og', sourceUrl }
      : { url: pollinationsUrl(generated.title), source: 'ai', sourceUrl }

    console.log(ogImage ? `     OG image found` : `     Using Pollinations fallback`)

    const finalSlug = slugify(generated.title)
    writeMdxFile({
      slug: finalSlug,
      title: generated.title,
      deck: generated.deck,
      content: generated.content,
      category: detectCategory(generated.title, generated.content),
      publishedAt: new Date().toISOString().slice(0, 10),
      readTime: estimateReadTime(generated.content),
      coverImage,
    })

    console.log(`  Saved: content/articles/${finalSlug}.mdx`)
    saved++

    if (saved + failed < ARTICLE_LIMIT) await new Promise(r => setTimeout(r, 6000))
  }

  console.log('\n─────────────────────────')
  console.log(`  Saved   : ${saved}`)
  console.log(`  Skipped : ${skipped}`)
  if (failed > 0) { console.log(`  Failed  : ${failed}`); process.exitCode = 1 }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
