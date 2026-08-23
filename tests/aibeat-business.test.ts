import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test, { beforeEach } from 'node:test'
import { executeAgentMock, validateAgentOutput } from '../lib/business/agents'
import { getOptimizationOpportunities } from '../lib/business/ai-spend'
import { archiveBusinessContextItem, getBusinessContextItem, getBusinessContextPayload, searchBusinessContext } from '../lib/business/context'
import { getAgentIndustryInstructions } from '../lib/business/industry-profiles'
import { approveAction, createContext, rejectAction, runWorkflow } from '../lib/business/mutations'
import { getAgentFindings, getAIStack, getAuditLog, getPendingApprovals, getRecommendations, getRuns, getWorkflows } from '../lib/business/read-services'
import { classifyActionRisk } from '../lib/business/security'
import { resolveBusinessMembership } from '../lib/business/auth'
import { businessStore } from '../lib/business/store'
import { getBusinessWorkspaceData } from '../lib/business/workspace'
import { decideApproval, getOrganizationWorkflows, runWorkflowManual } from '../lib/business/workflows'

beforeEach(() => {
  businessStore.reset()
})

test('Business Context retrieval is tenant isolated', () => {
  const growthItems = searchBusinessContext({ organizationId: 'org-growth-labs', userId: 'user-sarah' })
  assert.ok(growthItems.length > 0)
  assert.equal(growthItems.every((item) => item.organizationId === 'org-growth-labs'), true)

  assert.throws(
    () => searchBusinessContext({ organizationId: 'org-saas-northstar', userId: 'user-sarah' }),
    /Tenant access denied/,
  )
})

test('industry profile changes agent behavior instructions', () => {
  const agency = getAgentIndustryInstructions('DIGITAL_MARKETING_AGENCY', 'LEAD_RESEARCH')
  const saas = getAgentIndustryInstructions('B2B_SAAS', 'LEAD_RESEARCH')

  assert.match(agency, /marketing maturity/i)
  assert.match(saas, /use case/i)
  assert.notEqual(agency, saas)
})

test('workflow manual run pauses at approval-required step', () => {
  const workflow = getOrganizationWorkflows('org-growth-labs', 'user-sarah').find((candidate) => candidate.agentType === 'LEAD_RESEARCH')
  assert.ok(workflow)

  const result = runWorkflowManual(workflow, 'user-sarah')
  assert.equal(result.run.organizationId, 'org-growth-labs')
  assert.equal(result.run.status, 'WAITING_FOR_APPROVAL')
  assert.ok(result.approval)
  assert.equal(result.approval?.status, 'PENDING')
  assert.equal(result.run.steps.some((step) => step.status === 'WAITING_FOR_APPROVAL'), true)
  assert.equal(result.auditEvents.some((event) => event.action === 'APPROVAL_REQUESTED'), true)
})

test('approval decision records approver and continuation result', () => {
  const workflow = getOrganizationWorkflows('org-growth-labs', 'user-sarah')[0]
  const result = runWorkflowManual(workflow, 'user-sarah')
  assert.ok(result.approval)

  const decided = decideApproval(result.approval, 'APPROVED', 'user-sarah')
  assert.equal(decided.status, 'APPROVED')
  assert.equal(decided.approverId, 'user-sarah')
  assert.match(decided.executionResult ?? '', /continue/i)
})

test('action risk classification blocks restricted and gates external actions', () => {
  assert.equal(classifyActionRisk('search company documents'), 'READ')
  assert.equal(classifyActionRisk('draft report'), 'DRAFT')
  assert.equal(classifyActionRisk('send client report'), 'APPROVAL_REQUIRED')
  assert.equal(classifyActionRisk('transfer money'), 'RESTRICTED')
})

test('agent structured output validates against registry schema', () => {
  const context = getBusinessContextPayload('org-growth-labs', 'user-sarah')
  const result = executeAgentMock(
    {
      organizationId: 'org-growth-labs',
      userId: 'user-sarah',
      workflowRunId: 'test-run',
      industryProfile: 'DIGITAL_MARKETING_AGENCY',
      permissions: ['business:read'],
      businessContext: context,
    },
    'EXECUTIVE_BRIEF',
  )

  assert.equal(validateAgentOutput('EXECUTIVE_BRIEF', result.output), true)
  assert.equal(result.finding.organizationId, 'org-growth-labs')
  assert.equal(result.finding.humanVerified, false)
  assert.ok(result.finding.expiresAt)
})

