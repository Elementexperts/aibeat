import type { OutreachContactType, OutreachLead, OutreachPriority } from './outreach-types'

const NOW = '2026-08-04T00:00:00.000Z'
const APPROVED_BY = 'manual_betalist_review'
const LAWFUL_BASIS = 'Manually reviewed public business contact from a BetaList lead table for relevant B2B founder outreach. Draft creation only; sending remains disabled.'

type BetaListSeed = {
  domain: string
  email: string
  toolName: string
  category: string
  contactType: OutreachContactType
  priority: OutreachPriority
  betaListUrl?: string
  opening: string
  notes: string
  approved?: boolean
  suppressionReason?: string
}

const SEEDS: BetaListSeed[] = [
  {
    domain: 'vidrip.app',
    email: 'privacy@vidrip.app',
    toolName: 'Vidrip',
    category: 'Creator video and audience feedback',
    contactType: 'privacy',
    priority: 'low',
    betaListUrl: 'https://betalist.com/startups/vidrip',
    opening: 'Vidrip is building around creator reactions, private audience rooms, and real video feedback rather than vanity metrics. That creator-feedback angle could make a useful AIBeat story for founders thinking about authentic video communities and launch validation.',
    notes: 'Do not draft to privacy inbox. If a general business or creator partnerships address is found later, Vidrip may be a fit for creator economy coverage.',
    approved: false,
    suppressionReason: 'Privacy inbox is not appropriate for promotional outreach.',
  },
  {
    domain: 'hitabi.com',
    email: 'hello@hitabi.com',
    toolName: 'Hitabi',
    category: 'AI startup',
    contactType: 'general_business',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/hitabi',
    opening: 'I saw Hitabi in the BetaList lead set and wanted to say congratulations on getting in front of early adopters there. AIBeat could help translate that early launch attention into a more durable discovery surface through a focused directory listing and founder-friendly feature copy.',
    notes: 'Use a broad founder/discovery angle because the public product positioning was not reliably available during review.',
  },
  {
    domain: 'promohyper.com',
    email: 'hello@promohyper.com',
    toolName: 'PromoHyper',
    category: 'Marketing and promotion',
    contactType: 'general_business',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/promohyper',
    opening: 'I saw PromoHyper in the BetaList lead set and wanted to congratulate you on the listing. Since the name points toward promotion and growth, AIBeat could be a natural place to reach founders and marketers who are actively looking for new tools to help with launch visibility.',
    notes: 'Position around founder promotion, launch visibility, newsletter inclusion, and directory discovery.',
  },
  {
    domain: 'flintideas.app',
    email: 'support@flintideas.app',
    toolName: 'Flint',
    category: 'AI lead generation and recommenders',
    contactType: 'support',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/flint',
    opening: 'Flint stood out because it turns product recommenders, service suggesters, and quote calculators into lead-capture tools that can be embedded on a website. That is exactly the kind of practical AI workflow AIBeat readers look for: not just AI for novelty, but AI that helps a business qualify demand.',
    notes: 'Strong fit for articles about AI-powered lead capture, conversion-rate optimization, and no-code recommenders.',
  },
  {
    domain: 'tryterrain.com',
    email: 'press@tryterrain.com',
    toolName: 'Terrain',
    category: 'AI startup',
    contactType: 'press',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/terrain',
    opening: 'I saw Terrain in the BetaList lead set and noticed you are using a press inbox, which usually means the team is open to launch coverage. AIBeat could help package the product for people already browsing AI tools by use case, category, and startup launch timing.',
    notes: 'Press contact suggests editorial coverage is appropriate; keep message focused on feature/listing options rather than sales claims.',
  },
  {
    domain: 'enverstudio.com',
    email: 'hi@enverstudio.com',
    toolName: 'Enver Studio',
    category: 'Design, UI/UX and creative studio',
    contactType: 'general_business',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/enverstudio',
    opening: 'Enver Studio appears positioned around design, UI/UX, animation, and digital product work. AIBeat could help you reach founders who are not only looking for AI tools, but also need credible design and product partners to turn AI ideas into polished launch-ready experiences.',
    notes: 'Fit is founder-services adjacent: product design, UI/UX, launch assets, and creative execution for AI startups.',
  },
  {
    domain: 'tapvid.ai',
    email: 'official@tapvid.ai',
    toolName: 'TapVid',
    category: 'AI video and explainer generation',
    contactType: 'general_business',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/tapvid',
    opening: 'TapVid is a clear fit for AIBeat because it turns prompts, PDFs, links, and scripts into motion explainer videos. That gives us a concrete use case to highlight for SaaS teams, educators, and marketers who need product demos or educational content without a full video-editing workflow.',
    notes: 'Excellent fit for newsletter/tool feature around AI explainer video, PDF-to-video, and product demo workflows.',
  },
  {
    domain: 'notshot.ai',
    email: 'hi@notshot.ai',
    toolName: 'NotShot',
    category: 'AI ecommerce and fashion rendering',
    contactType: 'general_business',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/notshot',
    opening: 'NotShot stood out because it focuses on production-grade fashion catalog renders instead of generic image generation. AIBeat could frame the story around a very specific business outcome: helping fashion brands create try-on catalog assets faster while keeping quality control visible.',
    notes: 'Strong niche feature for ecommerce, fashion AI, catalog photography replacement, and product rendering.',
  },
  {
    domain: 'attribloom.com',
    email: 'info@attribloom.com',
    toolName: 'Attribloom',
    category: 'Affiliate attribution for apps',
    contactType: 'general_business',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/attribloom',
    opening: 'Attribloom is interesting because it solves a very specific growth problem for iOS apps: affiliate attribution for App Store subscriptions using StoreKit 2 and Apple server notifications instead of old cookie or receipt-based tracking. AIBeat could help explain that distinction to app founders who are trying to grow with creators.',
    notes: 'Great fit for founder education around app growth, creator affiliates, StoreKit 2 attribution, and privacy-safe performance marketing.',
  },
  {
    domain: 'patapim.ai',
    email: 'info@patapim.ai',
    toolName: 'Patapim',
    category: 'AI startup',
    contactType: 'general_business',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/patapim',
    opening: 'I saw Patapim in the BetaList lead set and wanted to congratulate you on getting early launch visibility. AIBeat can help make that discovery more durable by turning a launch listing into a searchable AIBeat profile, newsletter mention, or short editorial feature.',
    notes: 'Use general BetaList launch-to-AIBeat-discovery positioning because public product details were limited at review time.',
  },
  {
    domain: 'facesage.app',
    email: 'support@facesage.app',
    toolName: 'FaceSage',
    category: 'AI health and face analysis',
    contactType: 'support',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/facesage',
    opening: 'FaceSage appears to sit in the face-analysis and biological-age space, which is a category where clarity and trust matter as much as novelty. AIBeat could help present the product with careful context around use case, audience, and responsible AI positioning.',
    notes: 'Sensitive category; avoid medical claims. Focus on responsible AI discovery and clear tool listing language.',
  },
  {
    domain: 'flowaivideo.org',
    email: 'support@flowaivideo.org',
    toolName: 'Flow AI Video',
    category: 'AI video generation',
    contactType: 'support',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/flow-ai-video',
    opening: 'Flow AI Video is a strong fit for AIBeat because it gives creators and businesses access to AI video generation without local GPU setup. The useful angle for our readers is practical: social clips, product ads, explainers, and creative tests from text or image prompts.',
    notes: 'Fit for AI video generator directory placement, newsletter tool pick, and article around video creation workflows.',
  },
  {
    domain: 'meethalfway.app',
    email: 'hello@meethalfway.app',
    toolName: 'Halfway',
    category: 'Couples finance and AI assistant',
    contactType: 'general_business',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/halfway',
    opening: 'Halfway stood out because it is not another generic budgeting app; it focuses on couples who split expenses fairly by income while keeping financial independence. AIBeat could highlight the AI assistant and fairness workflow for readers interested in practical consumer AI and fintech tools.',
    notes: 'Fit for consumer AI/fintech feature, especially around AI financial assistant and fair expense splitting.',
  },
  {
    domain: 'paperpulse.mondosoft.io',
    email: 'support@mondosoft.io',
    toolName: 'PaperPulse',
    category: 'AI research and document workflow',
    contactType: 'support',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/paperpulse',
    opening: 'PaperPulse looks like it belongs in the research and document-intelligence lane. AIBeat could help position it for researchers, founders, and technical teams who want AI support for reading, organizing, or acting on dense information.',
    notes: 'Use research/productivity angle; public product detail was limited during review.',
  },
  {
    domain: 'pulse-repo.com',
    email: 'support@pulse-repo.com',
    toolName: 'PulseRepo',
    category: 'Developer analytics and repository intelligence',
    contactType: 'support',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/pulse-repo',
    opening: 'PulseRepo is compelling because it reads repository history and turns process health into plain-language questions and signals without modifying code. AIBeat could help reach engineering leaders who want AI-assisted visibility into how teams actually ship, without turning the tool into employee surveillance.',
    notes: 'Strong developer-tools fit; emphasize repo health, engineering process, read-only access, and responsible team insights.',
  },
  {
    domain: 'postrush.io',
    email: 'support@postrush.io',
    toolName: 'PostRush',
    category: 'Content and social publishing',
    contactType: 'support',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/postrush',
    opening: 'PostRush sounds aligned with the content velocity problem many founders face after launch: keeping updates, posts, and announcements moving consistently. AIBeat could help introduce it to founders and marketers looking for AI-supported ways to turn product momentum into repeatable distribution.',
    notes: 'Position around founder distribution, content workflow, and launch momentum.',
  },
  {
    domain: 'owni.chat',
    email: 'sales@owni.chat',
    toolName: 'owni.chat',
    category: 'AI chat assistant and live chat',
    contactType: 'sales',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/owni-chat',
    opening: 'owni.chat is a strong AIBeat fit because it combines live chat, an AI assistant trained on a company knowledge base, no-code flows, and a shared inbox. That gives us a clear growth story: helping websites turn visitor questions into qualified conversations instead of missed opportunities.',
    notes: 'Excellent fit for AI customer support, website conversion, ecommerce/SaaS lead capture, and chatbot directory categories.',
  },
  {
    domain: 'personyze.com',
    email: 'support@personyze.com',
    toolName: 'Personyze',
    category: 'AI personalization and conversion optimization',
    contactType: 'support',
    priority: 'high',
    betaListUrl: 'https://betalist.com/startups/personyze',
    opening: 'Personyze already has a clear growth story: one platform for web personalization, recommendations, A/B testing, email, and push using a unified visitor profile. AIBeat could help put that in front of marketers comparing AI personalization tools and looking for a more complete alternative to point solutions.',
    notes: 'Strong fit for AI personalization, ecommerce/SaaS conversion optimization, recommendations, and marketing automation content.',
  },
  {
    domain: 'donivo.app',
    email: 'support@donivo.app',
    toolName: 'Donivo',
    category: 'Social media scheduling',
    contactType: 'support',
    priority: 'medium',
    betaListUrl: 'https://betalist.com/startups/donivo',
    opening: 'Donivo solves a simple but painful workflow: one post, tailored and scheduled across eight networks without tab-hopping. AIBeat could frame it for creators, founders, and small teams who need consistent distribution after launch but do not want a heavy social media stack.',
    notes: 'Fit for founder distribution, social scheduling, creator workflow, and launch operations.',
  },
]

