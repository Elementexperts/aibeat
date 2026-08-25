import { executeAgentMock, executeAgentRuntime } from './agents'
import { buildOAuthStartUrl, connectorRegistry, getEffectiveConnectionStatus, getIntegrationDefinition, integrationDefinitions } from './connectors'
import { ingestBusinessDocument, type DocumentIngestionInput } from './document-ingestion'
import { evaluateAgentFinding } from './evaluations'
import { workflowTemplates } from './demo-data'
import { rankBusinessMemoryChunks } from './vector-retrieval'
import { canAutoExecuteRisk, sanitizeAuditSummary } from './security'
import type {
  AIRecommendation,
  AIToolSubscription,
  AgentFinding,
  AgentEvaluationResult,
  Approval,
  AuditEvent,
  BusinessContextDomain,
  BusinessContextItem,
  BusinessContextPayload,
  BusinessDocument,
  BusinessDocumentChunk,
  BusinessDocumentIngestionResult,
  BusinessNotification,
  ConnectorExecutionRecord,
  IntegrationConnection,
  IntegrationConnectionStatus,
  Organization,
  OrganizationMember,
  ROIMetrics,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunStep,
} from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

type Row = Record<string, any>
type Actor = { organizationId: string; userId: string }

export class SupabaseBusinessDataStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async getOrganization(actor: Actor): Promise<Organization> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, name, employee_count, primary_profile, secondary_profiles, created_at')
      .eq('id', actor.organizationId)
      .single()
    if (error || !data) throw new Error('Organization not found')
    return mapOrganization(data)
  }

  async searchBusinessContext(params: Actor & { query?: string; domains?: BusinessContextDomain[] }): Promise<BusinessContextItem[]> {
    let query = this.supabase
      .from('business_context_items')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('status', 'ACTIVE')
      .order('updated_at', { ascending: false })

    if (params.domains?.length) query = query.in('domain', params.domains)
    if (params.query) query = query.or(`title.ilike.%${params.query}%,content.ilike.%${params.query}%,category.ilike.%${params.query}%`)

    const { data, error } = await query
    if (error) throw new Error('Unable to read Business Context')
    return (data ?? []).map(mapContextItem)
  }

  async ingestDocument(actor: Actor, input: Omit<DocumentIngestionInput, 'organizationId' | 'userId'>): Promise<BusinessDocumentIngestionResult> {
    const result = ingestBusinessDocument({ ...input, organizationId: actor.organizationId, userId: actor.userId })

    const { data: documentRow, error: documentError } = await this.supabase
      .from('documents')
      .upsert({
        id: result.document.id,
        organization_id: actor.organizationId,
        title: result.document.title,
        document_type: result.document.documentType,
        source: result.document.source,
        source_url: result.document.sourceUrl,
        storage_bucket: result.document.storageBucket,
        storage_path: result.document.storagePath,
        byte_size: result.document.byteSize,
        checksum: result.document.checksum,
        extraction_status: result.document.extractionStatus,
        extracted_text: result.document.extractedText,
        metadata: result.document.metadata,
        created_by: actor.userId,
      })
      .select('*')
      .single()
    if (documentError || !documentRow) throw new Error('Unable to persist uploaded document')

    await this.supabase
      .from('document_chunks')
      .delete()
      .eq('organization_id', actor.organizationId)
      .eq('document_id', result.document.id)

    const { data: chunkRows, error: chunkError } = await this.supabase
      .from('document_chunks')
      .insert(result.chunks.map((chunk) => ({
        id: chunk.id,
        organization_id: actor.organizationId,
        document_id: result.document.id,
        chunk_index: chunk.chunkIndex,
        title: chunk.title,
        content: chunk.content,
        token_estimate: chunk.tokenEstimate,
        embedding: `[${chunk.embedding.join(',')}]`,
        metadata: chunk.metadata,
        status: 'ACTIVE',
      })))
      .select('*')
    if (chunkError) throw new Error('Unable to persist document chunks')

    const contextItem = await this.createBusinessContextItem(actor, {
      domain: result.contextItem.domain,
      category: result.contextItem.category,
      title: result.contextItem.title,
      content: result.contextItem.content,
      structuredData: result.contextItem.structuredData,
      source: result.contextItem.source,
      sourceType: result.contextItem.sourceType,
      sourceUrl: result.contextItem.sourceUrl,
      sourceDate: result.contextItem.sourceDate,
      confidence: result.contextItem.confidence,
      freshUntil: result.contextItem.freshUntil,
      relatedEntityType: result.contextItem.relatedEntityType,
      relatedEntityId: result.contextItem.relatedEntityId,
      humanVerified: false,
      provenance: result.contextItem.provenance,
      status: 'ACTIVE',
    })
    await this.recordAuditEvent(actor, { eventType: 'DOCUMENT_INGESTED', entityId: result.document.id, summary: `Document ingested: ${result.document.title}` })

    return {
      document: mapDocument(documentRow),
      chunks: (chunkRows ?? []).map(mapDocumentChunk),
      contextItem,
    }
  }

  async getDocuments(actor: Actor): Promise<BusinessDocument[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .neq('extraction_status', 'ARCHIVED')
      .order('updated_at', { ascending: false })
    if (error) throw new Error('Unable to read documents')
    return (data ?? []).map(mapDocument)
  }

  async getDocumentChunks(actor: Actor, documentId?: string): Promise<BusinessDocumentChunk[]> {
    let query = this.supabase
      .from('document_chunks')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .eq('status', 'ACTIVE')
      .order('chunk_index', { ascending: true })
    if (documentId) query = query.eq('document_id', documentId)
    const { data, error } = await query
    if (error) throw new Error('Unable to read document chunks')
    return (data ?? []).map(mapDocumentChunk)
  }

  async retrieveBusinessMemory(actor: Actor, query: string, limit = 8): Promise<BusinessDocumentChunk[]> {
    const chunks = await this.getDocumentChunks(actor)
    return rankBusinessMemoryChunks({ query, chunks, limit })
  }

  async getBusinessContextPayload(actor: Actor): Promise<BusinessContextPayload> {
    const [items, findings] = await Promise.all([
      this.searchBusinessContext(actor),
      this.getFindings(actor),
    ])
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
      ...findings
        .filter((finding) => finding.status !== 'REJECTED')
        .map((finding) => findingToContextItem(finding)),
    )

    return payload
  }

  async createBusinessContextItem(actor: Actor, input: Omit<BusinessContextItem, 'id' | 'organizationId' | 'createdAt' | 'humanVerified'> & { humanVerified?: boolean }): Promise<BusinessContextItem> {
    const { data, error } = await this.supabase
      .from('business_context_items')
      .insert({
        organization_id: actor.organizationId,
        domain: input.domain,
        category: input.category,
        title: input.title,
        content: input.content,
        structured_data: input.structuredData ?? {},
        source: input.source,
        source_type: input.sourceType,
        source_url: input.sourceUrl,
        source_date: input.sourceDate,
        confidence: input.confidence,
        fresh_until: input.freshUntil,
        related_entity_type: input.relatedEntityType,
        related_entity_id: input.relatedEntityId,
        human_verified: input.humanVerified ?? false,
        provenance: input.provenance,
        status: 'ACTIVE',
        created_by: actor.userId,
      })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to create Business Context')
    await this.recordAuditEvent(actor, { eventType: 'CONTEXT_CREATED', summary: `Business context created: ${input.title}` })
    return mapContextItem(data)
  }

  async updateBusinessContextItem(actor: Actor, itemId: string, patch: Partial<BusinessContextItem>): Promise<BusinessContextItem> {
    const { data, error } = await this.supabase
      .from('business_context_items')
      .update(toContextPatch(patch))
      .eq('id', itemId)
      .eq('organization_id', actor.organizationId)
      .select('*')
      .single()
    if (error || !data) throw new Error('Business context item not found')
    await this.recordAuditEvent(actor, { eventType: 'CONTEXT_UPDATED', summary: `Business context updated: ${data.title}` })
    return mapContextItem(data)
  }

  async getWorkflows(actor: Actor): Promise<WorkflowDefinition[]> {
    const { data, error } = await this.supabase.from('workflows').select('*').eq('organization_id', actor.organizationId).order('updated_at', { ascending: false })
    if (error) throw new Error('Unable to read workflows')
    return (data ?? []).map(mapWorkflow)
  }

  async getWorkflow(actor: Actor, workflowId: string): Promise<WorkflowDefinition> {
    const { data, error } = await this.supabase.from('workflows').select('*').eq('id', workflowId).eq('organization_id', actor.organizationId).single()
    if (error || !data) throw new Error('Workflow not found')
    return mapWorkflow(data)
  }

  async updateWorkflow(actor: Actor, workflowId: string, patch: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const { data, error } = await this.supabase.from('workflows').update(toWorkflowPatch(patch)).eq('id', workflowId).eq('organization_id', actor.organizationId).select('*').single()
    if (error || !data) throw new Error('Workflow not found')
    await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_UPDATED', entityId: workflowId, summary: `Workflow updated: ${data.name}` })
    return mapWorkflow(data)
  }

  async getRuns(actor: Actor): Promise<WorkflowRun[]> {
    const { data, error } = await this.supabase.from('workflow_runs').select('*').eq('organization_id', actor.organizationId).order('created_at', { ascending: false })
    if (error) throw new Error('Unable to read workflow runs')
    return this.hydrateRuns(actor.organizationId, data ?? [])
  }

  async getApprovals(actor: Actor): Promise<Approval[]> {
    const { data, error } = await this.supabase.from('approvals').select('*').eq('organization_id', actor.organizationId).order('requested_at', { ascending: false })
    if (error) throw new Error('Unable to read approvals')
    return (data ?? []).map(mapApproval)
  }

  async getFindings(actor: Actor): Promise<AgentFinding[]> {
    const { data, error } = await this.supabase.from('agent_findings').select('*').eq('organization_id', actor.organizationId).order('created_at', { ascending: false })
    if (error) throw new Error('Unable to read agent findings')
    return (data ?? []).map(mapFinding)
  }

  async getAITools(actor: Actor): Promise<AIToolSubscription[]> {
    const { data, error } = await this.supabase.from('ai_tool_subscriptions').select('*').eq('organization_id', actor.organizationId).is('archived_at', null).order('updated_at', { ascending: false })
    if (error) throw new Error('Unable to read AI stack')
    return (data ?? []).map(mapTool)
  }

  async getRecommendations(actor: Actor): Promise<AIRecommendation[]> {
    const { data, error } = await this.supabase.from('ai_recommendations').select('*').eq('organization_id', actor.organizationId).eq('status', 'ACTIVE').order('created_at', { ascending: false })
    if (error) throw new Error('Unable to read recommendations')
    return (data ?? []).map(mapRecommendation)
  }

  async getROIMetrics(actor: Actor): Promise<ROIMetrics> {
    const { data, error } = await this.supabase.from('roi_metrics').select('*').eq('organization_id', actor.organizationId).order('created_at', { ascending: false })
    if (error) throw new Error('Unable to read ROI metrics')
    return summarizeRoi(actor.organizationId, data ?? [])
  }

  async getAuditEvents(actor: Actor): Promise<AuditEvent[]> {
    const { data, error } = await this.supabase.from('audit_events').select('*').eq('organization_id', actor.organizationId).order('created_at', { ascending: false }).limit(100)
    if (error) throw new Error('Unable to read audit events')
    return (data ?? []).map(mapAuditEvent)
  }

  async getIntegrationConnections(actor: Actor): Promise<IntegrationConnection[]> {
    const { data, error } = await this.supabase
      .from('integration_connections')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .order('updated_at', { ascending: false })
    if (error) throw new Error('Unable to read integration connections')
    return (data ?? []).map(mapIntegrationConnection)
  }

  async getOrganizationMembers(actor: Actor) {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select('id, organization_id, user_id, role, permissions, status, invited_email, invited_by, created_at, updated_at')
      .eq('organization_id', actor.organizationId)
      .order('created_at', { ascending: true })
    if (error) throw new Error('Unable to read organization members')
    return (data ?? []).map(mapMembership)
  }

  async getNotifications(actor: Actor): Promise<BusinessNotification[]> {
    const { data, error } = await this.supabase
      .from('business_notifications')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error('Unable to read notifications')
    return (data ?? []).map(mapNotification)
  }

  async getAgentEvaluations(actor: Actor): Promise<AgentEvaluationResult[]> {
    const { data, error } = await this.supabase
      .from('agent_evaluations')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error('Unable to read agent evaluations')
    return (data ?? []).map(mapEvaluation)
  }

  async getIntegrationSummaries(actor: Actor) {
    const connections = await this.getIntegrationConnections(actor)
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

  async upsertIntegrationConnection(actor: Actor, integrationId: string, patch: Partial<IntegrationConnection> & { status: IntegrationConnectionStatus }): Promise<IntegrationConnection> {
    const { data, error } = await this.supabase
      .from('integration_connections')
      .upsert({
        organization_id: actor.organizationId,
        integration_id: integrationId,
        status: patch.status,
        encrypted_secret_ref: patch.encryptedSecretRef,
        access_token_expires_at: patch.accessTokenExpiresAt,
        refresh_token_rotated_at: patch.refreshTokenRotatedAt,
        last_connected_at: patch.lastConnectedAt,
        last_health_check_at: patch.lastHealthCheckAt,
        last_error: patch.lastError,
        reconnect_url: patch.reconnectUrl,
        metadata: patch.metadata ?? {},
        created_by: actor.userId,
      }, { onConflict: 'organization_id,integration_id' })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to update integration connection')
    await this.recordAuditEvent(actor, { eventType: 'INTEGRATION_CONNECTION_UPDATED', entityId: data.id, summary: `${integrationId} connection is ${patch.status}` })
    return mapIntegrationConnection(data)
  }

  async inviteMember(actor: Actor, input: { email: string; role: string }) {
    const { data, error } = await this.supabase
      .from('organization_members')
      .insert({
        organization_id: actor.organizationId,
        user_id: null,
        role: input.role,
        permissions: [],
        status: 'INVITED',
        invited_email: input.email.toLowerCase(),
        invited_by: actor.userId,
      })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to invite member')
    await this.recordAuditEvent(actor, { eventType: 'MEMBER_INVITED', entityId: data.id, summary: `Invited ${input.email} as ${input.role}` })
    return mapMembership(data)
  }

  async updateMemberRole(actor: Actor, memberId: string, role: string) {
    const members = await this.getOrganizationMembers(actor)
    const target = members.find((member) => member.id === memberId)
    if (!target) throw new Error('Member not found')
    if (target.role === 'OWNER' && role !== 'OWNER' && members.filter((member) => member.role === 'OWNER' && (member.status ?? 'ACTIVE') === 'ACTIVE').length <= 1) {
      throw new Error('Workspace must keep at least one active owner')
    }
    const { data, error } = await this.supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', actor.organizationId)
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to update member role')
    await this.recordAuditEvent(actor, { eventType: 'MEMBER_ROLE_UPDATED', entityId: memberId, summary: `Member role updated to ${role}` })
    return mapMembership(data)
  }

  private async createWorkflowNotification(actor: Actor, workflow: WorkflowDefinition, runId: string, type: BusinessNotification['type'], body: string, approvalId?: string) {
    const title = type === 'APPROVAL_REQUESTED'
      ? 'Approval needs review'
      : type === 'WORKFLOW_FAILED'
        ? 'Workflow failed'
        : 'Priority workflow completed'

    const { error } = await this.supabase.from('business_notifications').insert({
      id: `notif-${runId}-${type}-${Date.now()}`,
      organization_id: actor.organizationId,
      type,
      title,
      body,
      href: type === 'APPROVAL_REQUESTED' ? '/business/approvals' : '/business/workflows',
      workflow_id: workflow.id,
      workflow_run_id: runId,
      approval_id: approvalId,
    })
    if (error) return undefined
    return undefined
  }
  async runAgentEvaluationHarness(actor: Actor): Promise<AgentEvaluationResult[]> {
    const [findings, runs, context] = await Promise.all([
      this.getFindings(actor),
      this.getRuns(actor),
      this.getBusinessContextPayload(actor),
    ])
    const evaluations = findings.map((finding) => evaluateAgentFinding({
      organizationId: actor.organizationId,
      agentType: finding.agentType,
      finding,
      run: runs.find((run) => run.id === finding.workflowRunId),
      context,
      priorFindings: findings,
    }))
    if (!evaluations.length) return []
    const { data, error } = await this.supabase
      .from('agent_evaluations')
      .upsert(evaluations.map((evaluation) => ({
        id: evaluation.id,
        organization_id: evaluation.organizationId,
        agent_type: evaluation.agentType,
        workflow_run_id: evaluation.workflowRunId,
        finding_id: evaluation.findingId,
        factuality: evaluation.factuality,
        relevance: evaluation.relevance,
        duplicate_rate: evaluation.duplicateRate,
        edit_rate: evaluation.editRate,
        estimated_cost_usd: evaluation.estimatedCostUsd,
        latency_ms: evaluation.latencyMs,
        passed: evaluation.passed,
        notes: evaluation.notes,
      })))
      .select('*')
    if (error) throw new Error('Unable to persist agent evaluations')
    await this.recordAuditEvent(actor, { eventType: 'AGENT_EVALUATION_HARNESS_RUN', summary: `Evaluated ${evaluations.length} agent findings` })
    return (data ?? []).map(mapEvaluation)
  }

  async runWorkflow(actor: Actor, workflowId: string, options: { idempotencyKey?: string } = {}): Promise<{ run: WorkflowRun; approval?: Approval; auditEvents: AuditEvent[]; finding?: AgentFinding }> {
    const workflow = await this.getWorkflow(actor, workflowId)
    if (workflow.status !== 'ACTIVE') throw new Error('Only active workflows can be run')

    const idempotencyKey = options.idempotencyKey ?? `${workflow.id}:manual:${Date.now()}`
    const { data: existing } = await this.supabase
      .from('workflow_runs')
      .select('*')
      .eq('organization_id', actor.organizationId)
      .eq('workflow_id', workflow.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing) {
      const [run] = await this.hydrateRuns(actor.organizationId, [existing])
      const approvals = await this.getApprovals(actor)
      return { run, approval: approvals.find((approval) => approval.workflowRunId === run.id), auditEvents: [] }
    }

    const { data: runRow, error: runError } = await this.supabase
      .from('workflow_runs')
      .insert({
        organization_id: actor.organizationId,
        workflow_id: workflow.id,
        status: 'RUNNING',
        idempotency_key: idempotencyKey,
        retry_count: 0,
        result_summary: 'Workflow running.',
        result_metadata: {},
      })
      .select('*')
      .single()
    if (runError || !runRow) throw new Error('Unable to start workflow')

    const auditEvents: AuditEvent[] = [
      await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STARTED', entityId: runRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: `Workflow started: ${workflow.name}` }),
    ]
    const connectorExecutions: ConnectorExecutionRecord[] = []
    let approval: Approval | undefined
    let finalStatus = 'COMPLETED'
    let resultSummary = 'Workflow completed using mock agent runtime.'
    let currentStepId: string | undefined

    for (const step of workflow.steps) {
      const { data: stepRow, error: stepError } = await this.supabase
        .from('workflow_steps')
        .insert({
          organization_id: actor.organizationId,
          workflow_run_id: runRow.id,
          step_definition_id: step.id,
          name: step.name,
          risk: step.risk,
          status: 'RUNNING',
          started_at: new Date().toISOString(),
        })
        .select('*')
        .single()
      if (stepError || !stepRow) throw new Error('Unable to persist workflow step')

      auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STEP_STARTED', entityId: stepRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: `Workflow step started: ${step.name}` }))

      if (step.risk === 'RESTRICTED') {
        await this.supabase.from('workflow_steps').update({ status: 'FAILED', error: 'Restricted actions are not supported.', completed_at: new Date().toISOString() }).eq('id', stepRow.id)
        finalStatus = 'FAILED'
        resultSummary = 'Restricted actions are not supported.'
        auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_FAILED', entityId: runRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: resultSummary }))
        break
      }

      if (!canAutoExecuteRisk(step.risk) || workflow.approvalPolicy.requiredForRisks.includes(step.risk)) {
        const { data: approvalRow, error: approvalError } = await this.supabase
          .from('approvals')
          .insert({
            organization_id: actor.organizationId,
            workflow_id: workflow.id,
            workflow_run_id: runRow.id,
            workflow_step_id: stepRow.id,
            agent_type: workflow.agentType,
            action_type: step.action,
            action_risk: step.risk,
            proposed_action: step.action,
            proposed_payload: { workflowId: workflow.id, stepId: step.id },
            target_system: step.connectorId ?? 'AIBeat Business',
            target_entity: workflow.name,
            reason: `${step.name} is classified as ${step.risk}.`,
            requested_by: actor.userId,
          })
          .select('*')
          .single()
        if (approvalError || !approvalRow) throw new Error('Unable to persist approval')
        approval = mapApproval(approvalRow)
        await this.supabase.from('workflow_steps').update({ status: 'WAITING_FOR_APPROVAL', output_summary: 'Workflow paused pending approval.' }).eq('id', stepRow.id)
        finalStatus = 'WAITING_FOR_APPROVAL'
        resultSummary = 'Workflow paused at approval boundary.'
        currentStepId = stepRow.id
        auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'APPROVAL_REQUESTED', entityId: approval.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: `Approval requested: ${approval.proposedAction}` }))
        break
      }

      const execution = await this.executeWorkflowStep(actor, step.action, step.risk, step.connectorId)
      connectorExecutions.push(execution)
      if (!execution.ok) {
        await this.supabase.from('workflow_steps').update({ status: 'FAILED', error: execution.error ?? execution.summary, completed_at: new Date().toISOString(), output_summary: execution.summary }).eq('id', stepRow.id)
        finalStatus = 'FAILED'
        resultSummary = execution.summary
        auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_FAILED', entityId: runRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: execution.summary }))
        break
      }

      await this.supabase.from('workflow_steps').update({ status: 'COMPLETED', completed_at: new Date().toISOString(), output_summary: execution.summary }).eq('id', stepRow.id)
      auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STEP_COMPLETED', entityId: stepRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: execution.summary }))
    }

    let finding: AgentFinding | undefined
    if (!approval && finalStatus !== 'FAILED') {
      finding = await this.persistRuntimeAgentFinding(actor, workflow, runRow.id, connectorExecutions)
      resultSummary = 'Workflow completed using connector-backed agent runtime.'
    }

    const { data: completedRunRow, error } = await this.supabase
      .from('workflow_runs')
      .update({ status: finalStatus, result_summary: resultSummary, current_step_id: currentStepId, completed_at: finalStatus === 'RUNNING' || finalStatus === 'WAITING_FOR_APPROVAL' ? null : new Date().toISOString(), result_metadata: { connectorExecutions } })
      .eq('id', runRow.id)
      .select('*')
      .single()
    if (error || !completedRunRow) throw new Error('Unable to complete workflow')
    const [run] = await this.hydrateRuns(actor.organizationId, [completedRunRow])
    return { run, approval, auditEvents, finding }
  }

  async decideApproval(actor: Actor, approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'EDITED', editedContent?: string): Promise<Approval> {
    const { data: approvalRow, error: approvalError } = await this.supabase
      .from('approvals')
      .update({
        status: decision,
        resolved_by: actor.userId,
        resolved_at: new Date().toISOString(),
        decision,
        edited_payload: editedContent ? { content: editedContent } : null,
        execution_result: decision === 'REJECTED' ? 'Workflow stopped after rejection.' : 'Workflow may continue after approval gate.',
      })
      .eq('id', approvalId)
      .eq('organization_id', actor.organizationId)
      .eq('status', 'PENDING')
      .select('*')
      .single()
    if (approvalError || !approvalRow) throw new Error('Approval not found')

    const failed = decision === 'REJECTED'
    await this.supabase.from('workflow_steps').update({
      status: failed ? 'FAILED' : 'COMPLETED',
      error: failed ? 'Approval rejected.' : null,
      output_summary: failed ? null : 'Approval resolved; workflow may continue.',
      completed_at: new Date().toISOString(),
    }).eq('id', approvalRow.workflow_step_id).eq('organization_id', actor.organizationId)
    await this.supabase.from('workflow_runs').update({
      status: failed ? 'FAILED' : 'COMPLETED',
      completed_at: new Date().toISOString(),
      result_summary: failed ? 'Workflow stopped after rejection.' : 'Workflow completed after approval.',
    }).eq('id', approvalRow.workflow_run_id).eq('organization_id', actor.organizationId)
    await this.recordAuditEvent(actor, {
      eventType: failed ? 'APPROVAL_REJECTED' : 'APPROVAL_APPROVED',
      entityId: approvalId,
      workflowRunId: approvalRow.workflow_run_id,
      agentType: approvalRow.agent_type,
      summary: `Approval ${decision.toLowerCase()}: ${approvalRow.proposed_action}`,
    })
    return mapApproval(approvalRow)
  }

  private async hydrateRuns(organizationId: string, rows: Row[]): Promise<WorkflowRun[]> {
    if (!rows.length) return []
    const ids = rows.map((row) => row.id)
    const { data: stepRows, error } = await this.supabase.from('workflow_steps').select('*').eq('organization_id', organizationId).in('workflow_run_id', ids).order('created_at', { ascending: true })
    if (error) throw new Error('Unable to read workflow steps')
    const byRun = new Map<string, WorkflowRunStep[]>()
    for (const row of stepRows ?? []) {
      const steps = byRun.get(row.workflow_run_id) ?? []
      steps.push(mapRunStep(row))
      byRun.set(row.workflow_run_id, steps)
    }
    return rows.map((row) => mapRun(row, byRun.get(row.id) ?? []))
  }

  private async persistMockAgentFinding(actor: Actor, workflow: WorkflowDefinition, workflowRunId: string): Promise<AgentFinding> {
    const organization = await this.getOrganization(actor)
    const result = executeAgentMock(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        workflowRunId,
        industryProfile: organization.primaryProfile,
        permissions: ['business:read', 'workflow:run'],
        businessContext: await this.getBusinessContextPayload(actor),
      },
      workflow.agentType,
    )

    const { data, error } = await this.supabase
      .from('agent_findings')
      .insert({
        organization_id: actor.organizationId,
        agent_type: workflow.agentType,
        workflow_run_id: workflowRunId,
        finding_type: result.finding.findingType,
        title: result.finding.title,
        content: result.finding.content,
        structured_data: result.finding.structuredData ?? {},
        source: result.finding.source,
        source_url: result.finding.sourceUrl,
        source_date: result.finding.sourceDate,
        confidence: result.finding.confidence,
        fresh_until: result.finding.freshUntil,
        related_entity_type: result.finding.relatedEntityType,
        related_entity_id: result.finding.relatedEntityId,
        human_verified: result.finding.humanVerified,
        status: 'ACTIVE',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to persist agent finding')
    await this.recordAuditEvent(actor, { eventType: 'AGENT_EXECUTION_COMPLETED', entityId: data.id, workflowRunId, agentType: workflow.agentType, summary: data.title })
    return mapFinding(data)
  }

  private async executeWorkflowStep(actor: Actor, action: string, risk: ConnectorExecutionRecord['risk'], connectorId?: string): Promise<ConnectorExecutionRecord> {
    if (!connectorId) return { connectorId: 'aibeat-runtime', action, ok: true, risk, summary: `AIBeat runtime executed ${action}` }
    const connector = connectorRegistry[connectorId]
    const definition = getIntegrationDefinition(connectorId)
    if (!connector || !definition) {
      return { connectorId, action, ok: false, risk, summary: `Connector ${connectorId} is not registered`, error: 'CONNECTOR_NOT_REGISTERED' }
    }
    if (definition.authType === 'OAUTH2') {
      const connections = await this.getIntegrationConnections(actor)
      const connection = connections.find((candidate) => candidate.integrationId === connectorId)
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
    const result = await connector.execute(action, { organizationId: actor.organizationId })
    return { connectorId, action, ok: result.ok, risk, summary: result.summary, error: result.error }
  }

  private async persistRuntimeAgentFinding(actor: Actor, workflow: WorkflowDefinition, workflowRunId: string, connectorExecutions: ConnectorExecutionRecord[]): Promise<AgentFinding> {
    const organization = await this.getOrganization(actor)
    const result = executeAgentRuntime(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        workflowRunId,
        industryProfile: organization.primaryProfile,
        permissions: ['business:read', 'workflow:run'],
        businessContext: await this.getBusinessContextPayload(actor),
      },
      workflow.agentType,
      connectorExecutions,
    )

    const { data, error } = await this.supabase
      .from('agent_findings')
      .insert({
        organization_id: actor.organizationId,
        agent_type: workflow.agentType,
        workflow_run_id: workflowRunId,
        finding_type: result.finding.findingType,
        title: result.finding.title,
        content: result.finding.content,
        structured_data: result.finding.structuredData ?? {},
        source: result.finding.source,
        source_url: result.finding.sourceUrl,
        source_date: result.finding.sourceDate,
        confidence: result.finding.confidence,
        fresh_until: result.finding.freshUntil,
        related_entity_type: result.finding.relatedEntityType,
        related_entity_id: result.finding.relatedEntityId,
        human_verified: result.finding.humanVerified,
        status: 'ACTIVE',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to persist agent finding')
    await this.recordAuditEvent(actor, { eventType: 'AGENT_EXECUTION_COMPLETED', entityId: data.id, workflowRunId, agentType: workflow.agentType, summary: data.title })
    return mapFinding(data)
  }

  private async recordAuditEvent(actor: Actor, input: { eventType: string; entityId?: string; workflowRunId?: string; agentType?: string; summary: string }): Promise<AuditEvent> {
    const { data, error } = await this.supabase
      .from('audit_events')
      .insert({
        organization_id: actor.organizationId,
        actor_user_id: actor.userId,
        event_type: input.eventType,
        entity_id: input.entityId,
        workflow_run_id: input.workflowRunId,
        agent_type: input.agentType,
        summary: sanitizeAuditSummary(input.summary),
      })
      .select('*')
      .single()
    if (error || !data) throw new Error('Unable to persist audit event')
    return mapAuditEvent(data)
  }
}

function mapOrganization(row: Row): Organization {
  return {
    id: row.id,
    name: row.name,
    employeeCount: Number(row.employee_count ?? 0),
    primaryProfile: row.primary_profile,
    secondaryProfiles: row.secondary_profiles ?? [],
    createdAt: row.created_at,
    timezone: row.timezone ?? undefined,
  }
}

function mapContextItem(row: Row): BusinessContextItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    domain: row.domain,
    category: row.category,
    title: row.title,
    content: row.content,
    structuredData: row.structured_data ?? undefined,
    source: row.source,
    sourceType: row.source_type ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    sourceDate: row.source_date ?? undefined,
    confidence: row.confidence == null ? undefined : Number(row.confidence),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    freshUntil: row.fresh_until ?? undefined,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    humanVerified: Boolean(row.human_verified),
    provenance: row.provenance,
    status: row.status ?? 'ACTIVE',
    createdBy: row.created_by ?? undefined,
  }
}

