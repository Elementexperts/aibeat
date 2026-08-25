import { executeAgentMock, executeAgentRuntime } from './agents'
import { buildOAuthStartUrl, connectorRegistry, getEffectiveConnectionStatus, getIntegrationDefinition, integrationDefinitions } from './connectors'
import { ingestBusinessDocument, type DocumentIngestionInput } from './document-ingestion'
import { rankBusinessMemoryChunks } from './vector-retrieval'
import {
  demoAITools,
  demoApprovals,
  demoAuditEvents,
  demoContextItems,
  demoFindings,
  demoMembers,
  demoOrganizations,
  demoRecommendations,
  demoRoiMetrics,
  demoRuns,
  demoUsers,
  demoWorkflows,
  workflowTemplates,
} from './demo-data'
import { assertPermission, assertTenantAccess, canAutoExecuteRisk, sanitizeAuditSummary } from './security'
import type {
  AIRecommendation,
  AIToolSubscription,
  AgentFinding,
  Approval,
  AuditEvent,
  BusinessContextDomain,
  BusinessContextItem,
  BusinessContextPayload,
  BusinessDocument,
  BusinessDocumentChunk,
  BusinessDocumentIngestionResult,
  ConnectorExecutionRecord,
  IntegrationConnection,
  IntegrationConnectionStatus,
  Organization,
  OrganizationMember,
  ROIMetrics,
  User,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowScheduleAttempt,
  WorkflowScheduleTrigger,
} from './types'

export interface BusinessSeed {
  users: User[]
  organizations: Organization[]
  members: OrganizationMember[]
  integrationConnections: IntegrationConnection[]
  contextItems: BusinessContextItem[]
  documents: BusinessDocument[]
  documentChunks: BusinessDocumentChunk[]
  workflows: WorkflowDefinition[]
  runs: WorkflowRun[]
  scheduleTriggers: WorkflowScheduleTrigger[]
  scheduleAttempts: WorkflowScheduleAttempt[]
  approvals: Approval[]
  findings: AgentFinding[]
  auditEvents: AuditEvent[]
  aiTools: AIToolSubscription[]
  recommendations: AIRecommendation[]
  roiMetrics: ROIMetrics[]
}

export interface BusinessActor {
  userId: string
  organizationId: string
}

export class BusinessDataStore {
  users: User[]
  organizations: Organization[]
  members: OrganizationMember[]
  integrationConnections: IntegrationConnection[]
  contextItems: BusinessContextItem[]
  documents: BusinessDocument[]
  documentChunks: BusinessDocumentChunk[]
  workflows: WorkflowDefinition[]
  runs: WorkflowRun[]
  scheduleTriggers: WorkflowScheduleTrigger[]
  scheduleAttempts: WorkflowScheduleAttempt[]
  approvals: Approval[]
  findings: AgentFinding[]
  auditEvents: AuditEvent[]
  aiTools: AIToolSubscription[]
  recommendations: AIRecommendation[]
  roiMetrics: ROIMetrics[]

  constructor(seed = createBusinessSeed()) {
    this.users = clone(seed.users)
    this.organizations = clone(seed.organizations)
    this.members = clone(seed.members)
    this.integrationConnections = clone(seed.integrationConnections)
    this.contextItems = clone(seed.contextItems)
    this.documents = clone(seed.documents)
    this.documentChunks = clone(seed.documentChunks)
    this.workflows = clone(seed.workflows)
    this.runs = clone(seed.runs)
    this.scheduleTriggers = clone(seed.scheduleTriggers)
    this.scheduleAttempts = clone(seed.scheduleAttempts)
    this.approvals = clone(seed.approvals)
    this.findings = clone(seed.findings)
    this.auditEvents = clone(seed.auditEvents)
    this.aiTools = clone(seed.aiTools)
    this.recommendations = clone(seed.recommendations)
    this.roiMetrics = clone(seed.roiMetrics)
  }

  reset(seed = createBusinessSeed()) {
    const next = new BusinessDataStore(seed)
    Object.assign(this, next)
  }

  getMemberForUser(userId: string, organizationId: string): OrganizationMember | undefined {
    return this.members.find((member) => member.userId === userId && member.organizationId === organizationId && (member.status ?? 'ACTIVE') === 'ACTIVE')
  }

  assertMember(actor: BusinessActor, permission = 'business:read'): OrganizationMember {
    const member = assertTenantAccess(this.getMemberForUser(actor.userId, actor.organizationId), actor.organizationId)
    assertPermission(member, permission)
    return member
  }

  getOrganization(actor: BusinessActor): Organization {
    this.assertMember(actor)
    const organization = this.organizations.find((candidate) => candidate.id === actor.organizationId)
    if (!organization) throw new Error('Organization not found')
    return organization
  }

