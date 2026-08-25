import 'server-only'

import { AGENT_REGISTRY } from './agents'
import { connectorRegistry } from './connectors'
import { demoAgentSummaries, demoBusinessMemoryHealth, demoExecutiveBriefItems } from './demo-data'
import { INDUSTRY_PROFILE_LABELS, getIndustryProfile } from './industry-profiles'
import { getAuthenticatedBusinessContext } from './server-auth'
import { SupabaseBusinessDataStore } from './supabase-store'
import { getWorkflowTemplates } from './workflows'
import type { BusinessWorkspaceData } from './workspace'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedBusinessWorkspaceData(): Promise<BusinessWorkspaceData> {
  const auth = await getAuthenticatedBusinessContext()
  const actor = { organizationId: auth.organizationId, userId: auth.userId }
  const store = new SupabaseBusinessDataStore(createClient())

  const [
    organization,
    workflows,
    approvals,
    runs,
    context,
    tools,
    recommendations,
    auditEvents,
    roi,
    findings,
    documents,
    documentChunks,
  ] = await Promise.all([
    store.getOrganization(actor),
    store.getWorkflows(actor),
    store.getApprovals(actor),
    store.getRuns(actor),
    store.getBusinessContextPayload(actor),
    store.getAITools(actor),
    store.getRecommendations(actor),
    store.getAuditEvents(actor),
    store.getROIMetrics(actor),
    store.getFindings(actor),
    store.getDocuments(actor),
    store.getDocumentChunks(actor),
  ])

  const spend = {
    monthlySpend: tools.reduce((sum, tool) => sum + tool.monthlyCost, 0),
    lowUseSeats: tools.reduce((sum, tool) => sum + Math.max(0, tool.seatsPurchased - tool.activeSeats), 0),
    unapprovedTools: tools.filter((tool) => tool.status === 'UNAPPROVED').length,
    potentialSavings: recommendations.reduce((sum, recommendation) => sum + (recommendation.estimatedMonthlySavings ?? 0), 0),
    toolCount: tools.length,
  }
  const activeAgents = new Set(workflows.filter((workflow) => workflow.status === 'ACTIVE').map((workflow) => workflow.agentType))
  const nextRoi = {
    ...roi,
    aiSpendMonthly: roi.aiSpendMonthly || spend.monthlySpend,
    potentialSavingsMonthly: roi.potentialSavingsMonthly || spend.potentialSavings,
    activeWorkflows: workflows.filter((workflow) => workflow.status === 'ACTIVE').length,
    activeAgents: activeAgents.size,
  }

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
    roi: nextRoi,
    spend,
    findings,
    executiveBriefItems: demoExecutiveBriefItems.filter((item) => item.organizationId === organization.id),
    optimizationOpportunities: recommendations.map((recommendation) => ({
      id: `opp-${recommendation.id}`,
      organizationId: recommendation.organizationId,
      type: recommendation.type === 'AUTOMATE_WITH_AIBEAT' ? 'AUTOMATION' : recommendation.type === 'CONSOLIDATE' ? 'TOOL_OVERLAP' : 'GOVERNANCE',
      title: recommendation.title,
      problem: recommendation.rationale,
      currentStateLabel: 'Estimated savings',
      currentStateValue: recommendation.estimatedMonthlySavings ? `$${Math.round(recommendation.estimatedMonthlySavings)}/mo` : 'Needs review',
      recommendedCapability: recommendation.relatedAgentType ? AGENT_REGISTRY[recommendation.relatedAgentType].name : 'AIBeat Business Review',
      potentialAction: 'Review recommendation',
      estimatedMonthlySavings: recommendation.estimatedMonthlySavings,
      confidence: recommendation.confidence,
      relatedAgentType: recommendation.relatedAgentType,
      relatedWorkflowTemplateId: recommendation.relatedWorkflowTemplateId,
      ctaLabel: 'Review Recommendation',
      ctaHref: '/business/recommendations',
    })),
    businessMemoryHealth: demoBusinessMemoryHealth.organizationId === organization.id ? {
      ...demoBusinessMemoryHealth,
      documentCount: Math.max(demoBusinessMemoryHealth.documentCount, documents.length),
      indexedDocumentCount: documents.filter((document) => document.extractionStatus === 'INDEXED').length,
      chunkCount: documentChunks.length,
    } : {
      ...demoBusinessMemoryHealth,
      organizationId: organization.id,
      documentCount: documents.length || context.companyKnowledge.length + context.operationalContext.length + context.peopleAndAccess.length,
      indexedDocumentCount: documents.filter((document) => document.extractionStatus === 'INDEXED').length,
      chunkCount: documentChunks.length,
      agentFindingCount: context.aiOperationalMemory.length,
      lastUpdatedAt: auditEvents[0]?.timestamp,
    },
    agentSummaries: demoAgentSummaries.filter((summary) => summary.agentType in AGENT_REGISTRY),
    recentActivity: auditEvents.slice(0, 8).map((event) => ({
      id: event.id,
      organizationId: event.organizationId,
      timestampLabel: event.timestamp,
      title: event.action,
      summary: event.outputSummary,
      status: event.result === 'FAILED' ? 'FAILED' : event.action === 'APPROVAL_REQUESTED' ? 'WAITING_APPROVAL' : 'SUCCESS',
      href: event.workflowRunId ? '/business/workflows' : '/business/audit',
      agentType: event.agentType,
    })),
    connectors: Object.values(connectorRegistry).map((connector) => ({
      id: connector.id,
      name: connector.name,
      capabilities: connector.capabilities,
      status: connector.id === 'crm' ? 'Needs OAuth' : 'Healthy',
    })),
  }
}
