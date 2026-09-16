export const QUALITY = {
  publishThreshold: 75, minFactConfidence: 85, minStoryConfidence: 85,
  maxCandidates: 6, maxSources: 4, maxSourceAttempts: 6, maxFetches: 32,
  maxModelCalls: 9, maxArticles: 3, maxFacts: 12, maxSourceChars: 6500,
  maxSourceBytes: 1_000_000, timeoutMs: 12000, maxOutputTokens: 3000,
  freshnessHours: 48, duplicateDays: 14, minSourceChars: 300,
} as const

export type SourceRule = { host: string; name: string; tier: 1 | 2; group: string; path?: RegExp }
// Editorial configuration, not a model-provided reputation score. Exact hosts only.
// Add official paths and publishers here after checking ownership and editorial standards.
export const SOURCE_RULES: SourceRule[] = [
  ...[
    ['openai.com', 'OpenAI', 'openai'], ['anthropic.com', 'Anthropic', 'anthropic'],
    ['deepmind.google', 'Google DeepMind', 'google'], ['blog.google', 'Google', 'google'],
    ['research.google', 'Google Research', 'google'], ['blogs.microsoft.com', 'Microsoft', 'microsoft'],
    ['learn.microsoft.com', 'Microsoft documentation', 'microsoft'], ['microsoft.com', 'Microsoft', 'microsoft'],
    ['aws.amazon.com', 'Amazon Web Services', 'amazon'], ['aboutamazon.com', 'Amazon', 'amazon'],
    ['ai.meta.com', 'Meta AI', 'meta'], ['about.fb.com', 'Meta', 'meta'],
    ['blogs.nvidia.com', 'NVIDIA', 'nvidia'], ['nvidianews.nvidia.com', 'NVIDIA', 'nvidia'],
    ['mistral.ai', 'Mistral AI', 'mistral'], ['apple.com', 'Apple', 'apple'],
    ['developer.apple.com', 'Apple developer documentation', 'apple'],
    ['arxiv.org', 'arXiv research preprint', 'arxiv'], ['sec.gov', 'US Securities and Exchange Commission', 'sec'],
    ['ftc.gov', 'US Federal Trade Commission', 'ftc'], ['justice.gov', 'US Department of Justice', 'doj'],
    ['ec.europa.eu', 'European Commission', 'ec'], ['gov.uk', 'UK Government', 'ukgov'],
  ].map(([host, name, group]) => ({ host, name, group, tier: 1 as const })),
  { host: 'github.com', name: 'Official project repository', group: 'openai', tier: 1, path: /^\/openai\/[^/]+\/(?:releases|commit)\// },
  { host: 'github.com', name: 'Official project repository', group: 'anthropic', tier: 1, path: /^\/anthropics\/[^/]+\/(?:releases|commit)\// },
  ...[
    ['reuters.com', 'Reuters', 'reuters'], ['apnews.com', 'Associated Press', 'ap'],
    ['bloomberg.com', 'Bloomberg', 'bloomberg'], ['ft.com', 'Financial Times', 'nikkei'],
    ['wsj.com', 'The Wall Street Journal', 'newscorp'], ['barrons.com', "Barron's", 'newscorp'],
    ['bbc.com', 'BBC', 'bbc'], ['bbc.co.uk', 'BBC', 'bbc'], ['theguardian.com', 'The Guardian', 'guardian'],
    ['nytimes.com', 'The New York Times', 'nyt'], ['washingtonpost.com', 'The Washington Post', 'wapo'],
    ['techcrunch.com', 'TechCrunch', 'regent'], ['theverge.com', 'The Verge', 'vox'],
    ['venturebeat.com', 'VentureBeat', 'venturebeat'], ['wired.com', 'Wired', 'condenast'],
    ['arstechnica.com', 'Ars Technica', 'condenast'], ['technologyreview.com', 'MIT Technology Review', 'mit'],
    ['cnbc.com', 'CNBC', 'nbcu'], ['zdnet.com', 'ZDNET', 'ziffdavis'],
  ].map(([host, name, group]) => ({ host, name, group, tier: 2 as const })),
]

export function classifySource(value: string) {
  const url = new URL(value)
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const userContent = /\/(?:answers|community|forums?|users?|discussions?|issues)(?:\/|$)/i.test(url.pathname)
  const rule = !userContent && SOURCE_RULES.find(rule => rule.host === host && (!rule.path || rule.path.test(url.pathname)))
  return rule || { host, name: host, group: host, tier: 3 as const }
}

export const HIGH_RISK = /\b(lawsuit|sues?|suing|court|regulat\w*|criminal|alleg\w*|government|contract|acqui\w*|merger|funding|raised?|valuation|layoffs?|laid off|depart\w*|resign\w*|fired|breach\w*|hack\w*|vulnerab\w*|earnings|revenue|profit|ban(?:s|ned)?|sanction\w*|policy|ceo|cfo|executive|appointed|headcount|\$|billion|million)\b/i

export const NEUTRAL_IMAGE_PROMPT = 'Neutral abstract editorial illustration of computing and connected geometric shapes, restrained colors, subtle AIBeat branding. No people, executive portraits, photographs of events, screenshots, interfaces, quotations, numbers, company logos, contracts, courtroom scenes, or depictions of completed deals.'
