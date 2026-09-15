import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import type { Article } from '../lib/articles'
import { articleRevision } from '../lib/article-seo'
import { publishedArticles } from '../lib/news-feeds'
import { canonicalUrl, SITE_URL } from '../lib/site-seo'
import { submitIndexNow } from '../lib/indexnow'

async function main() {
  const key = process.env.INDEXNOW_KEY
  if (!key) { console.log('IndexNow skipped: INDEXNOW_KEY is not configured.'); return }
  const base = process.env.INDEXNOW_BASE_SHA || 'HEAD~1'
  if (!/^(?:[a-f0-9]{7,40}|HEAD~[1-9][0-9]?)$/.test(base) || /^0+$/.test(base)) throw new Error('Invalid IndexNow base revision')
  const files = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', base, 'HEAD', '--', 'content/articles/', 'app/news/best-ai-writing-tools-2026/page.tsx'], { encoding: 'utf8' }).trim().split('\n')
  const pending = new Map<string, string>()
  for (const file of files) {
    if (file === 'app/news/best-ai-writing-tools-2026/page.tsx') {
      pending.set(canonicalUrl('/news/best-ai-writing-tools-2026'), execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim())
      continue
    }
    if (!/^content\/articles\/[a-z0-9-]+\.mdx$/.test(file)) continue
    const { data, content } = matter(readFileSync(file, 'utf8'))
    const article = { ...data, content } as Article
    if (!publishedArticles([article]).length) continue
    // Ignore frontmatter formatting and unrelated fields that do not change the page.
    try {
      const previous = matter(execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
      if (articleRevision({ ...previous.data, content: previous.content } as Article) === articleRevision(article)) continue
    } catch { /* Newly published file. */ }
    pending.set(canonicalUrl(`/news/${article.slug}`), articleRevision(article))
  }
  if (!pending.size) { console.log('IndexNow: no changed public articles.'); return }
  const ready: string[] = []
  // Wait for the actual content revision on production, not merely a successful git push.
  for (let attempt = 0; attempt < 12 && pending.size; attempt++) {
    await Promise.all(Array.from(pending).map(async ([url, revision]) => {
      try {
        const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
        const marker = url.endsWith('/best-ai-writing-tools-2026') ? 'aibeat-build-revision' : 'aibeat-content-revision'
        if (response.ok && (await response.text()).includes(`name="${marker}" content="${revision}"`)) {
          ready.push(url); pending.delete(url)
        }
      } catch { /* Deployment may still be in progress. */ }
    }))
    if (pending.size && attempt < 11) await new Promise(resolve => setTimeout(resolve, 10000))
  }
  if (pending.size) console.warn(`IndexNow: ${pending.size} article(s) not live yet. Re-run this workflow with base ${base} after deployment.`)
  if (!ready.length) return
  const verification = await fetch(`${SITE_URL}/indexnow-key.txt`, { signal: AbortSignal.timeout(10000) })
  if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Production IndexNow key verification failed; check the deployment environment')
  const result = await submitIndexNow(key, ready)
  if (result.error) console.warn(result.error)
  else console.log(`IndexNow accepted ${result.submitted} URL(s); indexing is determined by search engines.`)
}

main().catch(error => console.warn('IndexNow notification skipped:', error instanceof Error ? error.message : 'Unknown error'))
