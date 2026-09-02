import { config as loadEnv } from 'dotenv'
import { createGmailNewsletterDraft, getGmailDraftConfig } from '../lib/gmail-newsletter-draft'
import { buildLatestNewsNewsletter } from '../lib/latest-news-newsletter'

loadEnv({ path: '.env.local', quiet: true })

async function main() {
  if (process.env.GMAIL_CREATE_DRAFT_ENABLED !== 'true') {
    console.log('Gmail draft creation is disabled. Set GMAIL_CREATE_DRAFT_ENABLED=true to create a draft; no Gmail request was made.')
    return
  }
  const newsletter = buildLatestNewsNewsletter()
  const result = await createGmailNewsletterDraft({ newsletter, config: getGmailDraftConfig() })
  console.log(result.created ? `Created Gmail newsletter draft: ${result.draftId}` : `Skipped duplicate Gmail newsletter draft: ${result.draftId}`)
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'Gmail draft creation failed.'); process.exitCode = 1 })
