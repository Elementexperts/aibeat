import { completeLeadBatch, leadHistoryPath, readLeadRows } from '../lib/daily-lead-csv'
import { readFileSync, writeFileSync, existsSync, appendFileSync, renameSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import { createGmailDraft, getGmailDraftConfig } from '../lib/gmail-newsletter-draft'
import { buildOutreachDraft, selectOutreachLeads } from '../lib/gmail-outreach-drafts'
import { blockedStatuses, fetchUnsubscribes, processDailyDrafts, type DraftLedger } from '../lib/daily-outreach-drafts'
import { readOutreachStore } from '../lib/outreach-store'

loadEnv({ path: '.env.local', quiet: true })
const inputPath = 'data/outreach/daily-manual-leads.csv'
const ledgerPath = 'data/outreach/gmail-draft-ledger.json'
function report(text: string) {
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n\n')
}
async function main() {
  const imported = parseDailyManualLeads(readFileSync(inputPath, 'utf8'))
  report(`Invalid rows preserved: ${imported.errors.length}`)
  for (const error of imported.errors) report(`Row ${error.row}: ${error.errors.join('; ')}`)
  const enabled = process.env.GMAIL_OUTREACH_DRAFTS_ENABLED === 'true'
  const ledger: DraftLedger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : {}
  const archived = new Set(readLeadRows(leadHistoryPath(inputPath)).map(row => row.email.trim().toLowerCase()))
  const excluded = enabled ? await fetchUnsubscribes(process.env.SUBMISSIONS_SUPABASE_URL || '', process.env.SUBMISSIONS_SUPABASE_KEY || '') : new Set<string>()
  for (const lead of readOutreachStore().leads) {
    if (blockedStatuses.has(lead.status) || lead.suppressed_at || lead.unsubscribed_at || lead.last_contacted_at || lead.replied_at) excluded.add(lead.email.trim().toLowerCase())
  }
  const config = enabled ? getGmailDraftConfig({ ...process.env, GMAIL_DRAFT_TO: 'hello@aibeat.dev' }) : undefined
  const checkpoint = async () => {
    writeFileSync(ledgerPath + '.tmp', JSON.stringify(ledger, null, 2) + '\n')
    renameSync(ledgerPath + '.tmp', ledgerPath)
    if (process.env.GITHUB_ACTIONS === 'true') {
      const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      git('add', '--', inputPath, leadHistoryPath(inputPath), ledgerPath)
      if (git('diff', '--cached', '--name-only').trim()) {
        git('commit', '-m', 'chore(outreach): checkpoint daily Gmail drafts')
        git('pull', '--rebase', '--autostash', 'origin', 'main')
        git('push', 'origin', 'HEAD:main')
      }
    }
  }
  const counts = await processDailyDrafts({
    // No daily draft cap: include every eligible discovery and unfinished backlog.
    leads: selectOutreachLeads(imported.leads, Number.POSITIVE_INFINITY), ledger, excluded, archived, enabled,
    save: checkpoint, archive: lead => completeLeadBatch(inputPath, [lead]),
    create: (lead, lookupOnly, beforeCreate) => createGmailDraft({ message: buildOutreachDraft(lead), config: config!, lookupOnly, beforeCreate }),
  })
  report(`Daily Gmail drafts: ${JSON.stringify(counts)}`)
  if (!enabled) report('Drafting disabled: no Gmail or queue/history changes.')
  if (counts.uncertain) report('Uncertain outcomes require manual reconciliation; reserved contacts are never blindly redrafted.')
  if (counts.failed) process.exitCode = 1
}
main().catch(() => { report('Daily drafting failed; no automatic send. Check credentials, suppression access, and checkpoint persistence. Pending rows are preserved.'); process.exitCode = 1 })
