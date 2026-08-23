import { workflowTemplates } from './demo-data'
import { businessStore } from './store'
import type { Approval, AuditEvent, WorkflowDefinition, WorkflowRun } from './types'

export function getWorkflowTemplates(): WorkflowDefinition[] {
  return workflowTemplates
}

export function getOrganizationWorkflows(organizationId: string, userId = 'user-sarah'): WorkflowDefinition[] {
  return businessStore.getWorkflows({ organizationId, userId })
}

export function createWorkflowDraftFromTemplate(templateId: string, organizationId: string, userId: string): WorkflowDefinition {
  const template = workflowTemplates.find((candidate) => candidate.id === templateId)
  if (!template) throw new Error(`Unknown workflow template: ${templateId}`)

  return businessStore.createWorkflow({ organizationId, userId }, {
    ...template,
    templateId,
    status: 'DRAFT',
    version: 1,
  })
}

export function createWorkflowDraftFromNaturalLanguage(instruction: string, organizationId: string, userId: string): WorkflowDefinition {
  const lower = instruction.toLowerCase()
  const templateId = lower.includes('monday') || lower.includes('performance') || lower.includes('report')
    ? 'tpl-weekly-report'
    : lower.includes('competitor')
      ? 'tpl-competitor-monitor'
      : lower.includes('lead')
        ? 'tpl-lead-research'
        : 'tpl-executive-brief'

  const draft = createWorkflowDraftFromTemplate(templateId, organizationId, userId)
  return {
    ...draft,
    name: `Draft: ${draft.name}`,
    description: `Generated from instruction: ${instruction}`,
    status: 'DRAFT',
  }
}

export function runWorkflowManual(workflow: WorkflowDefinition, userId: string): { run: WorkflowRun; approval?: Approval; auditEvents: AuditEvent[] } {
  return businessStore.runWorkflow({ organizationId: workflow.organizationId, userId }, workflow.id)
}

export function decideApproval(approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED', approverId: string, editedContent?: string): Approval {
  return businessStore.decideApproval({ organizationId: approval.organizationId, userId: approverId }, approval.id, decision, editedContent)
}

export function getWorkflowRuns(organizationId: string, userId = 'user-sarah'): WorkflowRun[] {
  return businessStore.getRuns({ organizationId, userId })
}

export function getApprovals(organizationId: string, userId = 'user-sarah'): Approval[] {
  return businessStore.getApprovals({ organizationId, userId })
}

export function getAuditEvents(organizationId: string, userId = 'user-sarah'): AuditEvent[] {
  return businessStore.getAuditEvents({ organizationId, userId })
}

export function getWorkflow(organizationId: string, workflowId: string, userId = 'user-sarah'): WorkflowDefinition {
  return businessStore.getWorkflow({ organizationId, userId }, workflowId)
}

export function updateWorkflow(organizationId: string, workflowId: string, patch: Partial<WorkflowDefinition>, userId = 'user-sarah'): WorkflowDefinition {
  return businessStore.updateWorkflow({ organizationId, userId }, workflowId, patch)
}
