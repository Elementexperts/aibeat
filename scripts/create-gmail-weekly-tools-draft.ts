import { config as loadEnv } from 'dotenv'
import { createGmailDraft, getGmailDraftConfig } from '../lib/gmail-newsletter-draft'
import { buildWeeklyToolsNewsletter } from '../lib/weekly-tools-newsletter'

loadEnv({ path: '.env.local', quiet: true })

async function main() {
  const slugs = process.env.WEEKLY_TOOL_SLUGS?.split(',').map((slug) => slug.trim()).filter(Boolean)
  const newsletter = buildWeeklyToolsNewsletter({ slugs })
  if (process.env.GMAIL_WEEKLY_TOOLS_DRAFT_ENABLED !== 'true') {
    console.log(`Weekly tools Gmail draft is disabled. Selected: ${newsletter.selectedTools.map((tool) => tool.slug).join(', ')}`)
    return
  }
  const config = getGmailDraftConfig()
  const result = await createGmailDraft({ message: { to: config.to, subject: newsletter.subject, plainText: newsletter.plainText, html: newsletter.html, key: newsletter.key }, config })
  console.log(result.created ? `Created weekly tools Gmail draft: ${result.draftId}` : `Skipped duplicate weekly tools Gmail draft: ${result.draftId}`)
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'Weekly tools Gmail draft failed.'); process.exitCode = 1 })
