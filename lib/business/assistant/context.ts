import 'server-only'

import { getAIRuntimeStatus } from '../ai-runtime'
import { SupabaseBusinessDataStore } from '../supabase-store'
import type { AIBeatAssistantContext } from './types'

export async function buildAssistantContext(store: SupabaseBusinessDataStore, actor: { organizationId: string; userId: string }, question: string): Promise<AIBeatAssistantContext> {
  const [organization, memory, workflows, runs, approvals, integrations, relevantChunks] = await Promise.all([
    store.getOrganization(actor), store.getBusinessContextPayload(actor), store.getWorkflows(actor), store.getRuns(actor), store.getApprovals(actor), store.getIntegrationSummaries(actor), store.retrieveBusinessMemory(actor, question, 4),
  ])
  const items = [...memory.companyKnowledge, ...memory.operationalContext, ...memory.peopleAndAccess]
  const runtime = getAIRuntimeStatus()
  return {
    organizationId: actor.organizationId, organizationName: organization.name, industry: organization.primaryProfile, employeeCount: organization.employeeCount,
    memoryCategories: Array.from(new Set(items.map((item) => item.category))).slice(0, 12),
    memoryExcerpts: [...items.slice(0, 5).map((item) => `${item.title}: ${item.content.slice(0, 280)}`), ...relevantChunks.map((item) => `${item.title}: ${item.content.slice(0, 350)}`)].slice(0, 8),
    workflows: workflows.slice(0, 8).map((workflow) => ({ id: workflow.templateId ?? workflow.id, name: workflow.name, status: workflow.status, inputs: workflow.inputs.map((input) => input.key) })),
    recentRuns: runs.slice(0, 6).map((run) => ({ workflowId: run.workflowId, status: run.status })), pendingApprovals: approvals.filter((approval) => approval.status === 'PENDING').length,
    integrations: integrations.slice(0, 10).map((integration) => ({ name: integration.name, status: integration.status })), ai: { mode: runtime.mode, provider: runtime.provider, model: runtime.model },
  }
}
