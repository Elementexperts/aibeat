import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { OutreachCampaign, OutreachEvent, OutreachLead, OutreachStore } from './outreach-types'
import { DEFAULT_BODY, DEFAULT_CAMPAIGN_NAME, DEFAULT_CAMPAIGN_SLUG, DEFAULT_CAMPAIGN_TAG, DEFAULT_PREVIEW_TEXT, DEFAULT_SAFETY_LIMIT, DEFAULT_SUBJECT, FOLLOW_UP_1_BODY, FOLLOW_UP_1_SUBJECT, FOLLOW_UP_2_BODY, FOLLOW_UP_2_SUBJECT } from './outreach-types'

export function getOutreachStorePath() {
  return resolve(process.cwd(), process.env.OUTREACH_DATA_FILE || 'data/outreach/store.json')
}

export function emptyStore(): OutreachStore {
  return { leads: [], campaigns: [], events: [] }
}

export function readOutreachStore(path = getOutreachStorePath()): OutreachStore {
  if (!existsSync(path)) return emptyStore()
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Partial<OutreachStore>
  return { leads: parsed.leads || [], campaigns: parsed.campaigns || [], events: parsed.events || [] }
}

export function writeOutreachStore(store: OutreachStore, path = getOutreachStorePath()) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`)
}

export function addEvent(store: OutreachStore, event: Omit<OutreachEvent, 'id' | 'created_at'>) {
  store.events.push({ id: `evt_${Date.now()}_${store.events.length + 1}`, created_at: new Date().toISOString(), ...event })
}

export function upsertLeads(store: OutreachStore, leads: OutreachLead[]) {
  for (const lead of leads) {
    const existing = store.leads.findIndex((item) => item.email === lead.email)
    if (existing >= 0) {
      store.leads[existing] = { ...store.leads[existing], ...lead, approved_for_outreach: store.leads[existing].approved_for_outreach, updated_at: new Date().toISOString() }
      addEvent(store, { lead_id: store.leads[existing].id, event_type: 'lead_updated' })
    } else {
      store.leads.push(lead)
      addEvent(store, { lead_id: lead.id, event_type: 'lead_created' })
    }
  }
}

export function getDefaultCampaign(store: OutreachStore): OutreachCampaign {
  const existing = store.campaigns.find((campaign) => campaign.slug === DEFAULT_CAMPAIGN_SLUG)
  if (existing) return existing
  const now = new Date().toISOString()
  const campaign: OutreachCampaign = {
    id: 'campaign_product_hunt',
    name: DEFAULT_CAMPAIGN_NAME,
    slug: DEFAULT_CAMPAIGN_SLUG,
    subject_template: DEFAULT_SUBJECT,
    preview_text: DEFAULT_PREVIEW_TEXT,
    body_template_html: DEFAULT_BODY,
    body_template_text: DEFAULT_BODY,
    follow_up_1_subject: FOLLOW_UP_1_SUBJECT,
    follow_up_1_body_html: FOLLOW_UP_1_BODY,
    follow_up_2_subject: FOLLOW_UP_2_SUBJECT,
    follow_up_2_body_html: FOLLOW_UP_2_BODY,
    status: 'draft',
    send_enabled: false,
    safety_limit: Number(process.env.OUTREACH_SAFETY_LIMIT || DEFAULT_SAFETY_LIMIT),
    timezone: process.env.OUTREACH_TIMEZONE || 'America/New_York',
    created_at: now,
    updated_at: now,
  }
  store.campaigns.push(campaign)
  addEvent(store, { campaign_id: campaign.id, event_type: 'campaign_created', metadata: { tag: DEFAULT_CAMPAIGN_TAG } })
  return campaign
}
