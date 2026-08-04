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
      'AIBeat badge/backlink verification required',
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
    disclosure: 'Badge or backlink verification is required before a Free Listing can be reviewed and published.',
    primaryAudience: 'Founders who want free directory consideration and can verify website control.',
    verificationRequired: true,
  },
  {
    id: 'enhanced',
    name: 'Enhanced Listing',
    shortDescription: 'Upgrade your product page with a richer presentation and priority review.',
    priceLabel: '$29 one time',
    priceAmount: 29,
    billingType: 'one_time',
    features: [
      'Everything in Free Listing',
      'Priority review',
      'Enhanced product description',
      'Up to five screenshots',
      'Product video or demo link',
      'Additional category tags',
      'Key features and use cases',
      'Pricing section',
      'Social and founder links',
      'Enhanced Listing badge',
      'One listing update within 30 days',
    ],
    exclusions: [
      'No search ranking promise',
      'No traffic volume promise',
      'No lead or sales guarantee',
      'No newsletter coverage guarantee',
    ],
    turnaround: 'Reviewed before publication',
    ctaLabel: 'Choose Enhanced',
    ctaHref: '/submit?plan=enhanced',
    category: 'listing',
    active: true,
    disclosure: 'Paid requests still require AIBeat review before publication.',
    primaryAudience: 'Accepted tools that need richer listing context.',
  },
  {
    id: 'spotlight',
    name: 'AIBeat Spotlight',
    shortDescription: 'Give your product higher visibility across AIBeat through a featured listing and selected promotional placements.',
    priceLabel: '$79 one time',
    priceAmount: 79,
    billingType: 'one_time',
    recommended: true,
    badge: 'Most popular',
    features: [
      'Everything in Enhanced Listing',
      'Spotlight badge',
      'Featured placement on a relevant category page',
      'Homepage Spotlight consideration or scheduled placement',
      'Enhanced visual card',
      'Dedicated Why it matters editorial summary',
      'Priority listing review',
      'Newsletter consideration',
      'Social mention when included in selected campaign',
      'Placement period clearly shown',
    ],
    exclusions: [
      'No guaranteed newsletter unless separately booked',
      'No guaranteed clicks, leads, sales, or ranking lift',
      'No undisclosed sponsored status',
    ],
    placementDuration: '7 or 14 days when scheduled',
    ctaLabel: 'Get Spotlight',
    ctaHref: '/spotlight?plan=spotlight',
    category: 'spotlight',
    active: true,
    disclosure: 'Spotlight is promotional and must be disclosed where placement affects reader interpretation.',
    primaryAudience: 'Relevant products seeking a defined visibility window.',
  },
  {
    id: 'launch-feature',
    name: 'Launch Feature',
    shortDescription: 'Launch a new AI product or major update through a dedicated AIBeat launch package.',
    priceLabel: '$149 one time',
    priceAmount: 149,
    billingType: 'one_time',
    features: [
      'Dedicated launch page',
      'Launch date and product story',
      'Logo, screenshots, demo video and founder quote',
      'Homepage launch placement for a defined period',
      'Launch badge',
      'Newsletter launch mention',
      'One social promotion',
      'Inclusion in New Launches',
      'Related category placement',
      'Product listing',
      'Optional founder Q&A',
    ],
    turnaround: '3-5 business days after all assets are received',
    placementDuration: 'Defined before publication',
    ctaLabel: 'Launch on AIBeat',
    ctaHref: '/launch?plan=launch-feature',
    category: 'launch',
    active: true,
    disclosure: 'Launch packages are reviewed for relevance and clearly labeled when promotional.',
    primaryAudience: 'New AI products, public releases, and major updates.',
  },
  {
    id: 'newsletter-feature',
    name: 'Newsletter Feature',
    shortDescription: 'Introduce your product to AIBeat newsletter readers through a clearly labeled featured placement.',
    priceLabel: '$99 per placement',
    priceAmount: 99,
    billingType: 'one_time',
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
    ctaLabel: 'Book Newsletter Feature',
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
      'Enhanced listing',
      'Spotlight placement',
      'Newsletter feature',
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
  { planId: 'enhanced', label: 'Enhanced' },
  { planId: 'spotlight', label: 'Spotlight' },
  { planId: 'launch-feature', label: 'Launch Feature' },
  { planId: 'growth-campaign', label: 'Growth Campaign' },
]

export const FEATURE_MATRIX_ROWS: FeatureMatrixRow[] = [
  { label: 'Standard directory listing', values: { free: 'Included', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Priority review', values: { free: 'Not included', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Screenshots', values: { free: 'Considered', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Video/demo', values: { free: 'Considered', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Additional categories', values: { free: 'Not included', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Enhanced tool page', values: { free: 'Not included', enhanced: 'Included', spotlight: 'Included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Category feature', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Included', 'launch-feature': 'Considered', 'growth-campaign': 'Included' } },
  { label: 'Homepage feature', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Considered', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Launch page', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Optional add-on', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Newsletter mention', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Considered', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Guaranteed newsletter placement', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Not included', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Sponsored article', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Optional add-on', 'launch-feature': 'Optional add-on', 'growth-campaign': 'Included' } },
  { label: 'Founder interview', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Optional add-on', 'launch-feature': 'Optional add-on', 'growth-campaign': 'Included' } },
  { label: 'Social promotion', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Considered', 'launch-feature': 'Included', 'growth-campaign': 'Included' } },
  { label: 'Campaign reporting', values: { free: 'Not included', enhanced: 'Not included', spotlight: 'Considered', 'launch-feature': 'Not included', 'growth-campaign': 'Included' } },
  { label: 'Placement duration', values: { free: 'Not included', enhanced: 'Permanent while active', spotlight: '7 or 14 days', 'launch-feature': 'Defined period', 'growth-campaign': 'Custom' } },
  { label: 'Revisions', values: { free: 'Not included', enhanced: 'One listing update', spotlight: 'One listing update', 'launch-feature': 'One revision', 'growth-campaign': 'Custom' } },
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
    body: 'If a paid package fits, AIBeat confirms deliverables and payment manually before scheduling any placement.',
  },
  {
    title: 'Publish and report',
    body: 'The listing, article, newsletter, launch, or campaign goes live only after review, assets, disclosure, and timing are confirmed.',
  },
]

export const CONTENT_LABELS = [
  { label: 'Standard Listing', purchasable: false, rule: 'A regular accepted directory listing.' },
  { label: 'Enhanced Listing', purchasable: true, rule: 'A richer listing format. Does not imply editorial endorsement.' },
  { label: 'Spotlight', purchasable: true, rule: 'Promotional visibility. Must not imply independent editorial endorsement.' },
  { label: 'New Launch', purchasable: true, rule: 'Depends on verified launch timing or accepted launch package.' },
  { label: 'Sponsored', purchasable: true, rule: 'Required for paid editorial or paid promotional placements.' },
  { label: 'Partner', purchasable: false, rule: 'Indicates a real partnership or exchange approved by AIBeat.' },
  { label: 'Editor’s Pick', purchasable: false, rule: 'Editorial-only label. It must not be purchasable.' },
]

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
