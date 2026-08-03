import { KitApiError, KitClient, type KitTag } from './kit/client'
import { REQUIRED_CUSTOM_FIELDS, DEFAULT_CAMPAIGN_TAG, type OutreachCampaign, type OutreachLead, type OutreachStore } from './outreach-types'
import { canSyncLead, validateFutureSendAt } from './outreach-validation'
import { renderHtmlTemplate, renderTextTemplate } from './outreach-renderer'
import { addEvent } from './outreach-store'

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

export async function resolveOutreachTag(client: KitClient, campaign: OutreachCampaign): Promise<KitTag> {
  const configured = campaign.kit_tag_id || process.env.KIT_OUTREACH_TAG_ID
  const tags = await client.listTags()
  if (configured) {
    const found = tags.find((tag) => tag.id === configured)
    if (!found) throw new KitApiError('The configured outreach tag was not found.', 404, 'outreach_tag_not_found')
    return found
  }
  const exact = tags.find((tag) => normalizeName(tag.name) === normalizeName(DEFAULT_CAMPAIGN_TAG))
  if (exact) return exact
  return client.createTag(DEFAULT_CAMPAIGN_TAG)
}

export async function ensureCustomFields(client: KitClient): Promise<Set<string>> {
  const existing = await client.listCustomFields()
  const keys = new Set(existing.map((field) => field.key))
  for (const key of REQUIRED_CUSTOM_FIELDS) {
    if (!keys.has(key)) {
      const field = await client.createCustomField(key)
      keys.add(field.key)
    }
  }
  return keys
}

function subscriberFields(lead: OutreachLead, allowed: Set<string>) {
  const raw: Record<string, string | undefined> = {
    company_name: lead.company_name,
    tool_name: lead.tool_name,
    website_url: lead.website_url,
    product_hunt_url: lead.product_hunt_url,
    launch_date: lead.launch_date,
    lead_category: lead.category,
    personalized_opening: lead.personalized_opening,
    outreach_source: lead.source,
  }
  return Object.fromEntries(Object.entries(raw).filter(([key, value]) => allowed.has(key) && value)) as Record<string, string>
}

export async function syncApprovedLeadsToKit(input: { store: OutreachStore; campaign: OutreachCampaign; client: KitClient }) {
  const tag = await resolveOutreachTag(input.client, input.campaign)
  const fields = await ensureCustomFields(input.client)
  const synced: string[] = []
  const skipped: Array<{ email: string; reasons: string[] }> = []

  input.campaign.kit_tag_id = tag.id

  for (const lead of input.store.leads) {
    const allowed = canSyncLead(lead)
    if (!allowed.ok) {
      skipped.push({ email: lead.email, reasons: allowed.errors })
      continue
    }
    if (!lead.kit_subscriber_id) {
      const subscriber = await input.client.createOrUpdateSubscriber({ email_address: lead.email, first_name: lead.first_name, fields: subscriberFields(lead, fields) })
      lead.kit_subscriber_id = subscriber.id
    }
    await input.client.tagSubscriber(tag.id, lead.kit_subscriber_id)
    lead.kit_tag_id = tag.id
    lead.status = 'synced'
    lead.updated_at = new Date().toISOString()
    synced.push(lead.email)
    addEvent(input.store, { lead_id: lead.id, campaign_id: input.campaign.id, event_type: 'kit_sync_completed' })
  }

  input.campaign.updated_at = new Date().toISOString()
  return { tag, synced, skipped }
}

export function previewCampaign(campaign: OutreachCampaign, lead: OutreachLead) {
  const subject = renderTextTemplate(campaign.subject_template, lead)
  const body = renderHtmlTemplate(campaign.body_template_text, lead)
  return { subject: subject.text, html: body.html, text: body.text, missing: [...subject.missing, ...body.missing], unknown: [...subject.unknown, ...body.unknown] }
}

export async function createCampaignDraft(input: { store: OutreachStore; campaign: OutreachCampaign; client: KitClient }) {
  if (input.campaign.initial_broadcast_id) return { reused: true, broadcastId: input.campaign.initial_broadcast_id }
  const tag = await resolveOutreachTag(input.client, input.campaign)
  const recipients = input.store.leads.filter((lead) => lead.kit_tag_id === tag.id && !lead.suppressed_at && !lead.unsubscribed_at)
  if (recipients.length === 0) throw new Error('No recipients match this campaign tag.')
  if (recipients.length > input.campaign.safety_limit) throw new Error('Recipient count exceeds the campaign safety limit.')

  const rendered = previewCampaign(input.campaign, recipients[0])
  if (!rendered.subject || !rendered.html) throw new Error('Subject and content are required.')
  if (rendered.unknown.length > 0) throw new Error(`Unknown merge variables: ${rendered.unknown.join(', ')}`)

  const broadcast = await input.client.createBroadcast({
    email_template_id: process.env.KIT_DEFAULT_EMAIL_TEMPLATE_ID,
    subject: rendered.subject,
    content: rendered.html,
    description: 'AIBeat Product Hunt outreach campaign',
    preview_text: input.campaign.preview_text,
    public: false,
    send_at: null,
    subscriber_filter: [{ all: [{ type: 'tag', ids: [tag.id] }] }],
  })
  input.campaign.initial_broadcast_id = broadcast.id
  input.campaign.status = 'draft'
  input.campaign.updated_at = new Date().toISOString()
  addEvent(input.store, { campaign_id: input.campaign.id, event_type: 'draft_created', metadata: { broadcast_id: broadcast.id } })
  return { reused: false, broadcastId: broadcast.id }
}

