import { existsSync, readFileSync } from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { KitClient } from './kit/client'
import { BETALIST_CAMPAIGN_BODY, BETALIST_CAMPAIGN_PREVIEW, BETALIST_CAMPAIGN_SUBJECT, BETALIST_FOLLOW_UP_1_BODY, BETALIST_FOLLOW_UP_1_SUBJECT, BETALIST_FOLLOW_UP_2_BODY, BETALIST_FOLLOW_UP_2_SUBJECT, getBetaListOutreachLeads } from './betalist-outreach-leads'
import { DAILY_MANUAL_CAMPAIGN_BODY, DAILY_MANUAL_CAMPAIGN_PREVIEW, DAILY_MANUAL_CAMPAIGN_SUBJECT, DAILY_MANUAL_FOLLOW_UP_1_BODY, DAILY_MANUAL_FOLLOW_UP_1_SUBJECT, DAILY_MANUAL_FOLLOW_UP_2_BODY, DAILY_MANUAL_FOLLOW_UP_2_SUBJECT, parseDailyManualLeads } from './daily-manual-outreach-leads'
import { previewCsvImport } from './outreach-csv'
import { addEvent, getDefaultCampaign, readOutreachStore, upsertLeads, writeOutreachStore } from './outreach-store'
import { createCampaignDraft, createIndividualLeadDrafts, previewCampaign, scheduleCampaign, syncApprovedLeadsToKit } from './outreach-workflow'
import type { OutreachCampaign, OutreachLead, OutreachStore } from './outreach-types'

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

function applyBetaListCampaignTemplate(campaign: OutreachCampaign) {
  campaign.subject_template = BETALIST_CAMPAIGN_SUBJECT
  campaign.preview_text = BETALIST_CAMPAIGN_PREVIEW
  campaign.body_template_html = BETALIST_CAMPAIGN_BODY
  campaign.body_template_text = BETALIST_CAMPAIGN_BODY
  campaign.follow_up_1_subject = BETALIST_FOLLOW_UP_1_SUBJECT
  campaign.follow_up_1_body_html = BETALIST_FOLLOW_UP_1_BODY
  campaign.follow_up_2_subject = BETALIST_FOLLOW_UP_2_SUBJECT
  campaign.follow_up_2_body_html = BETALIST_FOLLOW_UP_2_BODY
  campaign.status = 'draft'
  campaign.send_enabled = false
  campaign.updated_at = new Date().toISOString()
}

function applyDailyManualCampaignTemplate(campaign: OutreachCampaign) {
  campaign.subject_template = DAILY_MANUAL_CAMPAIGN_SUBJECT
  campaign.preview_text = DAILY_MANUAL_CAMPAIGN_PREVIEW
  campaign.body_template_html = DAILY_MANUAL_CAMPAIGN_BODY
  campaign.body_template_text = DAILY_MANUAL_CAMPAIGN_BODY
  campaign.follow_up_1_subject = DAILY_MANUAL_FOLLOW_UP_1_SUBJECT
  campaign.follow_up_1_body_html = DAILY_MANUAL_FOLLOW_UP_1_BODY
  campaign.follow_up_2_subject = DAILY_MANUAL_FOLLOW_UP_2_SUBJECT
  campaign.follow_up_2_body_html = DAILY_MANUAL_FOLLOW_UP_2_BODY
  campaign.status = 'draft'
  campaign.send_enabled = false
  campaign.updated_at = new Date().toISOString()
}

function upsertReviewedLeads(store: OutreachStore, leads: OutreachLead[], sourceLabel: string) {
  for (const lead of leads) {
    const index = store.leads.findIndex((item) => item.email === lead.email)
    if (index < 0) {
      store.leads.push(lead)
      addEvent(store, { lead_id: lead.id, event_type: 'lead_created', metadata: { source: sourceLabel } })
      continue
    }

    const existing = store.leads[index]
    store.leads[index] = {
      ...existing,
      ...lead,
      created_at: existing.created_at || lead.created_at,
      kit_subscriber_id: existing.kit_subscriber_id,
      kit_tag_id: existing.kit_tag_id,
      kit_individual_tag_id: existing.kit_individual_tag_id,
      initial_broadcast_id: existing.initial_broadcast_id,
      follow_up_1_broadcast_id: existing.follow_up_1_broadcast_id,
      follow_up_2_broadcast_id: existing.follow_up_2_broadcast_id,
      last_contacted_at: existing.last_contacted_at,
      next_follow_up_at: existing.next_follow_up_at,
      replied_at: existing.replied_at,
      unsubscribed_at: existing.unsubscribed_at,
      updated_at: new Date().toISOString(),
    }
    addEvent(store, { lead_id: existing.id, event_type: 'lead_updated', metadata: { source: sourceLabel } })
  }
}

