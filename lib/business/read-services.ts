import { getAIToolSubscriptions, getAIRecommendations } from './ai-spend'
import { getBusinessContextByDomain, getBusinessContextPayload } from './context'
import { businessStore } from './store'
import { getApprovals, getAuditEvents, getOrganizationWorkflows, getWorkflow, getWorkflowRuns } from './workflows'
import type { BusinessContextDomain } from './types'

export function getBusinessDashboard(actor: { organizationId: string; userId: string }) {
  return businessStore.getOrganization(actor)
}

export function getBusinessMemory(actor: { organizationId: string; userId: string }) {
  return getBusinessContextPayload(actor.organizationId, actor.userId)
}

export function getBusinessMemoryByDomain(actor: { organizationId: string; userId: string }, domain: BusinessContextDomain) {
  return getBusinessContextByDomain(actor, domain)
}

export function getAIStack(actor: { organizationId: string; userId: string }) {
  return getAIToolSubscriptions(actor.organizationId, actor.userId)
}

export function getRecommendations(actor: { organizationId: string; userId: string }) {
  return getAIRecommendations(actor.organizationId, actor.userId)
}

export function getWorkflows(actor: { organizationId: string; userId: string }) {
  return getOrganizationWorkflows(actor.organizationId, actor.userId)
}

export function getWorkflowRead(actor: { organizationId: string; userId: string }, workflowId: string) {
  return getWorkflow(actor.organizationId, workflowId, actor.userId)
}

export function getRuns(actor: { organizationId: string; userId: string }) {
  return getWorkflowRuns(actor.organizationId, actor.userId)
}

export function getPendingApprovals(actor: { organizationId: string; userId: string }) {
  return getApprovals(actor.organizationId, actor.userId)
}

export function getReports(actor: { organizationId: string; userId: string }) {
  return businessStore.getROIMetrics(actor)
}

export function getAuditLog(actor: { organizationId: string; userId: string }) {
  return getAuditEvents(actor.organizationId, actor.userId)
}

export function getAgentFindings(actor: { organizationId: string; userId: string }) {
  return businessStore.getFindings(actor)
}

