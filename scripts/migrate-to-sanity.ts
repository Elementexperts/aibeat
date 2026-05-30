// ============================================================
// AIBeat — One-Time Migration: data.ts → Sanity
// Run: npx tsx scripts/migrate-to-sanity.ts
// ============================================================
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local before anything else
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@sanity/client'
import { ARTICLES }     from '../lib/data'
import { ARTICLE_CONTENT } from '../lib/article-content'

const client = createClient({
  projectId: 'uk52fboh',
  dataset:   'production',
  apiVersion: '2026-05-30',
  token: process.env.SANITY_API_TOKEN, // needs Editor token
  useCdn: false,
})

async function migrate() {
  console.log(`\n🚀 AIBeat → Sanity migration`)
  console.log(`   Migrating ${ARTICLES.length} articles...\n`)

  let success = 0
  let failed  = 0

  for (const article of ARTICLES) {
    // Resolve inline content: some articles have it in ARTICLE_CONTENT,
    // others have it directly on the article object, some have none yet.
    const content =
      ARTICLE_CONTENT[article.slug] ??
      article.content ??
      ''

    const doc = {
      _type:       'article',
      _id:         `article-${article.slug}`,   // deterministic ID — safe to re-run
      slug:        article.slug,
      title:       article.title,
      deck:        article.deck,
      category:    article.category,
      author:      article.author,
      publishedAt: article.publishedAt,
      readTime:    article.readTime,
      featured:    article.featured,
      content:     content,
      relatedTools: article.relatedTools ?? [],
      status:      'published',                 // migrate as published
    }

    try {
      await client.createOrReplace(doc)
      console.log(`  ✅ ${article.slug}`)
      success++
    } catch (err: any) {
      console.error(`  ❌ ${article.slug} — ${err.message}`)
      failed++
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`  ✅ Migrated: ${success}`)
  if (failed > 0) {
    console.log(`  ❌ Failed:   ${failed}`)
  }
  console.log(`\n🎉 Done! View your articles at:`)
  console.log(`   https://sanity.io/manage/project/uk52fboh\n`)
}

migrate().catch((err) => {
  console.error('\n❌ Migration failed:', err.message)
  process.exit(1)
})
