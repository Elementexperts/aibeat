import { readFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { KitClient } from './kit/client'
import { previewCsvImport } from './outreach-csv'
import { getDefaultCampaign, readOutreachStore, upsertLeads, writeOutreachStore } from './outreach-store'
import { createCampaignDraft, previewCampaign, scheduleCampaign, syncApprovedLeadsToKit } from './outreach-workflow'

loadEnv({ path: '.env.local' })

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (!item.startsWith('--')) continue
    const key = item.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) args[key] = true
    else {
      args[key] = next
      i += 1
    }
  }
  return args
}

function requireString(args: Args, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || !value) throw new Error(`Missing --${key}`)
  return value
}

async function main() {
  const [command = 'help', ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)
  const store = readOutreachStore()
  const campaign = getDefaultCampaign(store)

  if (command === 'help') {
    console.log('AIBeat Product Hunt outreach manager')
    console.log('Commands: import-csv --file leads.csv [--save], preview [--email x], sync-kit, create-draft, schedule --send-at ISO --confirm')
    return
  }

  if (command === 'import-csv') {
    const file = requireString(args, 'file')
    const preview = previewCsvImport(readFileSync(file, 'utf-8'), store.leads.map((lead) => lead.email))
    console.log(JSON.stringify({ rowsProcessed: preview.rowsProcessed, valid: preview.valid, invalid: preview.invalid, duplicates: preview.duplicates, blockedContactTypes: preview.blockedContactTypes, awaitingApproval: preview.valid }, null, 2))
    if (args.save) {
      upsertLeads(store, preview.leads)
      writeOutreachStore(store)
      console.log(`Saved ${preview.leads.length} unapproved lead(s).`)
    } else {
      console.log('Preview only. Re-run with --save to store valid leads as unapproved.')
    }
    return
  }

  if (command === 'preview') {
    const email = typeof args.email === 'string' ? args.email.toLowerCase() : undefined
    const lead = email ? store.leads.find((item) => item.email === email) : store.leads[0]
    if (!lead) throw new Error('No lead available for preview.')
    const preview = previewCampaign(campaign, lead)
    console.log(JSON.stringify({ recipient: lead.email, subject: preview.subject, text: preview.text, missing: preview.missing, unknown: preview.unknown }, null, 2))
    return
  }

  if (command === 'sync-kit') {
    const client = new KitClient()
    const result = await syncApprovedLeadsToKit({ store, campaign, client })
    writeOutreachStore(store)
    console.log(JSON.stringify({ tag: { id: result.tag.id, name: result.tag.name }, synced: result.synced.length, skipped: result.skipped.length }, null, 2))
    return
  }

  if (command === 'create-draft') {
    const client = new KitClient()
    const result = await createCampaignDraft({ store, campaign, client })
    writeOutreachStore(store)
    console.log(JSON.stringify({ draftBroadcastId: result.broadcastId, reused: result.reused }, null, 2))
    return
  }

  if (command === 'schedule') {
    const sendAt = requireString(args, 'send-at')
    const client = new KitClient()
    await scheduleCampaign({ store, campaign, client, sendAt, confirmed: args.confirm === true })
    writeOutreachStore(store)
    console.log('Broadcast scheduled.')
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : 'Outreach command failed')
  process.exitCode = 1
})