test('optimization opportunities connect spend recommendations to agents and workflows', () => {
  const opportunities = getOptimizationOpportunities('org-growth-labs', 'user-sarah')
  const leadOverlap = opportunities.find((opportunity) => opportunity.relatedAgentType === 'LEAD_RESEARCH')
  const reportingAutomation = opportunities.find((opportunity) => opportunity.relatedAgentType === 'WEEKLY_REPORT')

  assert.ok(leadOverlap)
  assert.equal(leadOverlap.type, 'TOOL_OVERLAP')
  assert.match(leadOverlap.recommendedCapability, /Lead Research/)
  assert.equal(leadOverlap.relatedWorkflowTemplateId, 'tpl-lead-research')

  assert.ok(reportingAutomation)
  assert.equal(reportingAutomation.type, 'AUTOMATION')
  assert.equal(reportingAutomation.estimatedHoursSaved, 36)
  assert.match(reportingAutomation.ctaHref, /weekly-report/)
})

test('workspace dashboard data exposes executive brief, grouped agents, and memory health', () => {
  const data = getBusinessWorkspaceData()
  const groups = new Set(data.agentSummaries.map((summary) => summary.group))

  assert.equal(data.executiveBriefItems.length, 3)
  assert.equal(data.agentSummaries.length, 5)
  assert.deepEqual(Array.from(groups).sort(), ['EXECUTIVE', 'INTELLIGENCE', 'REPORTING'])
  assert.ok(data.businessMemoryHealth)
  assert.equal(data.businessMemoryHealth?.companyKnowledgeScore, 86)
  assert.equal(data.recentActivity.some((activity) => activity.status === 'WAITING_APPROVAL'), true)
})

test('authenticated business context resolves active memberships only', () => {
  const ctx = resolveBusinessMembership({
    userId: 'user-sarah',
    organizationId: 'org-growth-labs',
    members: businessStore.members,
  })
  assert.equal(ctx.organizationId, 'org-growth-labs')
  assert.equal(ctx.role, 'OWNER')

  assert.throws(() => resolveBusinessMembership({ members: businessStore.members }), /Authentication required/)
  assert.throws(
    () => resolveBusinessMembership({ userId: 'user-sarah', organizationId: 'org-rival-labs', members: businessStore.members }),
    /not available/,
  )
})

test('tenant isolation blocks cross-organization reads and direct ID guessing', () => {
  const actorA = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const actorB = { organizationId: 'org-rival-labs', userId: 'user-bri' }

  const bContext = searchBusinessContext({ ...actorB })[0]
  const bWorkflow = getWorkflows(actorB)[0]
  const bRun = getRuns(actorB)[0]
  const bApproval = getPendingApprovals(actorB)[0]
  const bFinding = getAgentFindings(actorB)[0]
  const bTool = getAIStack(actorB)[0]
  const bRecommendation = getRecommendations(actorB)[0]
  const bAudit = getAuditLog(actorB)[0]

  assert.throws(() => getBusinessContextItem(actorA, bContext.id), /not found/i)
  assert.equal(getWorkflows(actorA).some((workflow) => workflow.id === bWorkflow.id), false)
  assert.equal(getRuns(actorA).some((run) => run.id === bRun.id), false)
  assert.equal(getPendingApprovals(actorA).some((approval) => approval.id === bApproval.id), false)
  assert.equal(getAgentFindings(actorA).some((finding) => finding.id === bFinding.id), false)
  assert.equal(getAIStack(actorA).some((tool) => tool.id === bTool.id), false)
  assert.equal(getRecommendations(actorA).some((recommendation) => recommendation.id === bRecommendation.id), false)
  assert.equal(getAuditLog(actorA).some((event) => event.id === bAudit?.id), false)
  assert.throws(() => runWorkflow(actorA, bWorkflow.id), /Workflow not found/)
  assert.throws(() => approveAction(actorA, bApproval.id), /Approval not found/)
  assert.throws(() => archiveBusinessContextItem(actorA, bContext.id), /not found/i)
})