function mapDocument(row: Row): BusinessDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    documentType: row.document_type,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    storageBucket: row.storage_bucket ?? undefined,
    storagePath: row.storage_path ?? undefined,
    byteSize: row.byte_size == null ? undefined : Number(row.byte_size),
    checksum: row.checksum ?? undefined,
    extractionStatus: row.extraction_status ?? 'INDEXED',
    extractedText: row.extracted_text ?? undefined,
    metadata: row.metadata ?? {},
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function mapDocumentChunk(row: Row): BusinessDocumentChunk {
  return {
    id: row.id,
    organizationId: row.organization_id,
    documentId: row.document_id,
    chunkIndex: Number(row.chunk_index ?? 0),
    title: row.title,
    content: row.content,
    tokenEstimate: Number(row.token_estimate ?? 0),
    embedding: parseEmbedding(row.embedding),
    metadata: row.metadata ?? {
      source: 'Document',
      documentType: 'TEXT',
      documentTitle: row.title,
      chunkIndex: Number(row.chunk_index ?? 0),
    },
    status: row.status ?? 'ACTIVE',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function mapIntegrationConnection(row: Row): IntegrationConnection {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationId: row.integration_id,
    status: row.status,
    encryptedSecretRef: row.encrypted_secret_ref ?? undefined,
    accessTokenExpiresAt: row.access_token_expires_at ?? undefined,
    refreshTokenRotatedAt: row.refresh_token_rotated_at ?? undefined,
    lastConnectedAt: row.last_connected_at ?? undefined,
    lastHealthCheckAt: row.last_health_check_at ?? undefined,
    lastError: row.last_error ?? undefined,
    reconnectUrl: row.reconnect_url ?? undefined,
    metadata: row.metadata ?? {},
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function mapMembership(row: Row): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id ?? `invited:${row.invited_email}`,
    role: row.role,
    permissions: row.permissions ?? [],
    status: row.status ?? 'ACTIVE',
    invitedEmail: row.invited_email ?? undefined,
    invitedBy: row.invited_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function mapNotification(row: Row): BusinessNotification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id ?? undefined,
    type: row.type,
    status: row.status,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    workflowId: row.workflow_id ?? undefined,
    workflowRunId: row.workflow_run_id ?? undefined,
    approvalId: row.approval_id ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  }
}

function mapEvaluation(row: Row): AgentEvaluationResult {
  return {
    id: row.id,
    organizationId: row.organization_id,
    agentType: row.agent_type,
    workflowRunId: row.workflow_run_id ?? undefined,
    findingId: row.finding_id ?? undefined,
    factuality: Number(row.factuality ?? 0),
    relevance: Number(row.relevance ?? 0),
    duplicateRate: Number(row.duplicate_rate ?? 0),
    editRate: Number(row.edit_rate ?? 0),
    estimatedCostUsd: Number(row.estimated_cost_usd ?? 0),
    latencyMs: Number(row.latency_ms ?? 0),
    passed: Boolean(row.passed),
    notes: row.notes ?? [],
    createdAt: row.created_at,
  }
}

function parseEmbedding(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number)
  if (typeof value !== 'string') return []
  return value.replace(/^\[/, '').replace(/\]$/, '').split(',').map((part) => Number(part.trim())).filter((part) => Number.isFinite(part))
}

