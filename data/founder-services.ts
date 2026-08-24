export type FounderServicePlanCategory =
  | 'listing'
  | 'spotlight'
  | 'launch'
  | 'newsletter'
  | 'article'
  | 'partnership'

export type FounderServiceBillingType = 'free' | 'one_time' | 'monthly' | 'custom'

export type FeatureValue = 'Included' | 'Not included' | 'Considered' | 'Optional add-on' | 'Custom'

export type FounderServicePlan = {
  id: string
  name: string
  shortDescription: string
  priceLabel: string
  priceAmount?: number
  billingType: FounderServiceBillingType
  recommended?: boolean
  badge?: string
  features: string[]
  exclusions?: string[]
  turnaround?: string
  placementDuration?: string
  ctaLabel: string
  ctaHref: string
  category: FounderServicePlanCategory
  active: boolean
  disclosure: string
  primaryAudience: string
  verificationRequired?: boolean
  verifiedBadgeIncluded?: boolean
}

export type FeatureMatrixColumn = {
  planId: string
  label: string
}

export type FeatureMatrixRow = {
  label: string
  values: Record<string, FeatureValue | string>
}

export const allowFollowedSponsoredLinks = false
export const AIBEAT_CANONICAL_URL = 'https://aibeat.dev'
export const AIBEAT_BADGE_PATHS = [
  '/badges/listed-on-aibeat.svg',
  '/badges/listed-on-aibeat-dark.svg',
  '/badges/listed-on-aibeat-light.svg',
]