  getIntegrationConnections(actor: BusinessActor): IntegrationConnection[] {
    this.assertMember(actor)
    return this.integrationConnections.filter((connection) => connection.organizationId === actor.organizationId)
  }

  getIntegrationConnection(actor: BusinessActor, integrationId: string): IntegrationConnection | undefined {
    this.assertMember(actor)
    return this.integrationConnections.find((connection) => connection.organizationId === actor.organizationId && connection.integrationId === integrationId)
  }

  upsertIntegrationConnection(actor: BusinessActor, integrationId: string, patch: Partial<IntegrationConnection> & { status: IntegrationConnectionStatus }): IntegrationConnection {
    this.assertMember(actor, 'business:write')
    const definition = getIntegrationDefinition(integrationId)
    if (!definition) throw new Error(`Unknown integration: ${integrationId}`)
    const now = new Date().toISOString()
    const existing = this.getIntegrationConnection(actor, integrationId)
    const connection: IntegrationConnection = {
      id: existing?.id ?? `conn-${actor.organizationId}-${integrationId}`,
      organizationId: actor.organizationId,
      integrationId,
      status: patch.status,
      encryptedSecretRef: patch.encryptedSecretRef ?? existing?.encryptedSecretRef,
      accessTokenExpiresAt: patch.accessTokenExpiresAt ?? existing?.accessTokenExpiresAt,
      refreshTokenRotatedAt: patch.refreshTokenRotatedAt ?? existing?.refreshTokenRotatedAt,
      lastConnectedAt: patch.status === 'CONNECTED' ? now : existing?.lastConnectedAt,
      lastHealthCheckAt: patch.lastHealthCheckAt ?? existing?.lastHealthCheckAt,
      lastError: patch.lastError,
      reconnectUrl: patch.reconnectUrl,
      metadata: { ...(existing?.metadata ?? {}), ...(patch.metadata ?? {}) },
      createdBy: existing?.createdBy ?? actor.userId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    if (existing) {
      Object.assign(existing, connection)
    } else {
      this.integrationConnections.unshift(connection)
    }
    this.recordAuditEvent(actor, {
      eventType: 'INTEGRATION_CONNECTION_UPDATED',
      entityType: 'integration_connection',
      entityId: connection.id,
      summary: `${definition.name} connection is ${connection.status}`,
    })
    return connection
  }

  connectIntegration(actor: BusinessActor, integrationId: string, expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()): IntegrationConnection {
    return this.upsertIntegrationConnection(actor, integrationId, {
      status: 'CONNECTED',
      encryptedSecretRef: `secret://${actor.organizationId}/${integrationId}`,
      accessTokenExpiresAt: expiresAt,
      refreshTokenRotatedAt: new Date().toISOString(),
      lastError: undefined,
      metadata: { connectedBy: actor.userId },
    })
  }

  expireIntegrationToken(actor: BusinessActor, integrationId: string): IntegrationConnection {
    return this.upsertIntegrationConnection(actor, integrationId, {
      status: 'TOKEN_EXPIRED',
      accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      lastError: 'OAuth access token expired.',
    })
  }

  disconnectIntegration(actor: BusinessActor, integrationId: string): IntegrationConnection {
    return this.upsertIntegrationConnection(actor, integrationId, {
      status: 'DISCONNECTED',
      encryptedSecretRef: undefined,
      lastError: undefined,
      metadata: { disconnectedAt: new Date().toISOString() },
    })
  }

  getIntegrationSummaries(actor: BusinessActor) {
    const connections = this.getIntegrationConnections(actor)
    return integrationDefinitions
      .slice()
      .sort((a, b) => a.pilotPriority - b.pilotPriority)
      .map((definition) => {
        const connection = connections.find((candidate) => candidate.integrationId === definition.id)
        return {
          ...definition,
          connection,
          status: getEffectiveConnectionStatus(connection),
          reconnectUrl: connection?.reconnectUrl ?? buildOAuthStartUrl(definition.id, actor.organizationId),
        }
      })
  }

  searchBusinessContext(params: BusinessActor & { query?: string; domains?: BusinessContextDomain[] }): BusinessContextItem[] {
    this.assertMember(params)
    const query = params.query?.toLowerCase()

    return this.contextItems.filter((item) => {
      if (item.organizationId !== params.organizationId) return false
      if ((item.status ?? 'ACTIVE') !== 'ACTIVE') return false
      if (params.domains?.length && !params.domains.includes(item.domain)) return false
      if (!query) return true
      return `${item.title} ${item.content} ${item.category}`.toLowerCase().includes(query)
    })
  }

  getBusinessContextItem(actor: BusinessActor, itemId: string): BusinessContextItem {
    this.assertMember(actor)
    const item = this.contextItems.find((candidate) => candidate.id === itemId && candidate.organizationId === actor.organizationId && (candidate.status ?? 'ACTIVE') === 'ACTIVE')
    if (!item) throw new Error('Business context item not found')
    return item
  }

  getBusinessContextPayload(actor: BusinessActor): BusinessContextPayload {
    const items = this.searchBusinessContext(actor)
    const payload: BusinessContextPayload = {
      organizationId: actor.organizationId,
      companyKnowledge: [],
      operationalContext: [],
      peopleAndAccess: [],
      aiOperationalMemory: [],
    }

    for (const item of items) {
      if (item.domain === 'COMPANY_KNOWLEDGE') payload.companyKnowledge.push(item)
      if (item.domain === 'OPERATIONAL_CONTEXT') payload.operationalContext.push(item)
      if (item.domain === 'PEOPLE_ACCESS') payload.peopleAndAccess.push(item)
      if (item.domain === 'AI_OPERATIONAL_MEMORY') payload.aiOperationalMemory.push(item)
    }

    payload.aiOperationalMemory.push(
      ...this.findings
        .filter((finding) => finding.organizationId === actor.organizationId && finding.status !== 'REJECTED')
        .map((finding) => findingToContextItem(finding)),
    )

    return payload
  }

  createBusinessContextItem(actor: BusinessActor, input: Omit<BusinessContextItem, 'id' | 'organizationId' | 'createdAt' | 'humanVerified'> & { humanVerified?: boolean }): BusinessContextItem {
    this.assertMember(actor, 'business:write')
    const now = new Date().toISOString()
    const item: BusinessContextItem = {
      ...input,
      id: `ctx-${Date.now()}-${this.contextItems.length + 1}`,
      organizationId: actor.organizationId,
      createdAt: now,
      updatedAt: now,
      humanVerified: input.humanVerified ?? false,
      createdBy: actor.userId,
      status: 'ACTIVE',
    }
    this.contextItems.push(item)
    this.recordAuditEvent(actor, {
      eventType: 'CONTEXT_CREATED',
      entityType: 'business_context_item',
      entityId: item.id,
      summary: `Business context created: ${item.title}`,
    })
    return item
  }

  updateBusinessContextItem(actor: BusinessActor, itemId: string, patch: Partial<BusinessContextItem>): BusinessContextItem {
    this.assertMember(actor, 'business:write')
    const index = this.contextItems.findIndex((item) => item.id === itemId && item.organizationId === actor.organizationId)
    if (index === -1) throw new Error('Business context item not found')
    const updated = { ...this.contextItems[index], ...patch, id: itemId, organizationId: actor.organizationId, updatedAt: new Date().toISOString() }
    this.contextItems[index] = updated
    this.recordAuditEvent(actor, {
      eventType: 'CONTEXT_UPDATED',
      entityType: 'business_context_item',
      entityId: itemId,
      summary: `Business context updated: ${updated.title}`,
    })
    return updated
  }

  archiveBusinessContextItem(actor: BusinessActor, itemId: string): BusinessContextItem {
    return this.updateBusinessContextItem(actor, itemId, { status: 'ARCHIVED' })
  }

  ingestDocument(actor: BusinessActor, input: Omit<DocumentIngestionInput, 'organizationId' | 'userId'>): BusinessDocumentIngestionResult {
    this.assertMember(actor, 'business:write')
    const result = ingestBusinessDocument({ ...input, organizationId: actor.organizationId, userId: actor.userId })
    this.documents = [
      result.document,
      ...this.documents.filter((document) => document.id !== result.document.id || document.organizationId !== actor.organizationId),
    ]
    this.documentChunks = [
      ...result.chunks,
      ...this.documentChunks.filter((chunk) => chunk.documentId !== result.document.id || chunk.organizationId !== actor.organizationId),
    ]
    this.contextItems = [
      result.contextItem,
      ...this.contextItems.filter((item) => item.id !== result.contextItem.id || item.organizationId !== actor.organizationId),
    ]
    this.recordAuditEvent(actor, {
      eventType: 'DOCUMENT_INGESTED',
      entityType: 'document',
      entityId: result.document.id,
      summary: `Document ingested: ${result.document.title} (${result.chunks.length} chunks)`,
    })
    return result
  }

  getDocuments(actor: BusinessActor): BusinessDocument[] {
    this.assertMember(actor)
    return this.documents.filter((document) => document.organizationId === actor.organizationId && document.extractionStatus !== 'ARCHIVED')
  }

  getDocumentChunks(actor: BusinessActor, documentId?: string): BusinessDocumentChunk[] {
    this.assertMember(actor)
    return this.documentChunks.filter((chunk) => {
      if (chunk.organizationId !== actor.organizationId) return false
      if (chunk.status !== 'ACTIVE') return false
      if (documentId && chunk.documentId !== documentId) return false
      return true
    })
  }

  retrieveBusinessMemory(actor: BusinessActor, query: string, limit = 8): BusinessDocumentChunk[] {
    const chunks = this.getDocumentChunks(actor)
    return rankBusinessMemoryChunks({ query, chunks, limit })
  }

  getWorkflows(actor: BusinessActor): WorkflowDefinition[] {
    this.assertMember(actor)
    return this.workflows.filter((workflow) => workflow.organizationId === actor.organizationId)
  }

  getWorkflow(actor: BusinessActor, workflowId: string): WorkflowDefinition {
    this.assertMember(actor)
    const workflow = this.workflows.find((candidate) => candidate.id === workflowId && candidate.organizationId === actor.organizationId)
    if (!workflow) throw new Error('Workflow not found')
    return workflow
  }

  createWorkflow(actor: BusinessActor, workflow: Omit<WorkflowDefinition, 'id' | 'organizationId'>): WorkflowDefinition {
    this.assertMember(actor, 'business:write')
    const created: WorkflowDefinition = { ...workflow, id: `wf-${actor.organizationId}-${Date.now()}`, organizationId: actor.organizationId }
    this.workflows.push(created)
    this.recordAuditEvent(actor, { eventType: 'WORKFLOW_CREATED', entityType: 'workflow', entityId: created.id, summary: `Workflow created: ${created.name}` })
    return created
  }

  updateWorkflow(actor: BusinessActor, workflowId: string, patch: Partial<WorkflowDefinition>): WorkflowDefinition {
    this.assertMember(actor, 'business:write')
    const index = this.workflows.findIndex((workflow) => workflow.id === workflowId && workflow.organizationId === actor.organizationId)
    if (index === -1) throw new Error('Workflow not found')
    const updated = { ...this.workflows[index], ...patch, id: workflowId, organizationId: actor.organizationId }
    this.workflows[index] = updated
    this.recordAuditEvent(actor, { eventType: 'WORKFLOW_UPDATED', entityType: 'workflow', entityId: workflowId, summary: `Workflow updated: ${updated.name}` })
    return updated
  }

  runWorkflow(actor: BusinessActor, workflowId: string, options: { idempotencyKey?: string } = {}): { run: WorkflowRun; approval?: Approval; auditEvents: AuditEvent[]; finding?: AgentFinding } {
    const member = this.assertMember(actor, 'workflow:run')
    const workflow = this.getWorkflow(actor, workflowId)
    if (workflow.status !== 'ACTIVE') throw new Error('Only active workflows can be run')

    const idempotencyKey = options.idempotencyKey ?? `${workflow.id}:manual:${Date.now()}`
    const existing = this.runs.find((run) => run.organizationId === actor.organizationId && run.workflowId === workflow.id && run.idempotencyKey === idempotencyKey)
    if (existing) return { run: existing, approval: this.approvals.find((approval) => approval.workflowRunId === existing.id), auditEvents: [] }

    const runId = `run-${workflow.id}-${Date.now()}`
    const steps: WorkflowRunStep[] = []
    const auditEvents: AuditEvent[] = []
    const connectorExecutions: ConnectorExecutionRecord[] = []
    let approval: Approval | undefined

    const run: WorkflowRun = {
      id: runId,
      organizationId: actor.organizationId,
      workflowId: workflow.id,
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
      steps,
      resultSummary: 'Workflow running.',
      idempotencyKey,
      retryCount: 0,
      resultMetadata: {},
      connectorExecutions,
    }

    this.runs.unshift(run)
    auditEvents.push(this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STARTED', entityType: 'workflow_run', entityId: run.id, workflowRunId: run.id, agentType: workflow.agentType, summary: `Workflow started: ${workflow.name}` }))

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

      steps.push(runStep)
      auditEvents.push(this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STEP_STARTED', entityType: 'workflow_step', entityId: runStep.id, workflowRunId: run.id, agentType: workflow.agentType, summary: `Workflow step started: ${step.name}` }))

      if (step.risk === 'RESTRICTED') {
        runStep.status = 'FAILED'
        runStep.error = 'Restricted actions are not supported.'
        run.status = 'FAILED'
        run.completedAt = new Date().toISOString()
        run.resultSummary = runStep.error
        auditEvents.push(this.recordAuditEvent(actor, { eventType: 'WORKFLOW_FAILED', entityType: 'workflow_run', entityId: run.id, workflowRunId: run.id, agentType: workflow.agentType, summary: runStep.error }))
        break
      }

      if (!canAutoExecuteRisk(step.risk) || workflow.approvalPolicy.requiredForRisks.includes(step.risk)) {
        approval = {
          id: `approval-${runStep.id}`,
          organizationId: actor.organizationId,
          workflowRunId: runId,
          workflowStepId: runStep.id,
          agentType: workflow.agentType,
          proposedAction: step.action,
          actionType: step.action,
          targetSystem: step.connectorId ?? 'AIBeat Business',
          affectedEntity: workflow.name,
          proposedPayload: { workflowId: workflow.id, stepId: step.id },
          generatedContent: `Generated content from ${workflow.name} is ready for review.`,
          reason: `${step.name} is classified as ${step.risk}.`,
          risk: step.risk,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          requestedBy: actor.userId,
        }
        runStep.status = 'WAITING_FOR_APPROVAL'
        runStep.approvalId = approval.id
        runStep.outputSummary = 'Workflow paused pending approval.'
        run.status = 'WAITING_FOR_APPROVAL'
        run.currentStepId = runStep.id
        run.resultSummary = 'Workflow paused at approval boundary.'
        this.approvals.unshift(approval)
        auditEvents.push(this.recordAuditEvent(actor, { eventType: 'APPROVAL_REQUESTED', entityType: 'approval', entityId: approval.id, workflowRunId: run.id, agentType: workflow.agentType, summary: `Approval requested: ${approval.proposedAction}` }))
        break
      }

      const execution = this.executeWorkflowStep(actor, step.action, step.risk, step.connectorId)
      connectorExecutions.push(execution)
      if (!execution.ok) {
        runStep.status = 'FAILED'
        runStep.completedAt = new Date().toISOString()
        runStep.error = execution.error ?? execution.summary
        runStep.outputSummary = execution.summary
        run.status = 'FAILED'
        run.completedAt = new Date().toISOString()
        run.resultSummary = execution.summary
        auditEvents.push(this.recordAuditEvent(actor, { eventType: 'WORKFLOW_FAILED', entityType: 'workflow_run', entityId: run.id, workflowRunId: run.id, agentType: workflow.agentType, summary: execution.summary }))
        break
      }

      runStep.status = 'COMPLETED'
      runStep.completedAt = new Date().toISOString()
      runStep.outputSummary = execution.summary
      auditEvents.push(this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STEP_COMPLETED', entityType: 'workflow_step', entityId: runStep.id, workflowRunId: run.id, agentType: workflow.agentType, summary: runStep.outputSummary }))
    }

    let finding: AgentFinding | undefined
    if (!approval && run.status !== 'FAILED') {
      finding = this.persistRuntimeAgentFinding(actor, workflow, run, member.permissions, connectorExecutions)
      run.status = 'COMPLETED'
      run.completedAt = new Date().toISOString()
      run.resultSummary = 'Workflow completed using connector-backed agent runtime.'
    }

    return { run, approval, auditEvents, finding }
  }

  decideApproval(actor: BusinessActor, approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'EDITED', editedContent?: string): Approval {
    this.assertMember(actor, 'approval:decide')
    const index = this.approvals.findIndex((approval) => approval.id === approvalId && approval.organizationId === actor.organizationId)
    if (index === -1) throw new Error('Approval not found')
    const approval = this.approvals[index]
    if (approval.status !== 'PENDING') throw new Error('Approval is no longer pending')

    const decided: Approval = {
      ...approval,
      status: decision,
      approverId: actor.userId,
      resolvedBy: actor.userId,
      decision,
      editedContent,
      editedPayload: editedContent ? { content: editedContent } : undefined,
      decidedAt: new Date().toISOString(),
      executionResult: decision === 'REJECTED' ? 'Workflow stopped after rejection.' : 'Workflow may continue after approval gate.',
    }
    this.approvals[index] = decided

    const run = this.runs.find((candidate) => candidate.id === approval.workflowRunId && candidate.organizationId === actor.organizationId)
    const step = run?.steps.find((candidate) => candidate.id === approval.workflowStepId)
    if (run && step) {
      if (decision === 'REJECTED') {
        step.status = 'FAILED'
        step.error = 'Approval rejected.'
        run.status = 'FAILED'
        run.completedAt = new Date().toISOString()
        run.resultSummary = 'Workflow stopped after rejection.'
      } else {
        step.status = 'COMPLETED'
        step.completedAt = new Date().toISOString()
        step.outputSummary = 'Approval resolved; workflow may continue.'
        run.status = 'COMPLETED'
        run.completedAt = new Date().toISOString()
        run.resultSummary = 'Workflow completed after approval.'
      }
    }

    this.recordAuditEvent(actor, {
      eventType: decision === 'REJECTED' ? 'APPROVAL_REJECTED' : 'APPROVAL_APPROVED',
      entityType: 'approval',
      entityId: approval.id,
      workflowRunId: approval.workflowRunId,
      agentType: approval.agentType,
      summary: `Approval ${decision.toLowerCase()}: ${approval.proposedAction}`,
    })

    return decided
  }

  getRuns(actor: BusinessActor): WorkflowRun[] {
    this.assertMember(actor)
    return this.runs.filter((run) => run.organizationId === actor.organizationId)
  }

  getApprovals(actor: BusinessActor): Approval[] {
    this.assertMember(actor)
    return this.approvals.filter((approval) => approval.organizationId === actor.organizationId)
  }

  getFindings(actor: BusinessActor): AgentFinding[] {
    this.assertMember(actor)
    return this.findings.filter((finding) => finding.organizationId === actor.organizationId)
  }

  getAITools(actor: BusinessActor): AIToolSubscription[] {
    this.assertMember(actor)
    return this.aiTools.filter((tool) => tool.organizationId === actor.organizationId)
  }

  getRecommendations(actor: BusinessActor): AIRecommendation[] {
    this.assertMember(actor)
    return this.recommendations.filter((recommendation) => recommendation.organizationId === actor.organizationId)
  }

  getROIMetrics(actor: BusinessActor): ROIMetrics {
    this.assertMember(actor)
    return this.roiMetrics.find((metric) => metric.organizationId === actor.organizationId) ?? emptyRoi(actor.organizationId)
  }

  getAuditEvents(actor: BusinessActor): AuditEvent[] {
    this.assertMember(actor)
    return this.auditEvents.filter((event) => event.organizationId === actor.organizationId)
  }

  createAIStackItem(actor: BusinessActor, input: Omit<AIToolSubscription, 'id' | 'organizationId'>): AIToolSubscription {
    this.assertMember(actor, 'business:write')
    const item = { ...input, id: `tool-${Date.now()}`, organizationId: actor.organizationId }
    this.aiTools.push(item)
    this.recordAuditEvent(actor, { eventType: 'AI_TOOL_CREATED', entityType: 'ai_tool_subscription', entityId: item.id, summary: `AI tool created: ${item.toolName}` })
    return item
  }

  updateAIStackItem(actor: BusinessActor, toolId: string, patch: Partial<AIToolSubscription>): AIToolSubscription {
    this.assertMember(actor, 'business:write')
    const index = this.aiTools.findIndex((tool) => tool.id === toolId && tool.organizationId === actor.organizationId)
    if (index === -1) throw new Error('AI tool not found')
    const updated = { ...this.aiTools[index], ...patch, id: toolId, organizationId: actor.organizationId }
    this.aiTools[index] = updated
    this.recordAuditEvent(actor, { eventType: 'AI_TOOL_UPDATED', entityType: 'ai_tool_subscription', entityId: toolId, summary: `AI tool updated: ${updated.toolName}` })
    return updated
  }

  createRecommendation(actor: BusinessActor, input: Omit<AIRecommendation, 'id' | 'organizationId'>): AIRecommendation {
    this.assertMember(actor, 'business:write')
    const recommendation = { ...input, id: `rec-${Date.now()}`, organizationId: actor.organizationId }
    this.recommendations.push(recommendation)
    this.recordAuditEvent(actor, { eventType: 'AI_RECOMMENDATION_CREATED', entityType: 'ai_recommendation', entityId: recommendation.id, summary: `AI recommendation created: ${recommendation.title}` })
    return recommendation
  }

  recordAuditEvent(actor: BusinessActor, input: { eventType: string; entityType?: string; entityId?: string; workflowRunId?: string; agentType?: string; summary: string; metadata?: Record<string, unknown> }): AuditEvent {
    this.assertMember(actor)
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${this.auditEvents.length + 1}`,
      organizationId: actor.organizationId,
      userId: actor.userId,
      agentType: input.agentType as AuditEvent['agentType'],
      workflowRunId: input.workflowRunId,
      action: input.eventType,
      inputSummary: sanitizeAuditSummary(input.summary),
      outputSummary: sanitizeAuditSummary(input.summary),
      result: 'SUCCESS',
      timestamp: new Date().toISOString(),
    }
    this.auditEvents.unshift(event)
    return event
  }

  executeWorkflowStep(actor: BusinessActor, action: string, risk: ConnectorExecutionRecord['risk'], connectorId?: string): ConnectorExecutionRecord {
    if (!connectorId) {
      return { connectorId: 'aibeat-runtime', action, ok: true, risk, summary: `AIBeat runtime executed ${action}` }
    }

    const connector = connectorRegistry[connectorId]
    const definition = getIntegrationDefinition(connectorId)
    if (!connector || !definition) {
      return { connectorId, action, ok: false, risk, summary: `Connector ${connectorId} is not registered`, error: 'CONNECTOR_NOT_REGISTERED' }
    }

    if (definition.authType === 'OAUTH2') {
      const connection = this.getIntegrationConnection(actor, connectorId)
      const status = getEffectiveConnectionStatus(connection)
      if (status !== 'CONNECTED') {
        return {
          connectorId,
          action,
          ok: false,
          risk,
          summary: `${definition.name} cannot execute ${action}: ${status}`,
          error: status,
        }
      }
    }

    return {
      connectorId,
      action,
      ok: true,
      risk,
      summary: `${connector.name} executed ${action}`,
    }
  }

  persistRuntimeAgentFinding(actor: BusinessActor, workflow: WorkflowDefinition, run: WorkflowRun, permissions: string[], connectorExecutions: ConnectorExecutionRecord[]): AgentFinding {
    const organization = this.organizations.find((candidate) => candidate.id === actor.organizationId)
    if (!organization) throw new Error('Organization not found')

    const result = executeAgentRuntime(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        workflowRunId: run.id,
        industryProfile: organization.primaryProfile,
        permissions,
        businessContext: this.getBusinessContextPayload(actor),
      },
      workflow.agentType,
      connectorExecutions,
    )
    const finding = { ...result.finding, id: `finding-${workflow.agentType.toLowerCase()}-${Date.now()}`, status: 'ACTIVE' as const }
    this.findings.unshift(finding)
    this.contextItems.unshift(findingToContextItem(finding))
    this.recordAuditEvent(actor, { eventType: 'AGENT_EXECUTION_COMPLETED', entityType: 'agent_finding', entityId: finding.id, workflowRunId: run.id, agentType: workflow.agentType, summary: finding.title })
    return finding
  }

  persistMockAgentFinding(actor: BusinessActor, workflow: WorkflowDefinition, run: WorkflowRun, permissions: string[]): AgentFinding {
    const organization = this.organizations.find((candidate) => candidate.id === actor.organizationId)
    if (!organization) throw new Error('Organization not found')

    const result = executeAgentMock(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        workflowRunId: run.id,
        industryProfile: organization.primaryProfile,
        permissions,
        businessContext: this.getBusinessContextPayload(actor),
      },
      workflow.agentType,
    )
    const finding = { ...result.finding, id: `finding-${workflow.agentType.toLowerCase()}-${Date.now()}`, status: 'ACTIVE' as const }
    this.findings.unshift(finding)
    this.contextItems.unshift(findingToContextItem(finding))
    this.recordAuditEvent(actor, { eventType: 'AGENT_EXECUTION_COMPLETED', entityType: 'agent_finding', entityId: finding.id, workflowRunId: run.id, agentType: workflow.agentType, summary: finding.title })
    return finding
  }
}

export const businessStore = new BusinessDataStore()

export function createBusinessSeed(): BusinessSeed {
  const orgB: Organization = {
    id: 'org-rival-labs',
    name: 'Rival Labs',
    employeeCount: 18,
    primaryProfile: 'B2B_SAAS',
    secondaryProfiles: [],
    createdAt: '2026-08-01T09:00:00.000Z',
  }
  const userB: User = { id: 'user-bri', name: 'Bri Patel', email: 'bri@example.com' }
  const memberB: OrganizationMember & { status: 'ACTIVE' } = {
    id: 'mem-bri-rival',
    organizationId: orgB.id,
    userId: userB.id,
    role: 'OWNER',
    permissions: [],
    status: 'ACTIVE',
  }
  const contextB: BusinessContextItem = {
    id: 'ctx-rival-product',
    organizationId: orgB.id,
    domain: 'COMPANY_KNOWLEDGE',
    category: 'PRODUCT',
    title: 'Rival product summary',
    content: 'Rival Labs builds onboarding analytics for customer success teams.',
    source: 'Seed',
    sourceDate: '2026-08-01',
    confidence: 0.9,
    createdAt: '2026-08-01T10:00:00.000Z',
    humanVerified: true,
    provenance: 'Tenant isolation seed',
    status: 'ACTIVE',
  }
  const workflowB = demoWorkflows[0] ? { ...demoWorkflows[0], id: 'wf-rival-lead-research', organizationId: orgB.id } : undefined
  const approvalB = demoApprovals[0] ? { ...demoApprovals[0], id: 'approval-rival-1', organizationId: orgB.id, workflowRunId: 'run-rival-1' } : undefined
  const runB = demoRuns[0] ? { ...demoRuns[0], id: 'run-rival-1', organizationId: orgB.id, workflowId: 'wf-rival-lead-research' } : undefined
  const findingB = demoFindings[0] ? { ...demoFindings[0], id: 'finding-rival-1', organizationId: orgB.id, title: 'Rival tenant finding' } : undefined
  const toolB = demoAITools[0] ? { ...demoAITools[0], id: 'tool-rival-1', organizationId: orgB.id, toolName: 'Rival AI' } : undefined
  const recB = demoRecommendations[0] ? { ...demoRecommendations[0], id: 'rec-rival-1', organizationId: orgB.id, title: 'Rival private recommendation' } : undefined

  return {
    users: [...demoUsers, userB],
    organizations: [...demoOrganizations, orgB],
    members: [...demoMembers.map((member) => ({ ...member, status: member.status ?? 'ACTIVE' as const })), memberB],
    integrationConnections: [
      {
        id: 'conn-growth-google-workspace',
        organizationId: 'org-growth-labs',
        integrationId: 'google-workspace',
        status: 'CONNECTED',
        encryptedSecretRef: 'secret://org-growth-labs/google-workspace',
        accessTokenExpiresAt: '2026-09-01T00:00:00.000Z',
        refreshTokenRotatedAt: '2026-08-24T12:00:00.000Z',
        lastConnectedAt: '2026-08-24T12:00:00.000Z',
        lastHealthCheckAt: '2026-08-25T08:00:00.000Z',
        metadata: { pilot: true },
        createdBy: 'user-sarah',
        createdAt: '2026-08-24T12:00:00.000Z',
        updatedAt: '2026-08-25T08:00:00.000Z',
      },
      {
        id: 'conn-growth-crm',
        organizationId: 'org-growth-labs',
        integrationId: 'crm',
        status: 'CONNECTED',
        encryptedSecretRef: 'secret://org-growth-labs/crm',
        accessTokenExpiresAt: '2026-09-01T00:00:00.000Z',
        refreshTokenRotatedAt: '2026-08-24T12:15:00.000Z',
        lastConnectedAt: '2026-08-24T12:15:00.000Z',
        lastHealthCheckAt: '2026-08-25T08:00:00.000Z',
        metadata: { provider: 'hubspot', pilot: true },
        createdBy: 'user-sarah',
        createdAt: '2026-08-24T12:15:00.000Z',
        updatedAt: '2026-08-25T08:00:00.000Z',
      },
      {
        id: 'conn-growth-email-slack',
        organizationId: 'org-growth-labs',
        integrationId: 'email-slack',
        status: 'TOKEN_EXPIRED',
        encryptedSecretRef: 'secret://org-growth-labs/email-slack',
        accessTokenExpiresAt: '2026-08-24T00:00:00.000Z',
        lastError: 'OAuth access token expired.',
        reconnectUrl: '/business/integrations/oauth/start?integration=email-slack',
        metadata: { provider: 'gmail-slack', pilot: true },
        createdBy: 'user-sarah',
        createdAt: '2026-08-20T12:00:00.000Z',
        updatedAt: '2026-08-24T00:00:00.000Z',
      },
    ],
    contextItems: [...demoContextItems.map((item) => ({ ...item, status: item.status ?? 'ACTIVE' })), contextB],
    documents: [],
    documentChunks: [],
    workflows: workflowB ? [...demoWorkflows, workflowB] : [...demoWorkflows],
    runs: runB ? [...demoRuns, runB] : [...demoRuns],
    scheduleTriggers: [],
    scheduleAttempts: [],
    approvals: approvalB ? [...demoApprovals, approvalB] : [...demoApprovals],
    findings: findingB ? [...demoFindings, findingB] : [...demoFindings],
    auditEvents: [...demoAuditEvents],
    aiTools: toolB ? [...demoAITools, toolB] : [...demoAITools],
    recommendations: recB ? [...demoRecommendations, recB] : [...demoRecommendations],
    roiMetrics: [demoRoiMetrics, { ...demoRoiMetrics, organizationId: orgB.id, aiSpendMonthly: 1200, potentialSavingsMonthly: 150 }],
  }
}

function findingToContextItem(finding: AgentFinding): BusinessContextItem {
  return {
    id: `ctx-${finding.id}`,
    organizationId: finding.organizationId,
    domain: 'AI_OPERATIONAL_MEMORY',
    category: 'AGENT_FINDING',
    title: finding.title,
    content: finding.content,
    structuredData: finding.structuredData,
    source: finding.source,
    sourceUrl: finding.sourceUrl,
    sourceDate: finding.sourceDate,
    confidence: finding.confidence,
    createdAt: finding.createdAt,
    updatedAt: finding.updatedAt,
    expiresAt: finding.expiresAt,
    freshUntil: finding.freshUntil,
    relatedEntityType: finding.relatedEntityType,
    relatedEntityId: finding.relatedEntityId,
    humanVerified: finding.humanVerified,
    provenance: `Agent finding ${finding.id} from ${finding.agentType}`,
    status: 'ACTIVE',
  }
}

function emptyRoi(organizationId: string): ROIMetrics {
  return {
    organizationId,
    aiSpendMonthly: 0,
    potentialSavingsMonthly: 0,
    workflowsCompleted: 0,
    estimatedHoursSaved: 0,
    estimatedSavings: 0,
    aiToolCost: 0,
    workflowSuccessRate: 0,
    approvalRate: 0,
    activeWorkflows: 0,
    activeAgents: 0,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