function individualTagName(lead: OutreachLead) {
  const readable = lead.tool_name.replace(/[^a-zA-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ').slice(0, 80)
  return `AIBeat Outreach - ${readable || lead.id} - ${lead.id}`
}

export async function createIndividualLeadDraft(input: { store: OutreachStore; campaign: OutreachCampaign; client: KitClient; lead: OutreachLead }) {
  if (process.env.OUTREACH_SEND_ENABLED === 'true' || process.env.AUTOMATED_KIT_SEND_ENABLED === 'true') {
    throw new Error('Individual outreach automation requires sending flags to remain disabled.')
  }

  const allowed = canSyncLead(input.lead)
  if (!allowed.ok) throw new Error(`Lead cannot be drafted: ${allowed.errors.join('; ')}`)
  if (input.lead.initial_broadcast_id) return { reused: true, broadcastId: input.lead.initial_broadcast_id, tagId: input.lead.kit_individual_tag_id }

  const campaignTag = await resolveOutreachTag(input.client, input.campaign)
  const fields = await ensureCustomFields(input.client)
  input.campaign.kit_tag_id = campaignTag.id

  if (!input.lead.kit_subscriber_id) {
    const subscriber = await input.client.createOrUpdateSubscriber({
      email_address: input.lead.email,
      first_name: input.lead.first_name,
      fields: subscriberFields(input.lead, fields),
    })
    input.lead.kit_subscriber_id = subscriber.id
  }

  await input.client.tagSubscriber(campaignTag.id, input.lead.kit_subscriber_id)
  input.lead.kit_tag_id = campaignTag.id

  const tags = await input.client.listTags()
  const tagName = individualTagName(input.lead)
  const individualTag = tags.find((tag) => normalizeName(tag.name) === normalizeName(tagName)) || await input.client.createTag(tagName)
  await input.client.tagSubscriber(individualTag.id, input.lead.kit_subscriber_id)
  input.lead.kit_individual_tag_id = individualTag.id

  const rendered = previewCampaign(input.campaign, input.lead)
  if (!rendered.subject || !rendered.html) throw new Error('Subject and content are required.')
  if (rendered.unknown.length > 0) throw new Error(`Unknown merge variables: ${rendered.unknown.join(', ')}`)

  const broadcast = await input.client.createBroadcast({
    email_template_id: process.env.KIT_DEFAULT_EMAIL_TEMPLATE_ID,
    subject: rendered.subject,
    content: rendered.html,
    description: `${input.lead.tool_name} - AIBeat individual outreach draft`,
    preview_text: input.campaign.preview_text,
    public: false,
    send_at: null,
    subscriber_filter: [{ all: [{ type: 'tag', ids: [individualTag.id] }] }],
  })

  input.lead.initial_broadcast_id = broadcast.id
  input.lead.status = 'draft_created'
  input.lead.updated_at = new Date().toISOString()
  input.campaign.updated_at = new Date().toISOString()
  addEvent(input.store, { lead_id: input.lead.id, campaign_id: input.campaign.id, event_type: 'individual_draft_created', metadata: { broadcast_id: broadcast.id, tag_id: individualTag.id } })
  return { reused: false, broadcastId: broadcast.id, tagId: individualTag.id }
}

export async function createIndividualLeadDrafts(input: { store: OutreachStore; campaign: OutreachCampaign; client: KitClient; limit?: number; source?: string; emails?: string[] }) {
  const limit = Math.min(input.limit || input.campaign.safety_limit, input.campaign.safety_limit)
  const source = input.source?.trim().toLowerCase()
  const emails = input.emails ? new Set(input.emails.map((email) => email.trim().toLowerCase())) : undefined
  const scopedLeads = input.store.leads.filter((lead) => {
    if (source && lead.source.toLowerCase() !== source) return false
    if (emails && !emails.has(lead.email.toLowerCase())) return false
    return true
  })
  const eligible = scopedLeads.filter((lead) => canSyncLead(lead).ok && !lead.initial_broadcast_id).slice(0, limit)
  const results: Array<{ email: string; toolName: string; broadcastId: string; tagId?: string; reused: boolean }> = []

  for (const lead of eligible) {
    const result = await createIndividualLeadDraft({ ...input, lead })
    results.push({ email: lead.email, toolName: lead.tool_name, broadcastId: result.broadcastId, tagId: result.tagId, reused: result.reused })
  }

  return { created: results, skipped: scopedLeads.length - eligible.length }
}

export async function scheduleCampaign(input: { store: OutreachStore; campaign: OutreachCampaign; client: KitClient; sendAt: string; confirmed: boolean }) {
  if (process.env.OUTREACH_SEND_ENABLED !== 'true') throw new Error('Sending is disabled by OUTREACH_SEND_ENABLED.')
  if (!input.campaign.send_enabled) throw new Error('Campaign sending is disabled.')
  if (!input.confirmed) throw new Error('Scheduling requires explicit confirmation.')
  if (!input.campaign.initial_broadcast_id) throw new Error('Create a Kit draft before scheduling.')
  const future = validateFutureSendAt(input.sendAt)
  if (!future.ok) throw new Error(future.error)
  await input.client.updateBroadcast(input.campaign.initial_broadcast_id, { public: true, send_at: input.sendAt })
  input.campaign.status = 'active'
  input.campaign.updated_at = new Date().toISOString()
  addEvent(input.store, { campaign_id: input.campaign.id, event_type: 'broadcast_scheduled' })
}

export function markLeadReplied(store: OutreachStore, leadId: string, actor = 'admin') {
  const lead = store.leads.find((item) => item.id === leadId)
  if (!lead) throw new Error('Lead not found.')
  lead.status = 'replied'
  lead.replied_at = new Date().toISOString()
  lead.next_follow_up_at = undefined
  lead.updated_at = new Date().toISOString()
  addEvent(store, { lead_id: lead.id, event_type: 'marked_replied', created_by: actor })
}