export const FOUNDER_SERVICE_PLANS: FounderServicePlan[] = [
  {
    id: 'free',
    name: 'Free Listing',
    shortDescription: 'Add your AI product to the AIBeat directory for review and potential inclusion.',
    priceLabel: 'Free',
    priceAmount: 0,
    billingType: 'free',
    features: [
      'Standard tool listing',
      'Product name, logo and description',
      'Website link',
      'Primary category',
      'Directory search inclusion',
      'Listing update requests',
      'AIBeat badge/backlink verification before approval',
      'Editorial review before approval',
    ],
    exclusions: [
      'No guaranteed approval',
      'No guaranteed publication date',
      'No homepage placement',
      'No newsletter placement',
      'No sponsored article',
      'No priority review',
    ],
    ctaLabel: 'Submit Free',
    ctaHref: '/submit?plan=free',
    category: 'listing',
    active: true,
    disclosure: 'Badge or backlink verification may be requested before a Free Listing is approved and published.',
    primaryAudience: 'Founders who want simple free directory consideration.',
    verificationRequired: true,
    verifiedBadgeIncluded: false,
  },
  {
    id: 'simple',
    name: 'Simple Placement',
    shortDescription: 'A standard paid directory placement with manual quality and safety review.',
    priceLabel: '$1.99 one time',
    priceAmount: 1.99,
    billingType: 'one_time',
    features: [
      'Standard directory listing',
      'Product name, logo, short description and website link',
      'No AIBeat badge or backlink installation required',
      'Basic quality and safety review',
      'Regular publication queue',
    ],
    exclusions: [
      'No Verified badge',
      'No ranking, traffic, leads or positive editorial coverage guarantee',
    ],
    turnaround: 'Reviewed before publication',
    ctaLabel: 'Choose Simple — $1.99',
    ctaHref: '/submit?plan=simple',
    category: 'listing',
    active: true,
    disclosure: 'Payment does not grant a Verified badge or guarantee ranking, traffic, leads, or positive editorial coverage.',
    primaryAudience: 'Founders who want a basic paid directory placement without badge or backlink setup.',
    verifiedBadgeIncluded: false,
  },
  {
    id: 'featured',
    name: 'Featured Placement',
    shortDescription: 'Priority review, richer listing context, and a short category-page feature window.',
    priceLabel: '$9.95 one time',
    priceAmount: 9.95,
    billingType: 'one_time',
    recommended: true,
    badge: 'Most popular',
    features: [
      'Everything in Simple Placement',
      'Priority review',
      'Enhanced product description',
      'One product screenshot',
      'Featured label',
      'Relevant category-page placement for seven days',
    ],
    exclusions: [
      'No Verified badge',
      'No ranking, traffic, leads or positive editorial coverage guarantee',
    ],
    turnaround: '2-4 business days',
    placementDuration: '7 days',
    ctaLabel: 'Choose Featured — $9.95',
    ctaHref: '/submit?plan=featured',
    category: 'listing',
    active: true,
    disclosure: 'Featured placement is labeled where placement could affect reader interpretation.',
    primaryAudience: 'Relevant products that need priority review and a short featured placement.',
    verifiedBadgeIncluded: false,
  },
  {
    id: 'spotlight_pro',
    name: 'Spotlight Pro',
    shortDescription: 'The full self-service paid listing package with use-case context and a 14-day Spotlight placement.',
    priceLabel: '$29 one time',
    priceAmount: 29,
    billingType: 'one_time',
    features: [
      'Everything in Featured Placement',
      'Workflow or use-case section',
      'Up to three screenshots or one demo video',
      'Enhanced product summary and CTA',
      'Homepage or relevant category Spotlight placement for 14 days',
      'Priority publication workflow',
      'Newsletter and editorial consideration, without guaranteeing inclusion',
    ],
    exclusions: [
      'No Verified badge',
      'No ranking, traffic, clicks, sales, review score, or newsletter coverage guarantee',
    ],
    turnaround: '1-3 business days',
    placementDuration: '14 days',
    ctaLabel: 'Get Spotlight Pro — $29',
    ctaHref: '/submit?plan=spotlight_pro',
    category: 'listing',
    active: true,
    disclosure: 'Spotlight placement is promotional and labeled where placement could affect reader interpretation.',
    primaryAudience: 'Products that need the strongest self-service paid listing and Spotlight workflow.',
    verifiedBadgeIncluded: false,
  },
  {
    id: 'launch-campaign',
    name: 'Launch Campaign',
    shortDescription: 'Custom launch support for a new AI product or major update with clearly labeled promotional placements.',
    priceLabel: 'Custom',
    billingType: 'custom',
    features: [
      'Launch date and product story',
      'Logo, screenshots, demo video and founder quote',
      'Homepage or category launch placement when available',
      'Newsletter and editorial consideration',
      'Optional founder Q&A',
    ],
    turnaround: 'Scoped before scheduling',
    placementDuration: 'Defined before publication',
    ctaLabel: 'Discuss Launch Campaign',
    ctaHref: '/advertise?service=launch-campaign',
    category: 'launch',
    active: true,
    disclosure: 'Launch campaigns are reviewed for relevance and clearly labeled when promotional.',
    primaryAudience: 'New AI products, public releases, and major updates needing a custom campaign.',
  },
  {
    id: 'newsletter-sponsorship',
    name: 'Newsletter Sponsorship',
    shortDescription: 'Introduce your product to AIBeat newsletter readers through a custom, clearly labeled placement.',
    priceLabel: 'Custom',
    billingType: 'custom',
    features: [
      'Dedicated newsletter placement',
      'Logo',
      'Product headline',
      'Short editorial summary',
      'Key benefit',
      'Primary CTA',
      'UTM-tagged link',
      'Sponsored or featured label',
      'Preview before sending',
    ],
    exclusions: [
      'No guaranteed opens',
      'No guaranteed clicks',
      'No guaranteed conversions',
      'No guaranteed revenue',
    ],
    ctaLabel: 'Discuss Newsletter Sponsorship',
    ctaHref: '/advertise?service=newsletter',
    category: 'newsletter',
    active: true,
    disclosure: 'Availability depends on editorial calendar, audience relevance, and campaign fit.',
    primaryAudience: 'Products with a timely launch, workflow, or campaign offer.',
  },
  {
    id: 'sponsored-article',
    name: 'Sponsored Article',
    shortDescription: 'Publish a professionally presented sponsored or partner article about your product, launch, workflow, or industry perspective.',
    priceLabel: '$199 one time',
    priceAmount: 199,
    billingType: 'one_time',
    features: [
      'Topic planning',
      'AIBeat-formatted article',
      'Product screenshots',
      'Company and founder information',
      'One primary product link',
      'Relevant internal links',
      'SEO metadata',
      'Permanent article while compliant',
      'Editorial review before publication',
      'Sponsored or partner-content disclosure',
      'One revision round',
      'Newsletter consideration',
    ],
    exclusions: [
      'No guaranteed positive editorial opinion',
      'No do-follow backlink promise',
      'No misleading or unverifiable claims',
    ],
    ctaLabel: 'Request Sponsored Article',
    ctaHref: '/advertise?service=article',
    category: 'article',
    active: true,
    disclosure: 'Sponsored links follow current policy. Followed sponsored links are disabled by default.',
    primaryAudience: 'Teams with an educational story, founder angle, use case, or technical perspective.',
  },
  {
    id: 'growth-campaign',
    name: 'Growth Campaign',
    shortDescription: 'Combine directory, homepage, newsletter, article, and launch exposure into one coordinated AIBeat campaign.',
    priceLabel: 'From $349',
    priceAmount: 349,
    billingType: 'custom',
    features: [
      'Expanded listing presentation',
      'Spotlight placement',
      'Newsletter sponsorship',
      'Sponsored article or founder interview',
      'Launch page where relevant',
      'Social promotion',
      'Campaign planning',
      'UTM links',
      'Basic campaign report',
      'Defined campaign period',
    ],
    ctaLabel: 'Plan a Campaign',
    ctaHref: '/advertise?service=growth-campaign',
    category: 'spotlight',
    active: true,
    disclosure: 'Every paid or partner component is labeled according to its format.',
    primaryAudience: 'Teams planning a coordinated launch or multi-week visibility push.',
  },
  {
    id: 'partnership',
    name: 'Media and Affiliate Partnership',
    shortDescription: 'Build a reciprocal partnership through editorial features, affiliate offers, newsletter promotion, audience exchange, or joint campaigns.',
    priceLabel: 'Custom or exchange-based',
    billingType: 'custom',
    features: [
      'Reciprocal editorial coverage',
      'Newsletter mention exchange',
      'Partner directory listing',
      'Affiliate tracking',
      'Revenue share',
      'Joint founder campaigns',
      'Exclusive reader discounts',
      'Co-branded launch content',
      'Ongoing partner status',
    ],
    ctaLabel: 'Propose a Partnership',
    ctaHref: '/partners',
    category: 'partnership',
    active: true,
    disclosure: 'Partnership approval is based on relevance, quality, transparency, and mutual value.',
    primaryAudience: 'Relevant AI products, communities, newsletters, and marketplaces.',
  },
]

