import { appendFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { createGmailDraft, getGmailDraftConfig, validateWeeklyReviewRecipient } from '../lib/gmail-newsletter-draft'
import { buildWeeklyToolsNewsletter } from '../lib/weekly-tools-newsletter'

loadEnv({ path: '.env.local', quiet: true })

async function main() {
  const slugs = process.env.WEEKLY_TOOL_SLUGS?.split(',').map((slug) => slug.trim()).filter(Boolean)
  const newsletter = buildWeeklyToolsNewsletter({ slugs })
  const selection = newsletter.selectedTools.map((tool) => tool.slug).join(', ')
  console.log(`Weekly tools selection: ${selection}`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Weekly tools selection\n\n${newsletter.selectedTools.map((tool) => `- ${tool.name} (${tool.slug})`).join('\n')}\n\n`)
  if (process.env.GMAIL_WEEKLY_TOOLS_DRAFT_ENABLED !== 'true') {
    console.log(`Weekly tools Gmail draft is disabled. Selected: ${newsletter.selectedTools.map((tool) => tool.slug).join(', ')}`)
    return
  }
  const config = getGmailDraftConfig()
  validateWeeklyReviewRecipient(config.to)
  const guidance = 'Review draft only. Before sending: verify SPF/DKIM/DMARC, use confirmed subscribers, exclude unsubscribes and bounced contacts, and avoid repeated BCC resends. The body unsubscribe form is not RFC 8058 one-click unsubscribe.'
  console.log(guidance)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Delivery review\n\n${guidance}\n\n`)
  const result = await createGmailDraft({ message: { to: config.to, subject: newsletter.subject, plainText: newsletter.plainText, html: newsletter.html, key: newsletter.key }, config, updateExisting: true })
  console.log(result.created ? `Created weekly tools Gmail draft: ${result.draftId}` : `Updated weekly tools Gmail draft: ${result.draftId}`)
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'Weekly tools Gmail draft failed.'); process.exitCode = 1 })
