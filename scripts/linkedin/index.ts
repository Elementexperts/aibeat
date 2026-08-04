import { isAbsolute, join } from 'path'
import { getLinkedInConfig, getMissingLinkedInCredentials } from './config'
import { loadRecentAIBeatNews } from './load-aibeat-news'
import { generateLinkedInDraft } from './generate-draft'
import { createLinkedInDraft } from './linkedin-client'
import {
  findDuplicateDraft,
  saveLinkedInDraft,
  stableLinkedInContentHash,
  upsertLinkedInHistoryItem,
} from './utils'
import type { LinkedInAutomationConfig, LinkedInDraft, LinkedInPostStatus } from './types'

type RunResult = {
  draft: LinkedInDraft
  status: LinkedInPostStatus
  draftPath?: string
  linkedInPostUrn?: string
  message?: string
}

function parseArgs(argv: string[]) {
  const args = new Set(argv)
  return {
    createDrafts: args.has('--create-drafts'),
    dryRun: args.has('--dry-run') ? true : args.has('--no-dry-run') ? false : undefined,
  }
}

export async function runLinkedInAutomation(input?: {
  config?: Partial<LinkedInAutomationConfig>
  now?: Date
  createDrafts?: boolean
}): Promise<RunResult[]> {
  const config = getLinkedInConfig(input?.config)
  const createDrafts = input?.createDrafts ?? config.createDraftsEnabled
  const primaryArticles = loadRecentAIBeatNews({
    limit: config.draftCount * 3,
    days: config.lookbackDays,
    siteUrl: config.siteUrl,
    now: input?.now,
  })
  const fallbackArticles = primaryArticles.length >= config.draftCount
    ? []
    : loadRecentAIBeatNews({
      limit: config.draftCount * 4,
      days: Math.max(config.lookbackDays, 7),
      siteUrl: config.siteUrl,
      now: input?.now,
    })
  const seen = new Set<string>()
  const articles = [...primaryArticles, ...fallbackArticles].filter((article) => {
    if (seen.has(article.slug)) return false
    seen.add(article.slug)
    return true
  })

  const results: RunResult[] = []

  for (const article of articles) {
    if (results.length >= config.draftCount) break

    const draft = generateLinkedInDraft({ article, tone: config.tone, now: input?.now })
    const duplicate = findDuplicateDraft(draft, config.dataDir)
    if (duplicate) {
      results.push({ draft, status: 'skipped', message: `Already drafted: ${article.slug}` })
      continue
    }

    const draftPath = saveLinkedInDraft(draft, config.dataDir)
    let status: LinkedInPostStatus = 'drafted'
    let linkedInPostUrn: string | undefined
    let message = config.dryRun ? 'Dry run: saved local draft only.' : 'Saved local draft.'

    if (createDrafts && !config.dryRun) {
      const missing = getMissingLinkedInCredentials(config)
      if (missing.length) {
        status = 'failed'
        message = `Missing LinkedIn credentials: ${missing.join(', ')}`
      } else {
        const created = await createLinkedInDraft({ draft, config })
        status = created.ok ? 'created' : 'failed'
        linkedInPostUrn = created.postUrn
        message = created.ok
          ? 'Created LinkedIn API draft.'
          : `LinkedIn API draft failed (${created.status}): ${created.message || 'Unknown error'}`
      }
    }

    upsertLinkedInHistoryItem({
      id: draft.id,
      articleSlug: draft.articleSlug,
      articleUrl: draft.articleUrl,
      title: draft.title,
      generatedAt: draft.generatedAt,
      contentHash: stableLinkedInContentHash({ title: draft.title, body: draft.body }),
      status,
      linkedInPostUrn,
      message,
    }, config.dataDir)

    results.push({ draft, status, draftPath, linkedInPostUrn, message })
  }

  return results
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const results = await runLinkedInAutomation({
    config: args.dryRun === undefined ? undefined : { dryRun: args.dryRun },
    createDrafts: args.createDrafts,
  })

  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    created: results.filter((item) => item.status === 'created').length,
    drafted: results.filter((item) => item.status === 'drafted').length,
    skipped: results.filter((item) => item.status === 'skipped').length,
    failed: results.filter((item) => item.status === 'failed').length,
    drafts: results.map((item) => ({
      status: item.status,
      title: item.draft.title,
      articleUrl: item.draft.articleUrl,
      draftPath: item.draftPath ? (isAbsolute(item.draftPath) ? item.draftPath : join(process.cwd(), item.draftPath)) : undefined,
      linkedInPostUrn: item.linkedInPostUrn,
      message: item.message,
    })),
  }

  console.log(JSON.stringify(report, null, 2))
  if (report.failed > 0) process.exitCode = 1
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