function mapWorkflow(row: Row): WorkflowDefinition {
  return {
    id: row.id,
    organizationId: row.organization_id,
    templateId: row.template_id ?? undefined,
    name: row.name,
    description: row.description,
    agentType: row.agent_type,
    trigger: row.trigger,
    schedule: row.schedule ?? undefined,
    timezone: row.timezone ?? undefined,
    nextRunAt: row.next_run_at ?? undefined,
    inputs: row.inputs ?? [],
    steps: row.steps ?? [],
    requiredIntegrations: row.required_integrations ?? [],
    approvalPolicy: row.approval_policy ?? { requiredForRisks: [], approverRoles: [] },
    outputDefinition: row.output_definition ?? {},
    status: row.status,
    version: Number(row.version ?? 1),
    idempotencyKey: row.idempotency_key ?? undefined,
  }
}

function mapRun(row: Row, steps: WorkflowRunStep[]): WorkflowRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workflowId: row.workflow_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    currentStepId: row.current_step_id ?? undefined,
    retryCount: Number(row.retry_count ?? 0),
    resultMetadata: row.result_metadata ?? {},
    steps,
    resultSummary: row.result_summary ?? undefined,
    idempotencyKey: row.idempotency_key,
    scheduledTriggerId: row.scheduled_trigger_id ?? undefined,
    scheduledFor: row.scheduled_for ?? undefined,
    deadLetterReason: row.dead_letter_reason ?? undefined,
    connectorExecutions: row.result_metadata?.connectorExecutions ?? undefined,
  }
}