export const FEATURE_MATRIX_COLUMNS: FeatureMatrixColumn[] = [
  { planId: 'free', label: 'Free Listing' },
  { planId: 'simple', label: 'Simple' },
  { planId: 'featured', label: 'Featured' },
  { planId: 'spotlight_pro', label: 'Spotlight Pro' },
]

export const FEATURE_MATRIX_ROWS: FeatureMatrixRow[] = [
  { label: 'Standard directory listing', values: { free: 'Considered', simple: 'Included', featured: 'Included', spotlight_pro: 'Included' } },
  { label: 'Priority review', values: { free: 'Not included', simple: 'Not included', featured: 'Included', spotlight_pro: 'Included' } },
  { label: 'Screenshots', values: { free: 'Considered', simple: 'Not included', featured: 'One', spotlight_pro: 'Up to three or one video' } },
  { label: 'Category feature', values: { free: 'Not included', simple: 'Not included', featured: 'Included', spotlight_pro: 'Included' } },
  { label: 'Homepage Spotlight', values: { free: 'Not included', simple: 'Not included', featured: 'Not included', spotlight_pro: 'Considered' } },
  { label: 'Newsletter coverage', values: { free: 'Not included', simple: 'Not included', featured: 'Not included', spotlight_pro: 'Considered' } },
  { label: 'Verified badge', values: { free: 'Manual verification only', simple: 'Not included', featured: 'Not included', spotlight_pro: 'Not included' } },
  { label: 'Placement duration', values: { free: 'Not guaranteed', simple: 'Regular queue', featured: '7 days', spotlight_pro: '14 days' } },
]