async function main() {
  const [command = 'help', ...rest] = process.argv.slice(2)
  const args = parseArgs(rest)
  const store = readOutreachStore()
  const campaign = getDefaultCampaign(store)

  if (command === 'help') {
    console.log('AIBeat Product Hunt outreach manager')
    console.log('Commands: import-csv --file leads.csv [--save], import-daily-file [--file data/outreach/daily-manual-leads.csv] [--save], create-daily-file-drafts [--file data/outreach/daily-manual-leads.csv] [--limit n], seed-betalist [--save], preview [--email x], sync-kit, create-draft, create-individual-drafts [--source x] [--limit n], schedule --send-at ISO --confirm')
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

  if (command === 'seed-betalist') {
    const leads = getBetaListOutreachLeads()
    applyBetaListCampaignTemplate(campaign)
    const approved = leads.filter((lead) => lead.approved_for_outreach && !lead.suppressed_at).length
    const suppressed = leads.length - approved
    console.log(JSON.stringify({ source: 'Beta List', total: leads.length, approved, suppressed, save: args.save === true }, null, 2))

    if (args.save) {
      upsertReviewedLeads(store, leads, 'Beta List seed')
      writeOutreachStore(store)
      console.log('Saved BetaList leads and applied the BetaList campaign template.')
    } else {
      console.log('Preview only. Re-run with --save to store BetaList leads.')
    }
    return
  }

  if (command === 'import-daily-file') {
    const file = typeof args.file === 'string' ? args.file : 'data/outreach/daily-manual-leads.csv'
    if (!existsSync(file)) throw new Error(`Daily lead file was not found: ${file}`)
    const preview = parseDailyManualLeads(readFileSync(file, 'utf-8'))
    applyDailyManualCampaignTemplate(campaign)
    const approved = preview.leads.filter((lead) => lead.approved_for_outreach && !lead.suppressed_at).length
    const suppressed = preview.leads.length - approved
    console.log(JSON.stringify({ file, rowsProcessed: preview.rowsProcessed, approved, suppressed, errors: preview.errors, save: args.save === true }, null, 2))

    if (preview.errors.length > 0) {
      throw new Error('Daily lead file has invalid rows. Fix the errors before creating drafts.')
    }

    if (args.save) {
      upsertReviewedLeads(store, preview.leads, 'Daily manual lead file')
      writeOutreachStore(store)
      console.log('Saved daily manual leads and applied the daily outreach template.')
    } else {
      console.log('Preview only. Re-run with --save to store daily manual leads.')
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

  if (command === 'create-individual-drafts') {
    const parsedLimit = typeof args.limit === 'string' ? Number(args.limit) : undefined
    const limit = parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    const source = typeof args.source === 'string' ? args.source : undefined
    const client = new KitClient()
    const result = await createIndividualLeadDrafts({ store, campaign, client, source, limit })
    writeOutreachStore(store)
    console.log(JSON.stringify({ created: result.created, skipped: result.skipped, source: source || 'all' }, null, 2))
    return
  }

  if (command === 'create-daily-file-drafts') {
    const file = typeof args.file === 'string' ? args.file : 'data/outreach/daily-manual-leads.csv'
    if (!existsSync(file)) throw new Error(`Daily lead file was not found: ${file}`)
    const preview = parseDailyManualLeads(readFileSync(file, 'utf-8'))
    applyDailyManualCampaignTemplate(campaign)

    if (preview.errors.length > 0) {
      console.log(JSON.stringify({ file, rowsProcessed: preview.rowsProcessed, errors: preview.errors }, null, 2))
      throw new Error('Daily lead file has invalid rows. Fix the errors before creating drafts.')
    }

    upsertReviewedLeads(store, preview.leads, 'Daily manual lead file')
    const parsedLimit = typeof args.limit === 'string' ? Number(args.limit) : undefined
    const limit = parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined
    const emails = preview.leads.map((lead) => lead.email)
    const client = new KitClient()
    const result = await createIndividualLeadDrafts({ store, campaign, client, emails, limit })
    writeOutreachStore(store)
    console.log(JSON.stringify({ file, rowsProcessed: preview.rowsProcessed, created: result.created, skipped: result.skipped }, null, 2))
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
