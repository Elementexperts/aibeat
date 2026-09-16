// AIBeat: discover → retrieve evidence → validate facts/prose → images → MDX.
import { config } from 'dotenv'
import { resolve, join } from 'node:path'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { RSS_FEEDS, discoverFeed } from './news-quality/feeds'
import matter from 'gray-matter'
import { prepareNewsImage } from './news-images'
import { QUALITY, NEUTRAL_IMAGE_PROMPT, classifySource } from './news-quality/config'
import { SourceFetcher, canonicalSource, collectSources } from './news-quality/sources'
import { createModel } from './news-quality/model'
import { processCandidate } from './news-quality/pipeline'
import { renderDraft } from './news-quality/gate'
import { Rejection, type Approved, type Candidate, type HistoricalStory } from './news-quality/types'
import { TOOLS } from '../lib/data'
config({ path: resolve(process.cwd(), '.env.local') })

const CONTENT_DIR = resolve(process.cwd(), 'content/articles')
const LINKEDIN_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN
const LINKEDIN_PUBLISH_ENABLED = process.env.LINKEDIN_PUBLISH_ENABLED === 'true'
const SITE_BASE = 'https://www.aibeat.dev'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80).replace(/-$/, '')
}
function detectCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase()
  if (text.match(/raises|funding|series|valuation|billion|million|invests/)) return 'news'
  if (text.match(/vs|versus|compared|comparison|better than/)) return 'compare'
  if (text.match(/how to|guide|tutorial|best \d|top \d|review/)) return 'tools'
  if (text.match(/regulation|policy|law|ban|eu|congress|government/)) return 'news'
  if (text.match(/breaking|just|announces|launches|releases|unveiled/)) return 'breaking'
  return 'news'
}
function readHistory(): HistoricalStory[] {
  if (!existsSync(CONTENT_DIR)) return []
  return readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx')).map(file => {
    const { data } = matter(readFileSync(join(CONTENT_DIR, file), 'utf8'))
    return { ...data, sources: data.sources || (data.coverImageSourceUrl ? [{ name: 'Original reporting', url: data.coverImageSourceUrl }] : []) } as HistoricalStory
  })
}
async function saveApproved(approved: Approved, history: HistoricalStory[]) {
  const { draft, facts, sources, qualityScore } = approved
  const slug = slugify(draft.title)
  if (!slug || existsSync(join(CONTENT_DIR, `${slug}.mdx`))) throw new Rejection('DUPLICATE_STORY')
  const source = sources.slice().sort((a, b) => a.tier - b.tier)[0]
  // A neutral abstract fallback never depicts an alleged event as having happened.
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(NEUTRAL_IMAGE_PROMPT)}?width=1200&height=675&nologo=true`
  const coverImage = await prepareNewsImage({ url: source.imageUrl, source: 'og', sourceUrl: source.url, fallbackUrl })
  const content = renderDraft(draft)
  const relatedTools = TOOLS.filter(tool => facts.event.entities.some(entity => entity.toLowerCase() === tool.name.toLowerCase()) || (facts.event.product && facts.event.product.toLowerCase() === tool.name.toLowerCase())).map(tool => tool.slug).slice(0, 3)
  const relatedArticles = history.filter(article => facts.event.product.length >= 4 && (article.title + ' ' + (article.deck || '')).toLowerCase().includes(facts.event.product.toLowerCase())).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 3).map(article => article.slug)
  const metadata = {
    title: draft.title, deck: draft.deck, slug, category: detectCategory(draft.title, content), author: 'AIBeat AI',
    publishedAt: new Date().toISOString(), readTime: Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200)), featured: false,
    coverImageUrl: coverImage.url, coverImageAlt: coverImage.source === 'ai' ? 'Abstract illustration of computing and connected geometric shapes' : draft.title,
    coverImageWidth: coverImage.width || 1200, coverImageHeight: coverImage.height || 630,
    coverImageSource: coverImage.source, coverImageSourceUrl: coverImage.sourceUrl,
    sources: sources.map(source => ({ name: `${source.name} — ${source.tier === 1 ? 'primary source' : 'reporting'}`, url: source.url })),
    qualityScore, sourceCount: sources.length, primarySourceCount: sources.filter(s => s.tier === 1).length,
    newsEvent: facts.event, relatedTools, relatedArticles,
  }
  const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
  mkdirSync(CONTENT_DIR, { recursive: true })
  writeFileSync(join(CONTENT_DIR, `${slug}.mdx`), `---\n${frontmatter}\n---\n\n${content}\n`, { encoding: 'utf8', flag: 'wx' })
  history.push(metadata)
  return { slug, title: draft.title, deck: draft.deck }
}

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

async function main() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Missing GROQ_API_KEY')
  const limit = Math.max(1, Math.min(QUALITY.maxArticles, Number.parseInt(process.env.ARTICLE_LIMIT || '1', 10) || 1))
  const fetcher = new SourceFetcher()
  const model = createModel(key, process.env.GROQ_MODEL || 'openai/gpt-oss-120b')
  const history = readHistory()
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  for (const feed of RSS_FEEDS) {
    for (const candidate of await discoverFeed(feed, fetcher, console.log)) {
      if (seen.has(candidate.url)) continue
      seen.add(candidate.url)
      candidates.push(candidate)
    }
  }
  const selected = candidates.sort((a, b) => classifySource(a.url).tier - classifySource(b.url).tier || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, QUALITY.maxCandidates)
  let saved = 0
  for (const candidate of selected) {
    if (saved >= limit) break
    if (history.some(article => article.sources?.some(source => { try { return canonicalSource(source.url) === candidate.url } catch { return false } }))) {
      console.log(`[AIBeat Quality Gate] SKIPPED: ${candidate.title.replace(/[\r\n]/g, ' ').slice(0, 140)} | Reason: DUPLICATE_STORY`)
      continue
    }
    const accepted = await processCandidate(candidate, {
      collect: () => collectSources(candidate, candidates, fetcher, console.log), model, history, log: console.log,
      verifyAvailable: sources => fetcher.verifyAvailable(sources),
      publish: async approved => {
        const article = await saveApproved(approved, history)
        if (LINKEDIN_TOKEN && LINKEDIN_PUBLISH_ENABLED) {
          const personUrn = await getLinkedInPersonUrn(LINKEDIN_TOKEN)
          if (personUrn) await postToLinkedIn(article, personUrn, LINKEDIN_TOKEN)
        }
      },
    })
    if (accepted) saved++
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `published_count=${saved}\n`)
  console.log(`[AIBeat Quality Gate] Complete | Candidates: ${selected.length} | Published: ${saved} | Source requests: ${fetcher.count}`)
}
main().catch(() => { console.error('[AIBeat Quality Gate] Fatal configuration or infrastructure error.'); process.exitCode = 1 })
