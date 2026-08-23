import assert from 'node:assert/strict'
import test from 'node:test'
import { executeAgentMock, validateAgentOutput } from '../lib/business/agents'
import { getOptimizationOpportunities } from '../lib/business/ai-spend'
import { getBusinessContextPayload, searchBusinessContext } from '../lib/business/context'
import { getAgentIndustryInstructions } from '../lib/business/industry-profiles'
import { classifyActionRisk } from '../lib/business/security'
import { getBusinessWorkspaceData } from '../lib/business/workspace'
import { decideApproval, getOrganizationWorkflows, runWorkflowManual } from '../lib/business/workflows'

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
  assert.equal(result.auditEvents.some((event) => event.result === 'BLOCKED'), true)
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
