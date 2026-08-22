import { executeAgentMock } from './agents'
import { getBusinessContextPayload, getMemberForUser } from './context'
import { demoApprovals, demoAuditEvents, demoOrganizations, demoRuns, demoWorkflows, workflowTemplates } from './demo-data'
import { assertPermission, assertTenantAccess, canAutoExecuteRisk, sanitizeAuditSummary } from './security'
import type { Approval, AuditEvent, WorkflowDefinition, WorkflowRun, WorkflowRunStep } from './types'

export function getWorkflowTemplates(): WorkflowDefinition[] {
  return workflowTemplates
}

export function getOrganizationWorkflows(organizationId: string, userId = 'user-sarah'): WorkflowDefinition[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoWorkflows.filter((workflow) => workflow.organizationId === organizationId)
}

export function createWorkflowDraftFromTemplate(templateId: string, organizationId: string, userId: string): WorkflowDefinition {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:write')

  const template = workflowTemplates.find((candidate) => candidate.id === templateId)
  if (!template) throw new Error(`Unknown workflow template: ${templateId}`)

  return {
    ...template,
    id: `draft-${templateId}-${Date.now()}`,
    templateId,
    organizationId,
    status: 'DRAFT',
    version: 1,
  }
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
  const member = assertTenantAccess(getMemberForUser(userId, workflow.organizationId), workflow.organizationId)
  assertPermission(member, 'workflow:run')

  if (workflow.status !== 'ACTIVE') {
    throw new Error('Only active workflows can be run')
  }

  const organization = demoOrganizations.find((candidate) => candidate.id === workflow.organizationId)
  if (!organization) throw new Error('Organization not found')

  const runId = `run-${workflow.id}-${Date.now()}`
  const idempotencyKey = `${workflow.id}:manual:${new Date().toISOString().slice(0, 10)}`
  const steps: WorkflowRunStep[] = []
  const auditEvents: AuditEvent[] = []
  let approval: Approval | undefined

  for (const step of workflow.steps) {
    const runStep: WorkflowRunStep = {
      id: `${runId}-${step.id}`,
      workflowRunId: runId,
      stepDefinitionId: step.id,
      name: step.name,
      risk: step.risk,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    }

    if (step.risk === 'RESTRICTED') {
      runStep.status = 'FAILED'
      runStep.error = 'Restricted actions are not supported in the MVP.'
      steps.push(runStep)
      break
    }

    if (!canAutoExecuteRisk(step.risk) || workflow.approvalPolicy.requiredForRisks.includes(step.risk)) {
      approval = {
        id: `approval-${runStep.id}`,
        organizationId: workflow.organizationId,
        workflowRunId: runId,
        workflowStepId: runStep.id,
        agentType: workflow.agentType,
        proposedAction: step.action,
        targetSystem: step.connectorId ?? 'AIBeat Business',
        affectedEntity: workflow.name,
        generatedContent: `Generated content from ${workflow.name} is ready for review.`,
        reason: `${step.name} is classified as ${step.risk}.`,
        risk: step.risk,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      runStep.status = 'WAITING_FOR_APPROVAL'
      runStep.approvalId = approval.id
      runStep.outputSummary = 'Workflow paused pending approval.'
      steps.push(runStep)
      auditEvents.push(createAuditEvent(workflow, runId, runStep.id, step.action, 'Approval boundary reached', runStep.outputSummary, 'BLOCKED', approval.id))
      break
    }

    runStep.status = 'COMPLETED'
    runStep.completedAt = new Date().toISOString()
    runStep.outputSummary = `${step.name} completed by mock runtime.`
    steps.push(runStep)
    auditEvents.push(createAuditEvent(workflow, runId, runStep.id, step.action, 'Step input validated', runStep.outputSummary, 'SUCCESS'))
  }

  if (!approval) {
    const ctx = {
      organizationId: workflow.organizationId,
      userId,
      workflowRunId: runId,
      industryProfile: organization.primaryProfile,
      permissions: member.permissions,
      businessContext: getBusinessContextPayload(workflow.organizationId, userId),
    }
    executeAgentMock(ctx, workflow.agentType)
  }

  const run: WorkflowRun = {
    id: runId,
    organizationId: workflow.organizationId,
    workflowId: workflow.id,
    status: approval ? 'WAITING_FOR_APPROVAL' : 'COMPLETED',
    startedAt: new Date().toISOString(),
    completedAt: approval ? undefined : new Date().toISOString(),
    steps,
    resultSummary: approval ? 'Workflow paused at approval boundary.' : 'Workflow completed using mock agent runtime.',
    idempotencyKey,
  }

  return { run, approval, auditEvents }
}

function createAuditEvent(
  workflow: WorkflowDefinition,
  workflowRunId: string,
  stepId: string,
  action: string,
  inputSummary: string,
  outputSummary: string,
  result: AuditEvent['result'],
  approvalId?: string,
): AuditEvent {
  return {
    id: `audit-${workflowRunId}-${stepId}`,
    organizationId: workflow.organizationId,
    agentType: workflow.agentType,
    workflowId: workflow.id,
    workflowRunId,
    stepId,
    action,
    inputSummary: sanitizeAuditSummary(inputSummary),
    outputSummary: sanitizeAuditSummary(outputSummary),
    approvalId,
    result,
    timestamp: new Date().toISOString(),
  }
}

export function decideApproval(approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED', approverId: string, editedContent?: string): Approval {
  const member = assertTenantAccess(getMemberForUser(approverId, approval.organizationId), approval.organizationId)
  assertPermission(member, 'approval:decide')

  return {
    ...approval,
    status: decision,
    approverId,
    editedContent,
    decidedAt: new Date().toISOString(),
    executionResult: decision === 'REJECTED' ? 'Workflow stopped after rejection.' : 'Workflow may continue after approval gate.',
  }
}

export function getWorkflowRuns(organizationId: string, userId = 'user-sarah'): WorkflowRun[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoRuns.filter((run) => run.organizationId === organizationId)
}

export function getApprovals(organizationId: string, userId = 'user-sarah'): Approval[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoApprovals.filter((approval) => approval.organizationId === organizationId)
}

export function getAuditEvents(organizationId: string, userId = 'user-sarah'): AuditEvent[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoAuditEvents.filter((event) => event.organizationId === organizationId)
}
