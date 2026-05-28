// ============================================================
// AIBeat.dev — Central Data Store
// Replace with a CMS (Sanity, Contentful) or DB later
// ============================================================

export type Category = 'breaking' | 'news' | 'tools' | 'compare' | 'deep-dive'

export interface Article {
  slug: string
  title: string
  deck: string
  category: Category
  author: string
  publishedAt: string
  readTime: number
  featured: boolean
  content?: string
  relatedTools?: string[]
}

export interface Tool {
  slug: string
  name: string
  tagline: string
  description: string
  category: string
  logo: string         // bg color hex
  logoInitials: string
  rating: number
  pricing: string
  pricingType: 'free' | 'freemium' | 'paid'
  affiliateUrl: string
  websiteUrl: string
  featured: boolean
  pros: string[]
  cons: string[]
  alternatives: string[]
}

// ============================================================
// ARTICLES
// ============================================================
export const ARTICLES: Article[] = [
  {
    slug: 'openai-new-model-benchmark',
    title: "OpenAI's New Model Destroys Every Benchmark — What It Means for Developers and Businesses",
    deck: "The latest release marks a fundamental shift in what AI can do for small businesses and solo founders. Here's the complete breakdown of capabilities, pricing, and who should care.",
    category: 'breaking',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-28',
    readTime: 8,
    featured: true,
    relatedTools: ['chatgpt', 'cursor', 'jasper'],
  },
  {
    slug: 'ai-tools-freelancers-2026',
    title: "The 9 AI Tools Every Freelancer Is Actually Using in 2026 (We Tested All of Them)",
    deck: "We spent 30 days testing every major AI tool built for freelancers. Here's what actually saves time versus what's just hype.",
    category: 'tools',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-28',
    readTime: 12,
    featured: true,
    relatedTools: ['jasper', 'notion', 'freshbooks', 'cursor'],
  },
  {
    slug: 'jasper-vs-copy-ai-2026',
    title: "Jasper vs Copy.ai in 2026: We Used Both for 30 Days — Here's the Honest Verdict",
    deck: "Two of the biggest names in AI writing go head to head. We ran identical tasks through both platforms and scored every output.",
    category: 'compare',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-27',
    readTime: 9,
    featured: true,
    relatedTools: ['jasper', 'copy-ai'],
  },
  {
    slug: 'hubspot-free-plan-update',
    title: "HubSpot Just Made Its Free Plan Even Better — Is It Still Worth Paying for Salesforce?",
    deck: "HubSpot's latest update adds AI features to the free tier. We break down exactly what changed and whether Salesforce can justify its price tag.",
    category: 'news',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-27',
    readTime: 7,
    featured: false,
    relatedTools: ['hubspot', 'salesforce'],
  },
  {
    slug: 'cursor-vs-github-copilot',
    title: "Cursor vs GitHub Copilot: Which AI Coding Tool Is Actually Saving Developers More Time?",
    deck: "We tracked productivity metrics for 4 weeks using both tools on real projects. The results surprised us.",
    category: 'compare',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-26',
    readTime: 10,
    featured: false,
    relatedTools: ['cursor', 'github-copilot'],
  },
  {
    slug: 'free-invoicing-tools-beat-freshbooks',
    title: "Stop Overpaying for Invoicing — 3 Free Tools That Beat FreshBooks",
    deck: "Wave, Zoho Invoice, and one surprise challenger that most freelancers have never heard of.",
    category: 'tools',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-26',
    readTime: 6,
    featured: false,
    relatedTools: ['freshbooks', 'wave', 'zoho-invoice'],
  },
  {
    slug: 'zero-dollar-ai-stack-2026',
    title: "The $0 AI Stack: Run Your Entire Business With Free AI Tools in 2026",
    deck: "A complete guide to replacing $500/month in software subscriptions with free AI alternatives that actually work.",
    category: 'deep-dive',
    author: 'AIBeat Staff',
    publishedAt: '2026-05-25',
    readTime: 15,
    featured: false,
    relatedTools: ['notion', 'hubspot', 'wave', 'cursor'],
  },
]