function idForEmail(email: string) {
  return `lead_${Buffer.from(email.toLowerCase()).toString('base64url').slice(0, 16)}`
}

function website(domain: string) {
  return `https://${domain}/`
}

export const BETALIST_CAMPAIGN_SUBJECT = 'Congrats on {{tool_name}} being listed on BetaList'
export const BETALIST_CAMPAIGN_PREVIEW = 'A possible AIBeat feature for {{tool_name}} after the BetaList listing'
export const BETALIST_CAMPAIGN_BODY = `Hi {{first_name}},

Congratulations on being listed on BetaList. I saw {{tool_name}} there and wanted to wish you good luck with the launch.

{{personalized_opening}}

I am Nomoz, founder of AIBeat. We help people discover useful AI tools, emerging startups, and practical AI workflows through our directory, newsletter, and editorial coverage.

For {{tool_name}}, I think AIBeat could help with visibility in a few focused ways:

- a searchable AIBeat tool listing by category and use case
- a short newsletter mention for readers looking for new AI products
- an editorial article, founder story, or Spotlight feature if you want a deeper launch push
- a direct submission path here: https://www.aibeat.dev/submit

No pressure at all. If you are interested, I would be happy to share the feature options and suggest the best fit for {{tool_name}}.

Best regards,

Nomoz Fayzullaev
Founder, AIBeat
https://www.aibeat.dev
hello@aibeat.dev`