test('member role cannot write Business Memory while owner can', () => {
  businessStore.members.push({
    id: 'mem-member-growth',
    organizationId: 'org-growth-labs',
    userId: 'user-omar',
    role: 'MEMBER',
    permissions: [],
    status: 'ACTIVE',
  })

  assert.throws(
    () => createContext(
      { organizationId: 'org-growth-labs', userId: 'user-omar' },
      {
        domain: 'COMPANY_KNOWLEDGE',
        category: 'PRODUCT',
        title: 'Member-created context',
        content: 'Should not write.',
        source: 'Test',
        provenance: 'Test',
      },
    ),
    /Permission denied/,
  )

  const item = createContext(
    { organizationId: 'org-growth-labs', userId: 'user-sarah' },
    {
      domain: 'COMPANY_KNOWLEDGE',
      category: 'PRODUCT',
      title: 'Owner-created context',
      content: 'Persists in the organization memory.',
      source: 'Test',
      provenance: 'Test',
    },
  )
  assert.equal(item.organizationId, 'org-growth-labs')
})

test('persistent approval lifecycle blocks unauthorized users and writes audit', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'LEAD_RESEARCH')
  assert.ok(workflow)

  const result = runWorkflow(actor, workflow.id)
  assert.equal(result.run.status, 'WAITING_FOR_APPROVAL')
  assert.ok(result.approval)
  assert.equal(businessStore.getApprovals(actor).some((approval) => approval.id === result.approval?.id), true)

  assert.throws(() => approveAction({ organizationId: 'org-rival-labs', userId: 'user-bri' }, result.approval!.id), /Approval not found/)

  const approved = approveAction(actor, result.approval.id)
  assert.equal(approved.status, 'APPROVED')
  assert.equal(businessStore.getRuns(actor).find((run) => run.id === result.run.id)?.status, 'COMPLETED')
  assert.equal(businessStore.getAuditEvents(actor).some((event) => event.action === 'APPROVAL_APPROVED'), true)
})

test('approval rejection persists failed workflow state', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'LEAD_RESEARCH')
  assert.ok(workflow)

  const result = runWorkflow(actor, workflow.id)
  assert.ok(result.approval)
  const rejected = rejectAction(actor, result.approval.id)
  assert.equal(rejected.status, 'REJECTED')
  assert.equal(businessStore.getRuns(actor).find((run) => run.id === result.run.id)?.status, 'FAILED')
})

test('workflow run persists and can be reloaded after store handoff', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'LEAD_RESEARCH')
  assert.ok(workflow)

  const result = runWorkflow(actor, workflow.id, 'manual-idempotency-key')
  const snapshot = businessStore
  const reloaded = snapshot.getRuns(actor).find((run) => run.id === result.run.id)

  assert.ok(reloaded)
  assert.equal(reloaded.idempotencyKey, 'manual-idempotency-key')
  assert.equal(reloaded.steps.length > 0, true)
  const duplicate = runWorkflow(actor, workflow.id, 'manual-idempotency-key')
  assert.equal(duplicate.run.id, result.run.id)
})

test('Business Memory carries findings across agents', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const competitorWorkflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'COMPETITOR_MONITOR')
  assert.ok(competitorWorkflow)

  const result = runWorkflow(actor, competitorWorkflow.id)
  assert.equal(result.run.status, 'COMPLETED')
  assert.ok(result.finding)

  const weeklyContext = getBusinessContextPayload(actor.organizationId, actor.userId)
  assert.equal(weeklyContext.aiOperationalMemory.some((item) => item.title === result.finding?.title), true)

  const executive = executeAgentMock(
    {
      organizationId: actor.organizationId,
      userId: actor.userId,
      workflowRunId: 'exec-memory-test',
      industryProfile: 'DIGITAL_MARKETING_AGENCY',
      permissions: ['business:read'],
      businessContext: weeklyContext,
    },
    'EXECUTIVE_BRIEF',
  )
  assert.equal(validateAgentOutput('EXECUTIVE_BRIEF', executive.output), true)
})

test('RLS migration contains organization-scoped policies for private tables', () => {
  const sql = readFileSync('supabase/migrations/202608230001_aibeat_business_foundation.sql', 'utf8')
  for (const table of ['business_context_items', 'workflows', 'workflow_runs', 'approvals', 'agent_findings', 'ai_tool_subscriptions', 'ai_recommendations', 'audit_events']) {
    assert.match(sql, new RegExp(`'${table}'`))
  }
  assert.match(sql, /create policy "%1\$s member read"/)
  assert.match(sql, /create policy "%1\$s admin write"/)
  assert.match(sql, /is_org_member\(organization_id\)/)
  assert.match(sql, /has_org_role\(organization_id/)
})
