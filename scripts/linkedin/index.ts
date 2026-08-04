import { isAbsolute, join } from 'path'
import { getLinkedInConfig, getMissingLinkedInCredentials } from './config'
import { loadRecentAIBeatNews } from './load-aibeat-news'
import { generateLinkedInDraft } from './generate-draft'
import { createLinkedInDraft, getLinkedInPersonalProfile, refreshLinkedInAccessToken } from './linkedin-client'
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
    whoami: args.has('--whoami'),
  }
}

export async function resolveLinkedInAuthorUrn(input?: {
  config?: Partial<LinkedInAutomationConfig>
}) {
  const config = getLinkedInConfig(input?.config)
  let accessToken = config.accessToken

  if (config.refreshToken && config.clientId && config.clientSecret) {
    const refreshed = await refreshLinkedInAccessToken({ config })
    if (!refreshed.ok || !refreshed.accessToken) {
      throw new Error(`LinkedIn token refresh failed (${refreshed.status}): ${refreshed.message || 'Unknown error'}`)
    }
    accessToken = refreshed.accessToken
  }

  if (!accessToken) throw new Error('Missing LINKEDIN_ACCESS_TOKEN or refresh-token credentials.')

  const profile = await getLinkedInPersonalProfile({ accessToken })
  if (!profile.ok || !profile.personUrn) {
    throw new Error(`LinkedIn profile lookup failed (${profile.status}): ${profile.message || 'Unknown error'}`)
  }

  return profile
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
  let refreshedAccessToken: string | undefined
  let refreshMessage: string | undefined
  let refreshFailed = false

  if (createDrafts && !config.dryRun && config.refreshToken && config.clientId && config.clientSecret) {
    const refreshed = await refreshLinkedInAccessToken({ config })
    if (refreshed.ok) {
      refreshedAccessToken = refreshed.accessToken
      refreshMessage = `Refreshed LinkedIn access token for this run. Access token TTL: ${refreshed.expiresIn ?? 'unknown'} seconds.`
      console.log(refreshMessage)
    } else {
      refreshFailed = true
      refreshMessage = `LinkedIn token refresh failed (${refreshed.status}): ${refreshed.message || 'Unknown error'}`
      console.log(refreshMessage)
    }
  }

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
      if (refreshFailed) {
        status = 'failed'
        message = refreshMessage || 'LinkedIn token refresh failed.'
      } else if (missing.length) {
        status = 'failed'
        message = `Missing LinkedIn credentials: ${missing.join(', ')}`
      } else {
        const created = await createLinkedInDraft({ draft, config, accessToken: refreshedAccessToken })
        status = created.ok ? 'created' : 'failed'
        linkedInPostUrn = created.postUrn
        message = created.ok
          ? `Created LinkedIn API draft.${refreshMessage ? ` ${refreshMessage}` : ''}`
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
  if (args.whoami) {
    const profile = await resolveLinkedInAuthorUrn()
    console.log(JSON.stringify({
      ok: true,
      linkedInAuthorUrn: profile.personUrn,
      id: profile.id,
      name: profile.name,
      endpoint: profile.endpoint,
      nextStep: 'Copy linkedInAuthorUrn into the GitHub secret LINKEDIN_AUTHOR_URN.',
    }, null, 2))
    return
  }

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