export const BETALIST_FOLLOW_UP_1_SUBJECT = 'Following up on {{tool_name}} and AIBeat'
export const BETALIST_FOLLOW_UP_1_BODY = `Hi {{first_name}},

Just following up on my note about {{tool_name}} after seeing the BetaList listing.

The reason I reached out is simple: early products often get a short burst of launch attention, then the visibility fades. AIBeat can help keep the product discoverable through a tool listing, newsletter mention, article, or Spotlight-style feature.

Would it be useful if I sent the available AIBeat feature options?

Best regards,

Nomoz
AIBeat
https://www.aibeat.dev`

export const BETALIST_FOLLOW_UP_2_SUBJECT = 'One last note about featuring {{tool_name}}'
export const BETALIST_FOLLOW_UP_2_BODY = `Hi {{first_name}},

One last quick note from me about {{tool_name}}.

If extra visibility after the BetaList listing would be useful, AIBeat may be able to help through directory discovery, newsletter exposure, or an editorial feature. If now is not the right time, no action is needed and I will not keep following up.

Wishing you continued momentum with the launch.

Best regards,

Nomoz
AIBeat`

export function getBetaListOutreachLeads(now = NOW): OutreachLead[] {
  return SEEDS.map((seed) => {
    const approved = seed.approved !== false
    const base: OutreachLead = {
      id: idForEmail(seed.email),
      email: seed.email.toLowerCase(),
      company_name: seed.toolName,
      tool_name: seed.toolName,
      website_url: website(seed.domain),
      product_hunt_url: undefined,
      category: seed.category,
      contact_type: seed.contactType,
      source: 'Beta List',
      public_contact_source_url: seed.betaListUrl || website(seed.domain),
      personalized_opening: seed.opening,
      status: approved ? 'approved' : 'suppressed',
      priority: seed.priority,
      qualification_score: approved ? 82 : 0,
      qualification_reasons: [
        'Manually supplied BetaList lead',
        seed.notes,
      ],
      consent_status: approved ? 'legitimate_business_interest_reviewed' : 'rejected',
      lawful_basis: LAWFUL_BASIS,
      approved_for_outreach: approved,
      approved_at: approved ? now : undefined,
      approved_by: approved ? APPROVED_BY : undefined,
      discovered_at: now,
      contact_verified_at: now,
      contact_validation_notes: seed.notes,
      suppressed_at: approved ? undefined : now,
      suppression_reason: seed.suppressionReason,
      notes: seed.notes,
      created_at: now,
      updated_at: now,
    }
    return base
  })
}
