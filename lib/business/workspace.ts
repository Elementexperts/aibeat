import { AGENT_REGISTRY } from './agents'
import { getAIRecommendations, getAIToolSubscriptions, getOptimizationOpportunities, getROIMetrics, summarizeSpend } from './ai-spend'
import { getBusinessContextPayload } from './context'
import { demoAgentSummaries, demoBusinessMemoryHealth, demoExecutiveBriefItems, demoRecentActivity } from './demo-data'
import { INDUSTRY_PROFILE_LABELS, getIndustryProfile } from './industry-profiles'
import { connectorRegistry } from './connectors'
import { businessStore } from './store'
import { getApprovals, getAuditEvents, getOrganizationWorkflows, getWorkflowRuns, getWorkflowTemplates } from './workflows'

export const DEFAULT_DEMO_ORGANIZATION_ID = 'org-growth-labs'
export const DEFAULT_DEMO_USER_ID = 'user-sarah'

export function getBusinessWorkspaceData(organizationId = DEFAULT_DEMO_ORGANIZATION_ID, userId = DEFAULT_DEMO_USER_ID) {
  const actor = { organizationId, userId }
  const organization = businessStore.getOrganization(actor)

  const workflows = getOrganizationWorkflows(organizationId, userId)
  const approvals = getApprovals(organizationId, userId)
  const runs = getWorkflowRuns(organizationId, userId)
  const context = getBusinessContextPayload(organizationId, userId)
  const tools = getAIToolSubscriptions(organizationId, userId)
  const recommendations = getAIRecommendations(organizationId, userId)
  const auditEvents = getAuditEvents(organizationId, userId)
  const roi = getROIMetrics(organizationId, userId)
  const spend = summarizeSpend(organizationId, userId)
  const findings = businessStore.getFindings(actor)
  const optimizationOpportunities = getOptimizationOpportunities(organizationId, userId)
  const executiveBriefItems = demoExecutiveBriefItems.filter((item) => item.organizationId === organizationId)
  const agentSummaries = demoAgentSummaries.filter((summary) => summary.agentType in AGENT_REGISTRY)
  const recentActivity = demoRecentActivity.filter((activity) => activity.organizationId === organizationId)
  const businessMemoryHealth = demoBusinessMemoryHealth.organizationId === organizationId ? demoBusinessMemoryHealth : undefined

  return {
    organization,
    industryProfile: getIndustryProfile(organization.primaryProfile),
    industryLabel: INDUSTRY_PROFILE_LABELS[organization.primaryProfile],
    agents: Object.values(AGENT_REGISTRY),
    workflows,
    templates: getWorkflowTemplates(),
    approvals,
    runs,
    context,
    tools,
    recommendations,
    auditEvents,
    roi,
    spend,
    findings,
    executiveBriefItems,
    optimizationOpportunities,
    businessMemoryHealth,
    agentSummaries,
    recentActivity,
    connectors: Object.values(connectorRegistry).map((connector) => ({
      id: connector.id,
      name: connector.name,
      capabilities: connector.capabilities,
      status: connector.id === 'crm' ? 'Demo connection - OAuth not authorized' : 'Demo connection',
    })),
  }
}

export type BusinessWorkspaceData = ReturnType<typeof getBusinessWorkspaceData>