function mapRunStep(row: Row): WorkflowRunStep {
  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    stepDefinitionId: row.step_definition_id,
    name: row.name,
    risk: row.risk,
    status: row.status,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    outputSummary: row.output_summary ?? undefined,
    error: row.error ?? undefined,
  }
}

function mapApproval(row: Row): Approval {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workflowRunId: row.workflow_run_id,
    workflowStepId: row.workflow_step_id,
    agentType: row.agent_type,
    proposedAction: row.proposed_action,
    actionType: row.action_type,
    proposedPayload: row.proposed_payload ?? {},
    targetSystem: row.target_system,
    affectedEntity: row.target_entity,
    generatedContent: row.edited_payload?.content ?? `Generated content for ${row.proposed_action} is ready for review.`,
    reason: row.reason,
    risk: row.action_risk,
    status: row.status,
    createdAt: row.requested_at ?? row.created_at,
    decidedAt: row.resolved_at ?? undefined,
    approverId: row.resolved_by ?? undefined,
    requestedBy: row.requested_by ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    decision: row.decision ?? undefined,
    editedContent: row.edited_payload?.content ?? undefined,
    editedPayload: row.edited_payload ?? undefined,
    executionResult: row.execution_result ?? undefined,
  }
}

function mapFinding(row: Row): AgentFinding {
  return {
    id: row.id,
    organizationId: row.organization_id,
    agentType: row.agent_type,
    findingType: row.finding_type,
    title: row.title,
    content: row.content,
    structuredData: row.structured_data ?? undefined,
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    sourceDate: row.source_date ?? undefined,
    confidence: Number(row.confidence ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    freshUntil: row.fresh_until ?? undefined,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    workflowRunId: row.workflow_run_id ?? undefined,
    humanVerified: Boolean(row.human_verified),
    status: row.status,
  }
}

function mapTool(row: Row): AIToolSubscription {
  return {
    id: row.id,
    organizationId: row.organization_id,
    toolName: row.product,
    vendor: row.vendor,
    category: row.category,
    capability: Array.isArray(row.capabilities) ? row.capabilities.join(', ') : '',
    department: row.department,
    owner: row.owner,
    monthlyCost: Number(row.monthly_cost ?? 0),
    billingCycle: row.billing_cycle,
    seatsPurchased: Number(row.seat_count ?? 0),
    activeSeats: Number(row.active_seat_count ?? 0),
    renewalDate: row.renewal_date ?? '',
    status: row.approval_status,
    usageLevel: row.utilization,
    notes: row.notes ?? undefined,
  }
}

function mapRecommendation(row: Row): AIRecommendation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    title: row.title,
    rationale: row.rationale,
    estimatedMonthlySavings: row.estimated_monthly_savings == null ? undefined : Number(row.estimated_monthly_savings),
    confidence: Number(row.confidence ?? 0),
    relatedToolIds: row.related_tool_ids ?? [],
    relatedAgentType: row.related_agent_type ?? undefined,
    relatedWorkflowTemplateId: row.related_workflow_template_id ?? undefined,
  }
}

