import { executeAgentMock } from './agents'
import { workflowTemplates } from './demo-data'
import { canAutoExecuteRisk, sanitizeAuditSummary } from './security'
import type {
  AIRecommendation,
  AIToolSubscription,
  AgentFinding,
  Approval,
  AuditEvent,
  BusinessContextDomain,
  BusinessContextItem,
  BusinessContextPayload,
  Organization,
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

      await this.supabase.from('workflow_steps').update({ status: 'COMPLETED', completed_at: new Date().toISOString(), output_summary: `${step.name} completed by mock runtime.` }).eq('id', stepRow.id)
      auditEvents.push(await this.recordAuditEvent(actor, { eventType: 'WORKFLOW_STEP_COMPLETED', entityId: stepRow.id, workflowRunId: runRow.id, agentType: workflow.agentType, summary: `${step.name} completed by mock runtime.` }))
    }

    let finding: AgentFinding | undefined
    if (!approval && finalStatus !== 'FAILED') {
      finding = await this.persistMockAgentFinding(actor, workflow, runRow.id)
    }

    const { data: completedRunRow, error } = await this.supabase
      .from('workflow_runs')
      .update({ status: finalStatus, result_summary: resultSummary, current_step_id: currentStepId, completed_at: finalStatus === 'RUNNING' || finalStatus === 'WAITING_FOR_APPROVAL' ? null : new Date().toISOString() })
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
