import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import { createGmailDraft, getGmailDraftConfig } from '../lib/gmail-newsletter-draft'
import { buildOutreachDraft } from '../lib/gmail-outreach-drafts'

loadEnv({ path: '.env.local', quiet: true })

async function main() {
  const inputPath = resolve(process.env.GMAIL_OUTREACH_INPUT_PATH?.trim() || 'data/outreach/daily-manual-leads.csv')
  const limit = Math.max(1, Math.min(25, Number.parseInt(process.env.GMAIL_OUTREACH_DRAFT_LIMIT || '10', 10) || 10))
  const imported = parseDailyManualLeads(await readFile(inputPath, 'utf8'))
  const approved = imported.leads.filter((lead) => lead.approved_for_outreach && lead.status !== 'suppressed').slice(0, limit)
  if (imported.errors.length) console.warn(`Skipped ${imported.errors.length} invalid outreach row(s): ${imported.errors.map((item) => item.row).join(', ')}`)
  if (process.env.GMAIL_OUTREACH_DRAFTS_ENABLED !== 'true') {
    console.log(`Gmail outreach drafts are disabled. ${approved.length} approved draft(s) would be prepared from ${inputPath}.`)
    return
  }
  const config = getGmailDraftConfig()
  let created = 0
  let duplicates = 0
  for (const lead of approved) {
    const result = await createGmailDraft({ message: buildOutreachDraft(lead), config })
    if (result.created) created += 1
    else duplicates += 1
  }
  console.log(`Gmail outreach drafts complete: ${created} created, ${duplicates} duplicate(s) skipped, ${approved.length} approved lead(s) considered.`)
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'Gmail outreach draft creation failed.'); process.exitCode = 1 })
