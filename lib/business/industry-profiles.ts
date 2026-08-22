import type { AgentType, IndustryProfile } from './types'

export const INDUSTRY_PROFILE_LABELS: Record<IndustryProfile, string> = {
  DIGITAL_MARKETING_AGENCY: 'Digital Marketing Agency',
  B2B_LEAD_GEN_AGENCY: 'B2B Lead Generation Agency',
  SEO_CONTENT_AGENCY: 'SEO / Content Agency',
  B2B_SAAS: 'B2B SaaS',
  CONSULTING: 'Consulting',
}

export interface IndustryProfileConfig {
  profile: IndustryProfile
  terminology: string[]
  defaultKpis: string[]
  contextFields: string[]
  workflowDefaults: Partial<Record<AgentType, string>>
  agentGuidance: Record<AgentType, string>
}

export const INDUSTRY_PROFILES: Record<IndustryProfile, IndustryProfileConfig> = {
  DIGITAL_MARKETING_AGENCY: {
    profile: 'DIGITAL_MARKETING_AGENCY',
    terminology: ['clients', 'retainers', 'campaigns', 'service gaps', 'client KPIs'],
    defaultKpis: ['Retainer revenue', 'Qualified leads', 'Campaign ROAS', 'Content velocity'],
    contextFields: ['Services', 'Client accounts', 'Campaign goals', 'Brand voice', 'Client competitors'],
    workflowDefaults: {
      LEAD_RESEARCH: 'Score prospects for marketing maturity, SEO gaps, paid media signals, and social presence.',
      COMPETITOR_MONITOR: 'Monitor client competitors, agency category shifts, and service positioning changes.',
    },
    agentGuidance: {
      LEAD_RESEARCH: 'Prioritize evidence about marketing maturity, SEO visibility, paid media, social activity, and likely service gaps.',
      COMPETITOR_MONITOR: 'Translate market changes into client retention, positioning, and campaign opportunities.',
      MARKETING_CONTENT: 'Use client/service context, campaign goals, prior content, and competitor findings before drafting.',
      WEEKLY_REPORT: 'Explain KPI movement across campaigns, pipeline, client delivery, AI spend, and workflow throughput.',
      EXECUTIVE_BRIEF: 'Keep agency leadership focused on client risk, sales opportunities, delivery bottlenecks, approvals, and spend decisions.',
    },
  },
  B2B_LEAD_GEN_AGENCY: {
    profile: 'B2B_LEAD_GEN_AGENCY',
    terminology: ['prospects', 'ICP', 'lists', 'outreach angles', 'pipeline contribution'],
    defaultKpis: ['Qualified leads', 'Reply rate', 'Booked meetings', 'Cost per qualified lead'],
    contextFields: ['ICP definitions', 'Lead sources', 'CRM data', 'Outreach positioning', 'Duplicate rules'],
    workflowDefaults: {
      LEAD_RESEARCH: 'Emphasize ICP match, duplicate detection, buying signals, and outreach angle preparation.',
    },
    agentGuidance: {
      LEAD_RESEARCH: 'Compare each prospect against ICP, CRM history, buying signals, risks, and duplicate records.',
      COMPETITOR_MONITOR: 'Watch competitors, lead sources, buyer pain signals, and category movements that affect list quality.',
      MARKETING_CONTENT: 'Create evidence-backed briefs and nurture assets for pipeline acceleration.',
      WEEKLY_REPORT: 'Summarize list quality, qualified lead volume, conversion changes, workflow completion, and AI spend.',
      EXECUTIVE_BRIEF: 'Surface the few lead opportunities, risks, pending approvals, and workflow failures that matter today.',
    },
  },
  SEO_CONTENT_AGENCY: {
    profile: 'SEO_CONTENT_AGENCY',
    terminology: ['topics', 'rankings', 'briefs', 'content refreshes', 'search intent'],
    defaultKpis: ['Organic traffic', 'Published briefs', 'Content approvals', 'Ranking wins'],
    contextFields: ['Brand voice', 'Topic clusters', 'Competitors', 'Search Console data', 'Content inventory'],
    workflowDefaults: {
      MARKETING_CONTENT: 'Start with business context, competitor findings, market research, previous content, and campaign goals.',
    },
    agentGuidance: {
      LEAD_RESEARCH: 'Look for content maturity, organic search gaps, technical SEO signals, and clear service opportunities.',
      COMPETITOR_MONITOR: 'Identify competitor content launches, SERP shifts, and topic opportunities without repeating old alerts.',
      MARKETING_CONTENT: 'Produce briefs and drafts with source provenance, brand voice, search intent, and approval boundaries.',
      WEEKLY_REPORT: 'Connect rankings, content production, approvals, traffic changes, and workflow impact.',
      EXECUTIVE_BRIEF: 'Highlight urgent content opportunities, approvals, ranking risks, and high-impact workflow changes.',
    },
  },
  B2B_SAAS: {
    profile: 'B2B_SAAS',
    terminology: ['accounts', 'ARR', 'MRR', 'trials', 'pipeline', 'churn'],
    defaultKpis: ['ARR pipeline', 'Trials', 'Activation rate', 'Churn risk', 'Expansion opportunities'],
    contextFields: ['Products', 'Use cases', 'Accounts', 'Product usage', 'Pipeline', 'Competitors'],
    workflowDefaults: {
      LEAD_RESEARCH: 'Score company size, industry, use case fit, buying signal, and estimated potential value.',
      WEEKLY_REPORT: 'Compare funnel, account, product usage, workflow performance, and AI spend signals.',
    },
    agentGuidance: {
      LEAD_RESEARCH: 'Evaluate company fit, likely use case, buying signals, technical context, and potential account value.',
      COMPETITOR_MONITOR: 'Relate competitor changes to positioning, feature gaps, pricing risk, and go-to-market response.',
      MARKETING_CONTENT: 'Build briefs and drafts around use cases, product context, customer segments, and market evidence.',
      WEEKLY_REPORT: 'Focus on funnel movement, expansion/churn signals, product usage, workflow status, and spend efficiency.',
      EXECUTIVE_BRIEF: 'Condense account opportunities, product/market risks, approvals, deadlines, and workflow issues.',
    },
  },
  CONSULTING: {
    profile: 'CONSULTING',
    terminology: ['clients', 'engagements', 'deliverables', 'research', 'strategic initiatives'],
    defaultKpis: ['Utilization', 'Pipeline value', 'Engagement health', 'Deliverable approvals'],
    contextFields: ['Services', 'Client accounts', 'Projects', 'Deliverables', 'Research library', 'Opportunities'],
    workflowDefaults: {
      LEAD_RESEARCH: 'Look for strategic initiatives, operational changes, leadership changes, and advisory openings.',
    },
    agentGuidance: {
      LEAD_RESEARCH: 'Identify leadership changes, transformation programs, operating challenges, and advisory opportunity fit.',
      COMPETITOR_MONITOR: 'Frame market changes as client risks, engagement opportunities, or point-of-view inputs.',
      MARKETING_CONTENT: 'Use research, prior deliverables, service context, and executive tone for briefs and drafts.',
      WEEKLY_REPORT: 'Explain client delivery, pipeline, project risks, approvals, workflow performance, and AI spend.',
      EXECUTIVE_BRIEF: 'Prioritize high-stakes client decisions, deadlines, risks, approvals, and market opportunities.',
    },
  },
}

export function getIndustryProfile(profile: IndustryProfile): IndustryProfileConfig {
  return INDUSTRY_PROFILES[profile]
}

export function getAgentIndustryInstructions(profile: IndustryProfile, agentType: AgentType): string {
  return INDUSTRY_PROFILES[profile].agentGuidance[agentType]
}