export const DISCLOSURE_RULES = [
  {
    label: 'Editorial',
    body: 'Independent coverage selected by AIBeat. Payment does not buy editorial opinion.',
  },
  {
    label: 'Featured',
    body: 'Enhanced visibility or presentation for relevant products. Labels are used where placement could affect interpretation.',
  },
  {
    label: 'Sponsored',
    body: 'Paid promotion, sponsorship, or partner content. It is clearly identified for readers.',
  },
  {
    label: 'Affiliate',
    body: 'AIBeat may earn a commission from some links, with disclosure where used.',
  },
]

export const FOUNDER_PROCESS = [
  {
    title: 'Choose the goal',
    body: 'Tell us whether you want free submission, launch visibility, newsletter exposure, a partner article, or a broader campaign.',
  },
  {
    title: 'Share product context',
    body: 'Send the website, category, launch timing, audience, screenshots, founder details, and the use case you want people to understand.',
  },
  {
    title: 'AIBeat reviews fit',
    body: 'We check relevance, reader value, disclosure requirements, and whether the product belongs in editorial, featured, sponsored, or partner formats.',
  },
  {
    title: 'Payment or confirmation',
    body: 'For self-service paid listing packages, Stripe Checkout confirms payment. Custom campaigns are scoped manually before scheduling.',
  },
  {
    title: 'Publish and report',
    body: 'The listing, article, newsletter, launch, or campaign goes live only after review, assets, disclosure, and timing are confirmed.',
  },
]

export const CONTENT_LABELS = [
  { label: 'Standard Listing', purchasable: false, rule: 'A regular accepted directory listing.' },
  { label: 'Featured', purchasable: true, rule: 'A paid visibility or presentation label. Does not imply editorial endorsement.' },
  { label: 'Spotlight', purchasable: true, rule: 'Promotional visibility. Must not imply independent editorial endorsement.' },
  { label: 'New Launch', purchasable: true, rule: 'Depends on verified launch timing or accepted launch package.' },
  { label: 'Sponsored', purchasable: true, rule: 'Required for paid editorial or paid promotional placements.' },
  { label: 'Partner', purchasable: false, rule: 'Indicates a real partnership or exchange approved by AIBeat.' },
  { label: 'Editor’s Pick', purchasable: false, rule: 'Editorial-only label. It must not be purchasable.' },
]

export const PAID_SUBMISSION_PLAN_IDS = ['simple', 'featured', 'spotlight_pro'] as const
export const SUBMISSION_PLAN_IDS = ['free', ...PAID_SUBMISSION_PLAN_IDS] as const

export function getActivePlans() {
  return FOUNDER_SERVICE_PLANS.filter((plan) => plan.active)
}

export function getPlansByCategory(category: FounderServicePlanCategory) {
  return getActivePlans().filter((plan) => plan.category === category)
}

export function getRecommendedPlan() {
  return getActivePlans().find((plan) => plan.recommended)
}

export function getPlanById(id: string | null | undefined) {
  return getActivePlans().find((plan) => plan.id === id) || getActivePlans()[0]
}

export function getSubmissionPlans() {
  return SUBMISSION_PLAN_IDS.map((id) => getPlanById(id))
}

export function getPaidSubmissionPlans() {
  return PAID_SUBMISSION_PLAN_IDS.map((id) => getPlanById(id))
}

export function formatPlanPrice(plan: FounderServicePlan) {
  if (plan.billingType === 'free') return 'Free'
  if (plan.priceLabel) return plan.priceLabel
  if (plan.billingType === 'custom') return plan.priceLabel
  if (typeof plan.priceAmount === 'number') {
    return `$${plan.priceAmount}${plan.billingType === 'one_time' ? ' one time' : '/mo'}`
  }
  return plan.priceLabel
}

export function isEditorPickPurchasable() {
  return CONTENT_LABELS.find((item) => item.label === 'Editor’s Pick')?.purchasable === true
}
