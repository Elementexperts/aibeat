import assert from 'node:assert/strict'
import test from 'node:test'
import { executeAgentMock, validateAgentOutput } from '../lib/business/agents'
import { getBusinessContextPayload, searchBusinessContext } from '../lib/business/context'
import { getAgentIndustryInstructions } from '../lib/business/industry-profiles'
import { classifyActionRisk } from '../lib/business/security'
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
