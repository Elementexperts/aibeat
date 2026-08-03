import test from 'node:test'
import assert from 'node:assert/strict'

import { BETALIST_CAMPAIGN_BODY, BETALIST_CAMPAIGN_PREVIEW, BETALIST_CAMPAIGN_SUBJECT, getBetaListOutreachLeads } from '../lib/betalist-outreach-leads'
import type { KitClient, KitTag } from '../lib/kit/client'
import type { OutreachCampaign, OutreachLead, OutreachStore } from '../lib/outreach-types'
import { canSyncLead } from '../lib/outreach-validation'
import { createIndividualLeadDrafts } from '../lib/outreach-workflow'

function campaign(): OutreachCampaign {
  return {
    id: 'campaign_product_hunt',
    name: 'AIBeat Product Hunt Outreach',
    slug: 'product-hunt-outreach',
    kit_tag_id: 'campaign-tag',
    subject_template: BETALIST_CAMPAIGN_SUBJECT,
    preview_text: BETALIST_CAMPAIGN_PREVIEW,
    body_template_html: BETALIST_CAMPAIGN_BODY,
    body_template_text: BETALIST_CAMPAIGN_BODY,
    follow_up_1_subject: 'Following up on {{tool_name}}',
    follow_up_1_body_html: 'Hi {{first_name}}, following up on {{tool_name}}.',
    follow_up_2_subject: 'One last note about {{tool_name}}',
    follow_up_2_body_html: 'Hi {{first_name}}, one last note about {{tool_name}}.',
    status: 'draft',
    send_enabled: false,
    safety_limit: 25,
    timezone: 'America/New_York',
    created_at: '2026-08-04T00:00:00.000Z',
    updated_at: '2026-08-04T00:00:00.000Z',
  }
}

function productHuntLead(): OutreachLead {
  return {
    id: 'lead_product_hunt',
    email: 'hello@producthunt-example.test',
    tool_name: 'Product Hunt Example',
    contact_type: 'general_business',
    source: 'Product Hunt',
    public_contact_source_url: 'https://www.producthunt.com/posts/product-hunt-example',
    status: 'approved',
    priority: 'medium',
    consent_status: 'legitimate_business_interest_reviewed',
    lawful_basis: 'Reviewed public business contact.',
    approved_for_outreach: true,
    created_at: '2026-08-04T00:00:00.000Z',
    updated_at: '2026-08-04T00:00:00.000Z',
  }
}

function mockKitClient() {
  const broadcasts: Array<{ subject: string; content: string; filterTagId: string }> = []
  const tags: KitTag[] = [{ id: 'campaign-tag', name: 'AIBeat Outreach - Beta List' }]
  let nextTag = 1
  let nextSubscriber = 1
  let nextBroadcast = 1

  const client = {
    async listTags() {
      return tags
    },
    async createTag(name: string) {
      const tag = { id: `individual-tag-${nextTag++}`, name }
      tags.push(tag)
      return tag
    },
    async listCustomFields() {
      return [
        { id: '1', key: 'company_name' },
        { id: '2', key: 'tool_name' },
        { id: '3', key: 'website_url' },
        { id: '4', key: 'product_hunt_url' },
        { id: '5', key: 'launch_date' },
        { id: '6', key: 'lead_category' },
        { id: '7', key: 'personalized_opening' },
        { id: '8', key: 'outreach_source' },
      ]
    },
    async createCustomField(key: string) {
      return { id: `field-${key}`, key }
    },
    async createOrUpdateSubscriber() {
      return { id: `subscriber-${nextSubscriber++}` }
    },
    async tagSubscriber() {
      return undefined
    },
    async createBroadcast(input: { subject: string; content: string; subscriber_filter: { all?: Array<{ ids: string[] }> } }) {
      broadcasts.push({
        subject: input.subject,
        content: input.content,
        filterTagId: input.subscriber_filter.all?.[0]?.ids[0] || '',
      })
      return { id: `broadcast-${nextBroadcast++}` }
    },
  } as unknown as KitClient

  return { client, broadcasts }
}

test('BetaList seed contains reviewed leads and suppresses privacy inboxes', () => {
  const leads = getBetaListOutreachLeads()
  const approved = leads.filter((lead) => canSyncLead(lead).ok)
  const vidrip = leads.find((lead) => lead.email === 'privacy@vidrip.app')

  assert.equal(leads.length, 19)
  assert.equal(approved.length, 18)
  assert.ok(vidrip)
  assert.equal(vidrip?.contact_type, 'privacy')
  assert.equal(vidrip?.status, 'suppressed')
  assert.equal(canSyncLead(vidrip as OutreachLead).ok, false)
})

test('BetaList outreach copy includes the launch context and AIBeat submission link', () => {
  assert.match(BETALIST_CAMPAIGN_SUBJECT, /BetaList/)
  assert.match(BETALIST_CAMPAIGN_BODY, /Congratulations on being listed on BetaList/)
  assert.match(BETALIST_CAMPAIGN_BODY, /https:\/\/www\.aibeat\.dev\/submit/)
  assert.match(BETALIST_CAMPAIGN_BODY, /newsletter/)
  assert.match(BETALIST_CAMPAIGN_BODY, /editorial article/)
})

test('individual drafts can be limited to BetaList leads only', async () => {
  const store: OutreachStore = {
    leads: [productHuntLead(), ...getBetaListOutreachLeads()],
    campaigns: [],
    events: [],
  }
  const { client, broadcasts } = mockKitClient()

  const result = await createIndividualLeadDrafts({
    store,
    campaign: campaign(),
    client,
    source: 'Beta List',
    limit: 2,
  })

  assert.equal(result.created.length, 2)
  assert.equal(result.skipped, 17)
  assert.deepEqual(result.created.map((item) => item.email), ['hello@hitabi.com', 'hello@promohyper.com'])
  assert.equal(store.leads[0].initial_broadcast_id, undefined)
  assert.equal(broadcasts.length, 2)
  assert.match(broadcasts[0].subject, /Hitabi/)
  assert.match(broadcasts[0].content, /BetaList/)
  assert.notEqual(broadcasts[0].filterTagId, 'campaign-tag')
})
