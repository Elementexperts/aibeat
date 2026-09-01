export const AIBEAT_ALLOWED_ROUTES = new Set(['/business/dashboard', '/business/ask', '/business/workflows', '/business/agents', '/business/context', '/business/ai-stack', '/business/recommendations', '/business/approvals', '/business/integrations', '/business/reports', '/business/audit', '/business/settings'])
export const AIBEAT_ALLOWED_WORKFLOW_IDS = new Set(['tpl-lead-research', 'tpl-competitor-monitor', 'tpl-marketing-content', 'tpl-weekly-report', 'tpl-executive-brief'])

export const AIBEAT_PRODUCT_GUIDE = `
Dashboard: overview of important activity, KPIs, runs, findings, and pending decisions.
Ask AIBeat: advisory operating guide; it recommends but never executes or approves actions.
Workflows: repeatable governed AI processes. Lead Research qualifies prospects; Competitor Monitoring watches markets; Marketing Content creates reviewable drafts; Weekly Reporting summarizes KPIs; Executive Daily Brief prioritizes management signals.
Agents: the five specialized capabilities behind workflows.
Business Memory: shared organization context such as ICP, products, services, policies, and documents.
AI Stack: model runtime and AI tool usage visibility.
Recommendations: optimization opportunities. Approvals: human review before sensitive or external actions.
Integrations: connected external systems. Reports: business summaries. Audit: workflow/action history. Settings: organization and member configuration.
`
