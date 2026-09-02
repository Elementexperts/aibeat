import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { buildLatestNewsNewsletter } from '../lib/latest-news-newsletter'

const outputPath = resolve(process.env.NEWSLETTER_PREVIEW_PATH || 'artifacts/newsletter/latest-news.html')
const newsletter = buildLatestNewsNewsletter()
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, newsletter.html, 'utf8')
writeFileSync(outputPath.replace(/\.html$/, '.txt'), newsletter.plainText, 'utf8')
writeFileSync(outputPath.replace(/\.html$/, '.json'), JSON.stringify({ subject: newsletter.subject, selectedArticles: newsletter.selectedArticles }, null, 2), 'utf8')
console.log(`Generated newsletter preview for ${newsletter.selectedArticles.length} published articles: ${outputPath}`)
