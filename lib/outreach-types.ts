export type OutreachStatus =
  | 'new'
  | 'reviewed'
  | 'approved'
  | 'synced'
  | 'draft_created'
  | 'scheduled'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'declined'
  | 'bounced'
  | 'unsubscribed'
  | 'suppressed'

export type OutreachPriority = 'high' | 'medium' | 'low'
export type OutreachContactType = 'general_business' | 'partnerships' | 'press' | 'sales' | 'support' | 'founder_public' | 'privacy' | 'legal' | 'security' | 'abuse' | 'dpo' | 'no-reply' | 'noreply' | 'unknown'
export type OutreachConsentStatus = 'confirmed' | 'legitimate_business_interest_reviewed' | 'unknown' | 'rejected'

export type OutreachLead = {
  id: string
  email: string
  first_name?: string
  last_name?: string
  founder_name?: string
  company_name?: string
  tool_name: string
  website_url?: string
  product_hunt_url?: string
  launch_date?: string
  category?: string
  contact_type: OutreachContactType
  source: string
  public_contact_source_url: string
  personalized_opening?: string
  status: OutreachStatus
  priority: OutreachPriority
  qualification_score?: number
  qualification_reasons?: string[]
  consent_status: OutreachConsentStatus
  lawful_basis: string
  approved_for_outreach: boolean
  approved_at?: string
  approved_by?: string
  discovered_at?: string
  discovery_run_id?: string
  contact_verified_at?: string
  contact_validation_notes?: string
  kit_subscriber_id?: string
  kit_tag_id?: string
  kit_individual_tag_id?: string
  initial_broadcast_id?: string
  follow_up_1_broadcast_id?: string
  follow_up_2_broadcast_id?: string
  last_contacted_at?: string
  next_follow_up_at?: string
  replied_at?: string
  unsubscribed_at?: string
  suppressed_at?: string
  suppression_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type OutreachCampaign = {
  id: string
  name: string
  slug: string
  kit_tag_id?: string
  subject_template: string
  preview_text?: string
  body_template_html: string
  body_template_text: string
  follow_up_1_subject: string
  follow_up_1_body_html: string
  follow_up_2_subject: string
  follow_up_2_body_html: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  send_enabled: boolean
  safety_limit: number
  timezone: string
  initial_broadcast_id?: string
  created_at: string
  updated_at: string
}

export type OutreachEvent = {
  id: string
  lead_id?: string
  campaign_id?: string
  event_type: string
  metadata?: Record<string, unknown>
  created_by?: string
  created_at: string
}

export type OutreachStore = {
  leads: OutreachLead[]
  campaigns: OutreachCampaign[]
  events: OutreachEvent[]
}

export const DEFAULT_CAMPAIGN_NAME = 'AIBeat Product Hunt Outreach'
export const DEFAULT_CAMPAIGN_SLUG = 'product-hunt-outreach'
export const DEFAULT_CAMPAIGN_TAG = 'AIBeat Outreach – Product Hunt – July 2026'
export const DEFAULT_SAFETY_LIMIT = 25

export const DEFAULT_SUBJECT = 'Would love to feature {{tool_name}} on AIBeat'
export const DEFAULT_PREVIEW_TEXT = 'A possible AIBeat feature for {{tool_name}}'
export const DEFAULT_BODY = `Hi {{first_name}},

{{personalized_opening}}

I'm Nomoz, founder of AIBeat, a platform covering useful AI tools, startup launches and important developments across the AI industry.

I believe {{tool_name}} could be a strong fit for our readers. We would be interested in exploring an AIBeat feature, which may include an editorial listing, newsletter placement, product review or broader promotional coverage.

Our goal is to introduce useful AI products to people actively looking for new tools and solutions.

You can learn more about AIBeat here:
https://www.aibeat.dev

Would you be open to receiving our media kit and available feature options?

Best regards,

Nomoz Fayzullaev
Founder, AIBeat
https://www.aibeat.dev
hello@aibeat.dev`

export const FOLLOW_UP_1_SUBJECT = 'Following up about {{tool_name}}'
export const FOLLOW_UP_1_BODY = `Hi {{first_name}},

I wanted to follow up on my earlier message about featuring {{tool_name}} on AIBeat.

Your Product Hunt launch looked relevant to our audience, and we would still be glad to explore an editorial feature or optional promotional placement.

Would it be useful if I sent our media kit and available feature options?

Best regards,

Nomoz
AIBeat
https://www.aibeat.dev`

export const FOLLOW_UP_2_SUBJECT = 'One last note about {{tool_name}}'
export const FOLLOW_UP_2_BODY = `Hi {{first_name}},

I know things can be busy after a product launch, so I'll keep this brief.

I wanted to make one final follow-up regarding a possible AIBeat feature for {{tool_name}}. If additional exposure is useful, I would be glad to share the available options.

If this is not relevant at the moment, no action is needed and I won't continue following up.

Wishing you continued success with the product.

Best regards,

Nomoz
AIBeat`

export const REQUIRED_CUSTOM_FIELDS = [
  'company_name',
  'tool_name',
  'website_url',
  'product_hunt_url',
  'launch_date',
  'lead_category',
  'personalized_opening',
  'outreach_source',
] as const