// ============================================================
// TOOLS
// ============================================================
export const TOOLS: Tool[] = [
  {
    slug: 'jasper',
    name: 'Jasper AI',
    tagline: 'Best AI writer for marketing teams',
    description: 'Jasper generates on-brand content at scale with brand voice training. Best for marketing teams that need high-volume, consistent output.',
    category: 'AI Writing',
    logo: '#6b4fbb',
    logoInitials: 'Ja',
    rating: 4.8,
    pricing: 'From $39/mo',
    pricingType: 'paid',
    affiliateUrl: 'https://jasper.ai?via=aibeat',
    websiteUrl: 'https://jasper.ai',
    featured: true,
    pros: ['Brand voice training', 'Team collaboration', '50+ templates', 'SEO mode'],
    cons: ['Expensive for solo users', 'Output needs editing', 'No free plan'],
    alternatives: ['copy-ai', 'writesonic', 'rytr'],
  },
  {
    slug: 'monday',
    name: 'Monday.com',
    tagline: 'Visual project management for growing teams',
    description: 'Monday.com offers visual project management with highly customizable workflows and excellent automation capabilities.',
    category: 'Project Management',
    logo: '#f7335c',
    logoInitials: 'Mo',
    rating: 4.7,
    pricing: 'Free plan available',
    pricingType: 'freemium',
    affiliateUrl: 'https://monday.com?via=aibeat',
    websiteUrl: 'https://monday.com',
    featured: true,
    pros: ['Visual boards', 'Strong automation', 'Many integrations', 'Free plan'],
    cons: ['Gets expensive at scale', 'Learning curve', 'Limited Gantt on free'],
    alternatives: ['asana', 'notion', 'clickup'],
  },
  {
    slug: 'freshbooks',
    name: 'FreshBooks',
    tagline: 'Best invoicing + accounting for freelancers',
    description: 'FreshBooks combines invoicing, expense tracking, time tracking, and basic accounting in one clean interface built for freelancers.',
    category: 'Invoicing',
    logo: '#1db954',
    logoInitials: 'Fr',
    rating: 4.6,
    pricing: 'From $17/mo',
    pricingType: 'paid',
    affiliateUrl: 'https://freshbooks.com?via=aibeat',
    websiteUrl: 'https://freshbooks.com',
    featured: true,
    pros: ['Clean UI', 'Auto payment reminders', 'Time tracking', 'Client portal'],
    cons: ['No free plan', 'Limited users on base plan', 'Basic reporting'],
    alternatives: ['wave', 'quickbooks', 'zoho-invoice'],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot CRM',
    tagline: 'Most generous free CRM on the market',
    description: 'HubSpot CRM offers an incredibly generous free tier with contact management, pipeline tracking, email tools, and now AI features.',
    category: 'CRM',
    logo: '#ff5c35',
    logoInitials: 'Hu',
    rating: 4.8,
    pricing: 'Free forever',
    pricingType: 'freemium',
    affiliateUrl: 'https://hubspot.com?via=aibeat',
    websiteUrl: 'https://hubspot.com',
    featured: true,
    pros: ['Generous free tier', 'AI features', 'Easy to use', 'Scales to enterprise'],
    cons: ['Paid plans expensive', 'Email limits on free', 'Complex feature set'],
    alternatives: ['salesforce', 'pipedrive', 'zoho-crm'],
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    tagline: 'AI-first code editor built for speed',
    description: 'Cursor is a VS Code fork with deep AI integration. It writes, explains, and refactors code in context — the top choice for AI-assisted development.',
    category: 'AI Coding',
    logo: '#0f0f0f',
    logoInitials: 'Cu',
    rating: 4.9,
    pricing: 'Free plan available',
    pricingType: 'freemium',
    affiliateUrl: 'https://cursor.sh?via=aibeat',
    websiteUrl: 'https://cursor.sh',
    featured: true,
    pros: ['VS Code compatible', 'Context-aware AI', 'Codebase chat', 'Fast'],
    cons: ['Privacy concerns for proprietary code', 'Paid plan needed for heavy use'],
    alternatives: ['github-copilot', 'tabnine', 'codeium'],
  },
  {
    slug: 'semrush',
    name: 'Semrush',
    tagline: 'Most complete SEO suite available',
    description: 'Semrush provides competitive research, keyword tracking, site audit, backlink analysis, and content optimization in one platform.',
    category: 'SEO',
    logo: '#ff6b35',
    logoInitials: 'Se',
    rating: 4.5,
    pricing: 'From $99/mo',
    pricingType: 'paid',
    affiliateUrl: 'https://semrush.com?via=aibeat',
    websiteUrl: 'https://semrush.com',
    featured: false,
    pros: ['Comprehensive data', 'Competitor analysis', 'Content tools', 'AI Toolkit'],
    cons: ['Expensive', 'Overwhelming for beginners', 'Data accuracy varies'],
    alternatives: ['ahrefs', 'se-ranking', 'ubersuggest'],
  },
]

// ============================================================
// TRENDING SEARCHES
// ============================================================
export const TRENDING = [
  { query: 'Best AI writing tools', change: '+1,900%', href: '/best/ai-writing-tools' },
  { query: 'AI news today', change: 'BREAKOUT', href: '/news' },
  { query: 'Best free CRM tools', change: '+110%', href: '/best/free-crm-tools' },
  { query: 'Cursor AI review', change: '+340%', href: '/tools/cursor' },
  { query: 'Free invoicing tools', change: '+89%', href: '/best/invoicing-tools' },
]

// ============================================================
// HELPERS
// ============================================================
export function getFeaturedArticles() {
  return ARTICLES.filter((a) => a.featured)
}

export function getArticleBySlug(slug: string) {
  return ARTICLES.find((a) => a.slug === slug)
}

export function getFeaturedTools() {
  return TOOLS.filter((t) => t.featured)
}

export function getToolBySlug(slug: string) {
  return TOOLS.find((t) => t.slug === slug)
}

export function getToolsByCategory(category: string) {
  return TOOLS.filter((t) => t.category.toLowerCase() === category.toLowerCase())
}

export const CATEGORY_COLORS: Record<Category, string> = {
  breaking: 'text-beat-red border-beat-red',
  news: 'text-beat-blue border-beat-blue',
  tools: 'text-beat-green border-beat-green',
  compare: 'text-ink-2 border-ink-2',
  'deep-dive': 'text-ink-3 border-ink-3',
}
