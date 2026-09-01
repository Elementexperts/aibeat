import { AGENT_REGISTRY } from './agents'
import { getAIRecommendations, getAIToolSubscriptions, getOptimizationOpportunities, getROIMetrics, summarizeSpend } from './ai-spend'
import { getBusinessContextPayload } from './context'
import { demoAgentSummaries, demoBusinessMemoryHealth, demoExecutiveBriefItems, demoRecentActivity } from './demo-data'
import { INDUSTRY_PROFILE_LABELS, getIndustryProfile } from './industry-profiles'
import { businessStore } from './store'
import { getApprovals, getAuditEvents, getOrganizationWorkflows, getWorkflowRuns, getWorkflowTemplates } from './workflows'
import type { Role } from './types'

export const DEFAULT_DEMO_ORGANIZATION_ID = 'org-growth-labs'
export const DEFAULT_DEMO_USER_ID = 'user-sarah'

export function getBusinessWorkspaceData(organizationId = DEFAULT_DEMO_ORGANIZATION_ID, userId = DEFAULT_DEMO_USER_ID) {
  const actor = { organizationId, userId }
  const organization = businessStore.getOrganization(actor)

  const workflows = getOrganizationWorkflows(organizationId, userId)
  const approvals = getApprovals(organizationId, userId)
  const runs = getWorkflowRuns(organizationId, userId)
  const context = getBusinessContextPayload(organizationId, userId)
  const documents = businessStore.getDocuments(actor)
  const documentChunks = businessStore.getDocumentChunks(actor)
  const tools = getAIToolSubscriptions(organizationId, userId)
  const recommendations = getAIRecommendations(organizationId, userId)
  const auditEvents = getAuditEvents(organizationId, userId)
  const roi = getROIMetrics(organizationId, userId)
  const spend = summarizeSpend(organizationId, userId)
  const findings = businessStore.getFindings(actor)
  const members = businessStore.getOrganizationMembers(actor)
  const notifications = businessStore.getNotifications(actor)
  const evaluations = businessStore.getAgentEvaluations(actor)
  const optimizationOpportunities = getOptimizationOpportunities(organizationId, userId)
  const executiveBriefItems = demoExecutiveBriefItems.filter((item) => item.organizationId === organizationId)
  const agentSummaries = demoAgentSummaries.filter((summary) => summary.agentType in AGENT_REGISTRY)
  const recentActivity = demoRecentActivity.filter((activity) => activity.organizationId === organizationId)
  const businessMemoryHealth = demoBusinessMemoryHealth.organizationId === organizationId ? demoBusinessMemoryHealth : undefined
  const connectors = businessStore.getIntegrationSummaries(actor)

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
    documents,
    documentChunks,
    tools,
    recommendations,
    auditEvents,
    roi,
    spend,
    findings,
    members,
    notifications,
    evaluations,
    executiveBriefItems,
    optimizationOpportunities,
    businessMemoryHealth: businessMemoryHealth ? {
      ...businessMemoryHealth,
      documentCount: Math.max(businessMemoryHealth.documentCount, documents.length),
      indexedDocumentCount: documents.filter((document) => document.extractionStatus === 'INDEXED').length,
      chunkCount: documentChunks.length,
    } : undefined,
    agentSummaries,
    recentActivity,
    connectors,
    aiRuntime: { mode: 'mock' as 'mock' | 'live', provider: 'mock' as 'mock' | 'gemini', model: 'deterministic', configured: true },
    viewerRole: 'OWNER' as Role,
  }
}

export type BusinessWorkspaceData = ReturnType<typeof getBusinessWorkspaceData>
