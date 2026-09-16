import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { auditStories } from './news-quality/audit'
import type { HistoricalStory } from './news-quality/types'

const directory = join(process.cwd(), 'content/articles')
const articles = readdirSync(directory).filter(file => file.endsWith('.mdx')).map(file => {
  const { data, content } = matter(readFileSync(join(directory, file), 'utf8'))
  return { ...data, content, sources: data.sources || (data.coverImageSourceUrl ? [{ name: 'Original reporting', url: data.coverImageSourceUrl }] : []) } as HistoricalStory & { content: string }
})
const results = auditStories(articles)
const output = join(process.cwd(), 'reports')
mkdirSync(output, { recursive: true })
writeFileSync(join(output, 'news-quality-audit.json'), JSON.stringify({ generatedAt: new Date().toISOString(), note: 'Heuristic triage only. Flags are not findings of falsehood. No live verification or article modification.', results }, null, 2))
writeFileSync(join(output, 'news-quality-audit.md'), '# Private news quality audit\n\nHeuristic flags for editorial review, not factual verdicts. No articles were changed.\n\n' + results.filter(r => r.flags.length).map(r => `- ${r.slug}: ${r.flags.join(', ')}${r.possibleDuplicate ? ` (compare ${r.possibleDuplicate})` : ''}`).join('\n'))
console.log(`Audited ${articles.length} historical articles without modifying them. Private reports: reports/news-quality-audit.{json,md}`)