function mapAuditEvent(row: Row): AuditEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.actor_user_id ?? undefined,
    agentType: row.agent_type ?? undefined,
    workflowRunId: row.workflow_run_id ?? undefined,
    action: row.event_type,
    inputSummary: row.summary,
    outputSummary: row.summary,
    result: 'SUCCESS',
    timestamp: row.created_at,
  }
}

function summarizeRoi(organizationId: string, rows: Row[]): ROIMetrics {
  const completed = rows.filter((row) => row.success === true).length
  const approvalRows = rows.filter((row) => row.approval_required)
  return {
    organizationId,
    aiSpendMonthly: rows.reduce((sum, row) => sum + Number(row.ai_cost ?? 0) + Number(row.tool_cost ?? 0), 0),
    potentialSavingsMonthly: rows.reduce((sum, row) => sum + Number(row.estimated_cost_saved ?? 0), 0),
    workflowsCompleted: completed,
    estimatedHoursSaved: rows.reduce((sum, row) => sum + Number(row.estimated_minutes_saved ?? 0), 0) / 60,
    estimatedSavings: rows.reduce((sum, row) => sum + Number(row.estimated_cost_saved ?? 0), 0),
    aiToolCost: rows.reduce((sum, row) => sum + Number(row.tool_cost ?? 0), 0),
    workflowSuccessRate: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    approvalRate: approvalRows.length ? Math.round((approvalRows.filter((row) => row.approval_result === 'APPROVED').length / approvalRows.length) * 100) : 0,
    activeWorkflows: 0,
    activeAgents: 0,
  }
}

function toContextPatch(patch: Partial<BusinessContextItem>): Row {
  return {
    domain: patch.domain,
    category: patch.category,
    title: patch.title,
    content: patch.content,
    structured_data: patch.structuredData,
    source: patch.source,
    source_type: patch.sourceType,
    source_url: patch.sourceUrl,
    source_date: patch.sourceDate,
    confidence: patch.confidence,
    fresh_until: patch.freshUntil,
    related_entity_type: patch.relatedEntityType,
    related_entity_id: patch.relatedEntityId,
    human_verified: patch.humanVerified,
    provenance: patch.provenance,
    status: patch.status,
  }
}

function toWorkflowPatch(patch: Partial<WorkflowDefinition>): Row {
  return {
    name: patch.name,
    description: patch.description,
    agent_type: patch.agentType,
    trigger: patch.trigger,
    schedule: patch.schedule,
    timezone: patch.timezone,
    next_run_at: patch.nextRunAt,
    inputs: patch.inputs,
    steps: patch.steps,
    required_integrations: patch.requiredIntegrations,
    approval_policy: patch.approvalPolicy,
    output_definition: patch.outputDefinition,
    status: patch.status,
    version: patch.version,
    idempotency_key: patch.idempotencyKey,
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

export { workflowTemplates }
