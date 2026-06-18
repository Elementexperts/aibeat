// ============================================================
// AIBeat — Daily News Automation
// Fetch AI news → Groq writes article → Save as MDX file
// Run manually: npx tsx scripts/fetch-and-post.ts
// ============================================================
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Parser from 'rss-parser'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const GROQ_API_KEY   = process.env.GROQ_API_KEY
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL     = 'llama-3.3-70b-versatile'
const ARTICLE_LIMIT  = parseInt(process.env.ARTICLE_LIMIT ?? '1', 10)
const CONTENT_DIR    = resolve(process.cwd(), 'content/articles')
const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN
const SITE_BASE      = 'https://www.aibeat.dev'

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch'  },
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
    .replace(/-$/, '')   // FIX 1: strip trailing dash (e.g. "openai-" → "openai")
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

// ─── Image helpers ───────────────────────────────────────────

async function fetchOgImage(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res  = await fetch(url, {
      signal:  AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'AIBeat-bot/1.0' },
    })
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
  const prompt = encodeURIComponent(
    `editorial news illustration about: ${title.slice(0, 120)}, digital art, clean, modern`
  )
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true`
}

// ─── JSON sanitizer ──────────────────────────────────────────
// Groq sometimes emits literal newlines inside JSON string values which breaks JSON.parse.

function sanitizeJsonControlChars(json: string): string {
  let result = '', inString = false, escaped = false
  for (const char of json) {
    if (escaped)                   { result += char; escaped = false; continue }
    if (char === '\\' && inString) { result += char; escaped = true;  continue }
    if (char === '"')              { inString = !inString; result += char; continue }
    if (inString && char.charCodeAt(0) < 0x20) {
      if      (char === '\n') result += '\\n'
      else if (char === '\r') result += '\\r'
      else if (char === '\t') result += '\\t'
      continue // drop other control chars
    }
    result += char
  }
  return result
}

// ─── Groq — Write Article ────────────────────────────────────

async function writeArticleWithGroq(
  item: { title: string; summary: string; source: string; link: string },
  attempt = 0
): Promise<{ title: string; deck: string; content: string } | null> {
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
      body:    JSON.stringify({
        model: GROQ_MODEL, temperature: 0.7, max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()

    if (data.error) {
      const msg: string = data.error.message ?? ''

      // FIX 2: rate limit retry — max 2 retries, not infinite recursion
      if (attempt < 2 && msg.includes('rate_limit')) {
        const waitMatch = msg.match(/try again in ([\d.]+)s/)
        const waitMs    = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) + 1500 : 10000
        console.log(`  ⏳ Rate limited — waiting ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt + 1}/2)...`)
        await new Promise(r => setTimeout(r, waitMs))
        return writeArticleWithGroq(item, attempt + 1)
      }

      console.error(`  ⚠️  Groq error: ${msg}`)
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

    const safe = sanitizeJsonControlChars(cleaned.slice(start, end + 1))
    return JSON.parse(safe) as { title: string; deck: string; content: string }

  } catch (err) {
    console.error(`  ⚠️  Groq error:`, err)
    return null
  }
}

// ─── Write MDX file ──────────────────────────────────────────

function writeMdxFile(article: {
  slug:        string
  title:       string
  deck:        string
  content:     string
  category:    string
  publishedAt: string
  readTime:    number
  coverImage:  { url: string; source: string; sourceUrl: string }
}): void {
  // FIX 3: ensure content/articles/ directory exists before writing
  mkdirSync(CONTENT_DIR, { recursive: true })

  const safe = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const fm = [
    '---',
    `title: "${safe(article.title)}"`,
    `deck: "${safe(article.deck)}"`,
    `slug: "${article.slug}"`,
    `category: "${article.category}"`,
    `author: "AIBeat AI"`,
    `publishedAt: "${article.publishedAt}"`,
    `readTime: ${article.readTime}`,
    `featured: false`,
    `coverImageUrl: "${article.coverImage.url}"`,
    `coverImageSource: "${article.coverImage.source}"`,
    `coverImageSourceUrl: "${safe(article.coverImage.sourceUrl)}"`,
    '---',
    '',
  ].join('\n')

  writeFileSync(join(CONTENT_DIR, `${article.slug}.mdx`), fm + article.content, 'utf-8')
}

// ─── LinkedIn ────────────────────────────────────────────────

async function getLinkedInPersonUrn(token: string): Promise<string | null> {
  if (process.env.LINKEDIN_PERSON_URN) return process.env.LINKEDIN_PERSON_URN

  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.sub) return `urn:li:person:${data.sub}`
    }
  } catch {}

  try {
    const res = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.id) return `urn:li:person:${data.id}`
    }
  } catch {}

  console.log(`  ⚠️  LinkedIn: could not resolve Person URN`)
  return null
}

async function postToLinkedIn(
  article: { slug: string; title: string; deck: string },
  personUrn: string,
  token: string
): Promise<void> {
  const url     = `${SITE_BASE}/news/${article.slug}`
  const caption = `${article.title}\n\n${article.deck}\n\nRead more → ${url}\n\n#AI #ArtificialIntelligence #AINews #AIBeat`

  const body = {
    author:          personUrn,
    lifecycleState:  'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary:    { text: caption },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status:      'READY',
          originalUrl: url,
          title:       { text: article.title },
          description: { text: article.deck },
        }],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      console.log(`  ✅ LinkedIn post published`)
    } else {
      const err = await res.text()
      console.log(`  ⚠️  LinkedIn post failed (${res.status}): ${err}`)
    }
  } catch (err) {
    console.log(`  ⚠️  LinkedIn post error:`, err)
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('\n🤖 AIBeat Daily News Automation')
  console.log(`   ${new Date().toUTCString()}`)
  console.log(`   Article limit: ${ARTICLE_LIMIT}\n`)

  if (!GROQ_API_KEY) throw new Error('Missing GROQ_API_KEY')

  const parser = new Parser()
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  let saved = 0, skipped = 0, failed = 0

  const candidates: Array<{ item: Parser.Item; source: string }> = []

  for (const feed of RSS_FEEDS) {
    console.log(`📡 Fetching ${feed.source}...`)
    try {
      const feedData = await parser.parseURL(feed.url)
      const recent   = feedData.items.filter(i =>
        i.pubDate ? new Date(i.pubDate).getTime() > cutoff : false
      )
      console.log(`   ${recent.length} new items in last 24h`)
      for (const item of recent.slice(0, 3)) candidates.push({ item, source: feed.source })
    } catch {
      console.log(`   ⚠️  Could not fetch ${feed.url}`)
    }
  }

  console.log(`\n📝 Processing up to ${ARTICLE_LIMIT} article(s) from ${candidates.length} candidates...\n`)

  for (const { item, source } of candidates) {
    // FIX 4: count both saved AND failed against the limit
    // so a run with 1 failure doesn't loop endlessly through all candidates
    if (saved + failed >= ARTICLE_LIMIT) break

    const title = item.title?.trim() ?? ''
    if (!title) continue

    const slug = slugify(title)
    if (alreadyExists(slug)) {
      console.log(`  ⏭️  Already exists: "${title.slice(0, 60)}"`)
      skipped++
      continue
    }

    console.log(`  ✍️  Writing: "${title.slice(0, 60)}..."`)

    const summary   = item.contentSnippet ?? item.content ?? item.summary ?? ''
    const sourceUrl = item.link ?? ''

    const generated = await writeArticleWithGroq({
      title,
      summary: summary.slice(0, 500),
      source,
      link: sourceUrl,
    })

    if (!generated) { failed++; continue }

    const ogImage    = await fetchOgImage(sourceUrl)
    const coverImage = ogImage
      ? { url: ogImage,                    source: 'og', sourceUrl }
      : { url: pollinationsUrl(generated.title), source: 'ai', sourceUrl }

    console.log(ogImage ? `     🖼️  OG image found` : `     🎨  Using Pollinations fallback`)

    const finalSlug = slugify(generated.title)
    if (alreadyExists(finalSlug)) {
      console.log(`  ⏭️  Already exists (rewritten slug): "${finalSlug}"`)
      skipped++
      continue
    }

    writeMdxFile({
      slug:        finalSlug,
      title:       generated.title,
      deck:        generated.deck,
      content:     generated.content,
      category:    detectCategory(generated.title, generated.content),
      publishedAt: new Date().toISOString().slice(0, 10),
      readTime:    estimateReadTime(generated.content),
      coverImage,
    })

    console.log(`  ✅ Saved: content/articles/${finalSlug}.mdx`)
    saved++

    // Post to LinkedIn if token is configured
    if (LINKEDIN_TOKEN) {
      const personUrn = await getLinkedInPersonUrn(LINKEDIN_TOKEN)
      if (personUrn) {
        await postToLinkedIn(
          { slug: finalSlug, title: generated.title, deck: generated.deck },
          personUrn,
          LINKEDIN_TOKEN,
        )
      }
    }

    if (saved + failed < ARTICLE_LIMIT) {
      await new Promise(r => setTimeout(r, 6000))
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`  ✅ Saved   : ${saved}`)
  console.log(`  ⏭️  Skipped : ${skipped}`)
  if (failed > 0) { console.log(`  ❌ Failed  : ${failed}`); process.exitCode = 1 }
  console.log()
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1) })