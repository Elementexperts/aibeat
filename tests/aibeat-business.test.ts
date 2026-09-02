import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test, { beforeEach } from 'node:test'
import { executeAgentMock, validateAgentOutput } from '../lib/business/agents'
import { getOptimizationOpportunities } from '../lib/business/ai-spend'
import { archiveBusinessContextItem, getBusinessContextItem, getBusinessContextPayload, searchBusinessContext } from '../lib/business/context'
import { getAgentIndustryInstructions } from '../lib/business/industry-profiles'
import { approveAction, createContext, rejectAction, runWorkflow } from '../lib/business/mutations'
import { getAgentFindings, getAIStack, getAuditLog, getPendingApprovals, getRecommendations, getRuns, getWorkflows } from '../lib/business/read-services'
import { computeNextRunAt, runSchedulerTick, upsertWorkflowSchedule } from '../lib/business/scheduler'
import { classifyActionRisk } from '../lib/business/security'
import { resolveBusinessMembership } from '../lib/business/auth'
import { isAuthenticatedBusinessPath, isPrivateBusinessPath, isPublicBusinessPath, sanitizeBusinessNext } from '../lib/business/routes'
import { businessStore } from '../lib/business/store'
import { getBusinessWorkspaceData } from '../lib/business/workspace'
import { decideApproval, getOrganizationWorkflows, runWorkflowManual } from '../lib/business/workflows'
import { isLeadResearchOutput, normalizeLeadUrl, validateWorkflowInput } from '../lib/business/lead-research'
import { getBusinessAIMode, getModelRouter, MockModelRouter } from '../lib/business/model-router'
import { mapGeminiUsage } from '../lib/business/model-providers/gemini'
import { askAIBeat } from '../lib/business/assistant/assistant'
import { buildAssistantPrompt } from '../lib/business/assistant/prompt'
import { AIBEAT_ALLOWED_ROUTES, AIBEAT_ALLOWED_WORKFLOW_IDS } from '../lib/business/assistant/product-guide'
import { sanitizeAssistantSuggestion, validateAssistantMessage, validateAssistantResponse } from '../lib/business/assistant/validation'
import type { AIBeatAssistantContext } from '../lib/business/assistant/types'
import { buildWorkflowCatalog, getPreparedLeadResearchInput, validatePreparedLeadUrl } from '../lib/business/workflow-catalog'
import { workflowTemplates } from '../lib/business/demo-data'
import { DEFAULT_RUN_HISTORY_LIMIT, defaultRunHistory, groupLeadQualifications, isActiveWorkflowStatus, runProspectLabel, sortAndDedupeRuns } from '../lib/business/workflow-history'
import type { AgentFinding, WorkflowRun } from '../lib/business/types'

beforeEach(() => {
  businessStore.reset()
})

test('AIBeat Business AI mode defaults safely to mock', () => {
  assert.equal(getBusinessAIMode({}), 'mock')
  assert.equal(getBusinessAIMode({ AIBEAT_BUSINESS_AI_MODE: 'mock' }), 'mock')
})

const assistantContext: AIBeatAssistantContext = { organizationId: 'org-growth-labs', organizationName: 'Growth Labs', industry: 'DIGITAL_MARKETING_AGENCY', employeeCount: 42, memoryCategories: ['PRODUCT'], memoryExcerpts: ['AI workflow product'], workflows: [{ id: 'tpl-lead-research', name: 'Lead Research & Qualification', status: 'ACTIVE', inputs: ['leadUrl'] }], recentRuns: [], pendingApprovals: 1, integrations: [{ name: 'CRM', status: 'CONNECTED' }], ai: { mode: 'mock', provider: 'mock', model: 'deterministic' } }

test('Ask AIBeat mock mode makes no model-router request and recommends Lead Research', async () => {
  let called = false
  const result = await askAIBeat({ question: 'I want more leads', context: assistantContext, env: { AIBEAT_BUSINESS_AI_MODE: 'mock' }, routerFactory: async () => { called = true; throw new Error('must not run') } })
  assert.equal(called, false); assert.equal(result.usage.provider, 'mock'); assert.equal(result.suggestions.some((item) => item.workflowId === 'tpl-lead-research'), true)
})

test('Ask AIBeat mock Business Memory guidance points to organization context', async () => {
  const result = await askAIBeat({ question: 'Where do I add company information to Business Memory?', context: assistantContext, env: { AIBEAT_BUSINESS_AI_MODE: 'mock' } })
  assert.equal(result.intent, 'BUSINESS_MEMORY_HELP'); assert.equal(result.suggestions.some((item) => item.href === '/business/context'), true)
})

test('Ask AIBeat prepares but does not execute Lead Research', async () => {
  const result = await askAIBeat({ question: 'Research example.com', context: assistantContext, env: { AIBEAT_BUSINESS_AI_MODE: 'mock' } })
  assert.equal(result.intent, 'WORKFLOW_PREPARE'); assert.deepEqual(result.suggestions[0].workflowInput, { leadUrl: 'https://example.com/' })
  const source = readFileSync('app/business/actions.ts', 'utf8'); const assistantBody = source.slice(source.indexOf('askAIBeatAction'), source.indexOf('testBusinessAIConnectionAction'))
  assert.doesNotMatch(assistantBody, /runBusinessWorkflowAction|runWorkflow\(/)
})

test('dashboard and dedicated page share the authenticated Ask AIBeat implementation', () => {
  const dashboard = readFileSync('app/business/dashboard/page.tsx', 'utf8')
  const askPage = readFileSync('app/business/ask/page.tsx', 'utf8')
  const workspace = readFileSync('components/business/BusinessWorkspace.tsx', 'utf8')
  assert.match(dashboard, /onAskAIBeat=\{askAIBeatAction\}/)
  assert.match(askPage, /onAskAIBeat=\{askAIBeatAction\}/)
  assert.match(workspace, /<AskAIBeat variant="dashboard"/)
  assert.match(workspace, /route === 'ask' && <AskAIBeat/)
})

test('assistant accepts adjacent business guidance and live prompt encourages actionable depth', async () => {
  const result = await askAIBeat({ question: 'How should a small agency decide what to automate first?', context: assistantContext, env: { AIBEAT_BUSINESS_AI_MODE: 'mock' } })
  assert.equal(result.intent, 'GENERAL_BUSINESS_GUIDANCE')
  assert.match(result.message, /Business Memory/)
  assert.ok(result.suggestions.length >= 2)
  const prompt = buildAssistantPrompt('How can AIBeat help my agency grow?', assistantContext, [])
  assert.match(prompt, /250–700 words/)
  assert.match(prompt, /next 1–3 actions/)
  assert.doesNotMatch(prompt, /Keep advice concise and specific to AIBeat/)
})

test('contextual approval modal reuses decision action and supports explicit edited content', () => {
  const workspace = readFileSync('components/business/BusinessWorkspace.tsx', 'utf8')
  const modal = readFileSync('components/business/ApprovalModal.tsx', 'utf8')
  assert.match(workspace, /setSelectedApprovalId\(result\.approval\.id\)/)
  assert.match(workspace, /onDecideApproval\(approval\.id, decision, editedContent\)/)
  assert.doesNotMatch(workspace, /Edited by approver/)
  assert.match(modal, /role="dialog"/); assert.match(modal, /aria-modal="true"/); assert.match(modal, /event\.key === 'Escape'/)
  assert.match(modal, /value=\{content\}/); assert.match(modal, /'EDITED', content\.trim\(\)/)
  assert.match(modal, /Simulated action — no external/)
  assert.match(workspace, /Review approval/)
  assert.match(workspace, /Pending approvals/)
  assert.match(workspace, /setSelectedApprovalId\(null\)/)
})

test('standalone approval center remains available', () => {
  const page = readFileSync('app/business/approvals/page.tsx', 'utf8')
  const workspace = readFileSync('components/business/BusinessWorkspace.tsx', 'utf8')
  assert.match(page, /route="approvals"/)
  assert.match(workspace, /Approval Center/)
})

test('workflows page accepts and renders a prepared Lead Research suggestion without auto-running', () => {
  const pageSource = readFileSync('app/business/workflows/page.tsx', 'utf8'); const workspaceSource = readFileSync('components/business/BusinessWorkspace.tsx', 'utf8')
  assert.match(pageSource, /searchParams\.workflow === 'tpl-lead-research'/)
  assert.deepEqual(getPreparedLeadResearchInput({ workflowId: 'tpl-lead-research', input: { leadUrl: 'https://stripe.com/' } }), { leadUrl: 'https://stripe.com/' })
  assert.match(workspaceSource, /Recommended by Ask AIBeat/); assert.match(workspaceSource, /value=\{preparedLeadUrl\}/); assert.match(workspaceSource, /onRunWorkflow\('tpl-lead-research', \{ leadUrl: validation\.leadUrl \}\)/)
  assert.doesNotMatch(workspaceSource, /useEffect\([\s\S]{0,300}onRunWorkflow/)
})

test('prepared Lead Research URL remains editable and invalid input cannot run', () => {
  assert.deepEqual(validatePreparedLeadUrl('stripe.com'), { ok: true, leadUrl: 'https://stripe.com/' })
  assert.deepEqual(validatePreparedLeadUrl('example.com'), { ok: true, leadUrl: 'https://example.com/' })
  assert.equal(validatePreparedLeadUrl('file:///etc/passwd').ok, false)
  assert.equal(validatePreparedLeadUrl('not a url').ok, false)
})

function historyRun(id: string, startedAt: string, leadUrl = 'https://stripe.com/', status: WorkflowRun['status'] = 'COMPLETED'): WorkflowRun {
  return { id, organizationId: 'org-growth-labs', workflowId: 'lead-workflow', status, startedAt, completedAt: status === 'COMPLETED' ? startedAt : undefined, resultMetadata: { workflowInput: { leadUrl }, ai: { provider: 'mock', model: 'deterministic' } }, steps: [], resultSummary: 'Research completed.', idempotencyKey: id }
}

function qualification(id: string, createdAt: string, prospectUrl: string, company = 'Stripe', fitScore = 82): AgentFinding {
  return { id, organizationId: 'org-growth-labs', agentType: 'LEAD_RESEARCH', findingType: 'LEAD_QUALIFICATION', title: company, content: 'Qualification', structuredData: { company, fitScore, confidence: 0.74, provenance: { prospectUrl }, ai: { provider: 'mock', mode: 'mock' } }, source: 'AIBeat Business deterministic mock', sourceUrl: prospectUrl, confidence: 0.74, createdAt, workflowRunId: `run-${id}`, humanVerified: false, status: 'ACTIVE' }
}

test('workflow history sorts newest first, removes duplicate ids, and defaults to eight runs', () => {
  const runs = Array.from({ length: 10 }, (_, index) => historyRun(`run-${index}`, `2026-09-01T${String(index).padStart(2, '0')}:00:00.000Z`))
  const withDuplicate = [runs[0], ...runs, { ...runs[0], resultSummary: 'duplicate render candidate' }]
  const ordered = sortAndDedupeRuns(withDuplicate)
  assert.equal(ordered[0].id, 'run-9')
  assert.equal(ordered.filter((run) => run.id === 'run-0').length, 1)
  assert.equal(defaultRunHistory(withDuplicate).length, DEFAULT_RUN_HISTORY_LIMIT)
  assert.equal(defaultRunHistory(withDuplicate, true).length, 10)
})

test('lead qualification history groups normalized prospect URLs without collapsing other domains', () => {
  const findings = [
    qualification('stripe-old', '2026-09-01T10:00:00.000Z', 'https://www.stripe.com/'),
    qualification('stripe-new', '2026-09-01T11:00:00.000Z', 'stripe.com'),
    qualification('other', '2026-09-01T12:00:00.000Z', 'https://stripe.example/', 'Stripe Example'),
  ]
  const groups = groupLeadQualifications(findings, [])
  assert.equal(groups.length, 2)
  const stripe = groups.find((group) => group.key === 'url:stripe.com')
  assert.ok(stripe)
  assert.equal(stripe.latest.id, 'stripe-new')
  assert.deepEqual(stripe.history.map((finding) => finding.id), ['stripe-new', 'stripe-old'])
  assert.equal(groups.some((group) => group.key === 'url:stripe.example'), true)
})

test('a newly executed finding becomes the displayed latest qualification and increments history', () => {
  const old = qualification('old', '2026-09-01T10:00:00.000Z', 'stripe.com', 'Stripe', 70)
  const initial = groupLeadQualifications([old], [historyRun('run-old', old.createdAt)])[0]
  const newest = qualification('new', '2026-09-01T11:00:00.000Z', 'https://www.stripe.com/', 'Stripe', 91)
  const updated = groupLeadQualifications([newest, old], [historyRun('run-new', newest.createdAt), historyRun('run-old', old.createdAt)])[0]
  assert.equal(initial.latest.id, 'old')
  assert.equal(updated.latest.id, 'new')
  assert.equal(updated.history.length, 2)
})

test('run history uses the normalized prospect label and identifies mock results', () => {
  const run = historyRun('run-mock', '2026-09-01T10:00:00.000Z', 'https://www.stripe.com/')
  assert.equal(runProspectLabel(run), 'stripe.com')
  const source = readFileSync('components/business/BusinessWorkspace.tsx', 'utf8')
  assert.match(source, /Mock AI · Mock test result/)
  assert.match(source, /Show older runs/)
})

test('duplicate-run guard only treats active statuses as blocking', () => {
  assert.equal(isActiveWorkflowStatus('RUNNING'), true)
  assert.equal(isActiveWorkflowStatus('WAITING_FOR_APPROVAL'), true)
  assert.equal(isActiveWorkflowStatus('COMPLETED'), false)
  assert.equal(isActiveWorkflowStatus('FAILED'), false)
  const source = readFileSync('lib/business/supabase-store.ts', 'utf8')
  assert.match(source, /\.in\('status', \['RUNNING', 'WAITING_FOR_APPROVAL'\]\)/)
  assert.match(source, /contains\('result_metadata', \{ workflowInput: \{ leadUrl: workflowInput\.leadUrl \} \}\)/)
})

test('unknown workflow suggestions are ignored and direct workflow catalog retains all five templates', () => {
  assert.equal(getPreparedLeadResearchInput({ workflowId: 'unknown', input: { leadUrl: 'https://stripe.com/' } }), undefined)
  const catalog = buildWorkflowCatalog([], workflowTemplates)
  assert.deepEqual(catalog.map((workflow) => workflow.name), ['Lead Research & Qualification', 'Competitor / Market Monitoring', 'Marketing & Content Workflow', 'Weekly Business Reporting', 'Executive Daily Brief'])
  const existing = { ...workflowTemplates[0], id: 'existing-lead', templateId: 'tpl-lead-research', organizationId: 'org-growth-labs' }
  assert.equal(buildWorkflowCatalog([existing], workflowTemplates)[0].id, 'existing-lead')
})

test('template handoff reuses the existing workflow server action and submitted input', () => {
  const source = readFileSync('app/business/actions.ts', 'utf8')
  assert.match(source, /getOrCreateWorkflowFromTemplate\(actor, template\)/)
  assert.match(source, /store\.runWorkflow\(actor, executableWorkflowId, \{ input \}\)/)
})

test('assistant suggestions enforce source-controlled route and workflow allowlists', () => {
  assert.equal(AIBEAT_ALLOWED_ROUTES.has('/business/context'), true); assert.equal(AIBEAT_ALLOWED_WORKFLOW_IDS.has('tpl-lead-research'), true)
  assert.equal(sanitizeAssistantSuggestion({ label: 'Attack', href: 'javascript:alert(1)', workflowId: 'evil' }), undefined)
  assert.deepEqual(sanitizeAssistantSuggestion({ label: 'Memory', href: '/business/context' }), { label: 'Memory', href: '/business/context', workflowId: undefined, workflowInput: undefined, intent: undefined })
})

test('assistant validates message limits and structured responses', () => {
  assert.throws(() => validateAssistantMessage('x'.repeat(4001)), /4,000/)
  assert.throws(() => validateAssistantResponse({ message: '', intent: 'PRODUCT_HELP' }, { provider: 'mock', model: 'mock', tokensIn: 0, tokensOut: 0, latencyMs: 0 }), /malformed/)
  const valid = validateAssistantResponse({ message: 'Use Memory', intent: 'BUSINESS_MEMORY_HELP', suggestions: [{ label: 'Open', href: '/business/context' }], missingContext: [] }, { provider: 'mock', model: 'mock', tokensIn: 0, tokensOut: 0, latencyMs: 0 })
  assert.equal(valid.suggestions[0].href, '/business/context')
})

test('assistant context remains organization scoped and runtime status never serializes API keys', () => {
  const contextSource = readFileSync('lib/business/assistant/context.ts', 'utf8'); const runtimeSource = readFileSync('lib/business/ai-runtime.ts', 'utf8')
  assert.match(contextSource, /organizationId: actor\.organizationId/); assert.doesNotMatch(runtimeSource, /apiKey:/); assert.doesNotMatch(runtimeSource, /slice\(.+GEMINI_API_KEY/)
})

test('mock model router needs no Gemini key and returns valid deterministic Lead Research', async () => {
  const router = await getModelRouter({ AIBEAT_BUSINESS_AI_MODE: 'mock' })
  assert.equal(router instanceof MockModelRouter, true)
  const result = await router.extractStructured<unknown>('https://example.com', 'LEAD_RESEARCH')
  assert.equal(isLeadResearchOutput(result.data), true)
  assert.equal(result.usage.provider, 'mock')
  assert.equal(result.usage.tokensIn, 0)
})

test('Lead Research validation rejects malformed structured output', () => {
  assert.equal(isLeadResearchOutput({ leadName: 'x', company: 'y', fitScore: 101, confidence: 2, reasons: [], evidence: [], likelyNeeds: [], risks: [], recommendedNextAction: 'x', suggestedOutreachAngle: 'y' }), false)
  assert.equal(isLeadResearchOutput({}), false)
})

test('Lead Research workflow input requires and normalizes a public web URL', () => {
  assert.throws(() => validateWorkflowInput([{ key: 'leadUrl', required: true }], {}), /required/i)
  assert.equal(normalizeLeadUrl(' example.com '), 'https://example.com/')
  assert.throws(() => normalizeLeadUrl('file:///etc/passwd'), /http or https/i)
})

test('live Gemini mode without server key fails before client initialization', async () => {
  await assert.rejects(() => getModelRouter({ AIBEAT_BUSINESS_AI_MODE: 'live', AIBEAT_BUSINESS_AI_PROVIDER: 'gemini' }), /GEMINI_API_KEY/)
  await assert.rejects(() => getModelRouter({ AIBEAT_BUSINESS_AI_MODE: 'live', AIBEAT_BUSINESS_AI_PROVIDER: 'unsupported', GEMINI_API_KEY: 'not-used' }), /Unsupported live AI provider/)
})

test('Gemini usage mapping preserves real metadata and safely defaults missing counts', () => {
  assert.deepEqual(mapGeminiUsage(undefined, 'gemini-2.5-flash', 125, 'run-1'), { provider: 'gemini', model: 'gemini-2.5-flash', tokensIn: 0, tokensOut: 0, estimatedCostUsd: 0, latencyMs: 125, runId: 'run-1' })
  assert.equal(mapGeminiUsage({ promptTokenCount: 12, responseTokenCount: 7 }, 'model', 1, 'run').tokensOut, 7)
})

test('Lead Research implementation persists input and result before approval without a migration', () => {
  const source = readFileSync('lib/business/supabase-store.ts', 'utf8')
  assert.match(source, /result_metadata: \{ workflowInput \}/)
  assert.match(source, /step\.id === 'score-lead'[\s\S]*persistLeadResearchFinding/)
  assert.match(source, /finding && approval \? 'Research completed — next action requires approval\.'/)
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

test('pilot connector framework exposes OAuth lifecycle states for first three integrations', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const integrations = businessStore.getIntegrationSummaries(actor)

  assert.deepEqual(integrations.slice(0, 3).map((integration) => integration.id), ['google-workspace', 'crm', 'email-slack'])
  assert.equal(integrations.find((integration) => integration.id === 'google-workspace')?.status, 'CONNECTED')
  assert.equal(integrations.find((integration) => integration.id === 'crm')?.status, 'CONNECTED')
  assert.equal(integrations.find((integration) => integration.id === 'email-slack')?.status, 'TOKEN_EXPIRED')

  businessStore.disconnectIntegration(actor, 'crm')
  assert.equal(businessStore.getIntegrationSummaries(actor).find((integration) => integration.id === 'crm')?.status, 'DISCONNECTED')

  businessStore.connectIntegration(actor, 'crm')
  assert.equal(businessStore.getIntegrationSummaries(actor).find((integration) => integration.id === 'crm')?.status, 'CONNECTED')
})

test('workflow execution uses connector-backed runtime and blocks expired OAuth tools', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = businessStore.createWorkflow(actor, {
    name: 'CRM runtime smoke test',
    description: 'Read CRM and persist runtime finding.',
    agentType: 'LEAD_RESEARCH',
    trigger: 'MANUAL',
    inputs: [],
    steps: [
      { id: 'read-crm', name: 'Read CRM', description: 'Read connected CRM signals.', action: 'readContacts', risk: 'READ', connectorId: 'crm' },
    ],
    requiredIntegrations: ['crm'],
    approvalPolicy: { requiredForRisks: ['APPROVAL_REQUIRED'], approverRoles: ['OWNER', 'ADMIN'] },
    outputDefinition: {},
    status: 'ACTIVE',
    version: 1,
  })

  const completed = businessStore.runWorkflow(actor, workflow.id, { idempotencyKey: 'crm-runtime-ok' })
  assert.equal(completed.run.status, 'COMPLETED')
  assert.match(completed.run.resultSummary ?? '', /connector-backed/)
  assert.equal(completed.run.connectorExecutions?.[0]?.connectorId, 'crm')
  assert.equal(completed.finding?.findingType, 'workflow_runtime_output')

  businessStore.expireIntegrationToken(actor, 'crm')
  const failed = businessStore.runWorkflow(actor, workflow.id, { idempotencyKey: 'crm-runtime-expired' })
  assert.equal(failed.run.status, 'FAILED')
  assert.match(failed.run.resultSummary ?? '', /TOKEN_EXPIRED/)
})

test('document ingestion stores extracted chunks with source metadata and searchable vectors', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const result = businessStore.ingestDocument(actor, {
    title: 'Customer Success Playbook',
    fileName: 'customer-success-playbook.md',
    mimeType: 'text/markdown',
    source: 'Internal playbook',
    bytes: Buffer.from('Renewal risk playbook. Expansion accounts should receive quarterly executive business reviews with customer health scoring.'),
  })

  assert.equal(result.document.extractionStatus, 'INDEXED')
  assert.equal(result.chunks.length > 0, true)
  assert.equal(result.chunks[0].metadata.source, 'Internal playbook')
  assert.equal(result.chunks[0].embedding.length, 384)

  const matches = businessStore.retrieveBusinessMemory(actor, 'quarterly business review renewal risk', 3)
  assert.equal(matches.length > 0, true)
  assert.equal(matches[0].documentId, result.document.id)
  assert.equal(businessStore.getBusinessContextPayload(actor).companyKnowledge.some((item) => item.structuredData?.documentId === result.document.id), true)
})

test('scheduler computes timezone-aware next run and executes due workflows once', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'COMPETITOR_MONITOR')
  assert.ok(workflow)

  const nextRunAt = computeNextRunAt('Monday 08:00', 'Asia/Tashkent', new Date('2026-08-25T05:00:00.000Z'))
  assert.equal(nextRunAt, '2026-08-31T03:00:00.000Z')

  const trigger = upsertWorkflowSchedule(businessStore, actor, {
    workflowId: workflow.id,
    schedule: 'Weekdays 07:30',
    timezone: 'Asia/Tashkent',
    startFrom: new Date('2026-08-25T01:00:00.000Z'),
  })
  trigger.nextRunAt = '2026-08-25T02:30:00.000Z'

  const tick = runSchedulerTick(businessStore, actor, new Date('2026-08-25T02:31:00.000Z'))
  assert.equal(tick.completed, 1)
  assert.equal(tick.attempts[0].status, 'COMPLETED')
  assert.equal(businessStore.getRuns(actor).some((run) => run.scheduledTriggerId === trigger.id), true)
})

test('scheduler dead-letters failing recurring triggers after max retries', () => {
  const actor = { organizationId: 'org-growth-labs', userId: 'user-sarah' }
  const workflow = getOrganizationWorkflows(actor.organizationId, actor.userId).find((candidate) => candidate.agentType === 'LEAD_RESEARCH')
  assert.ok(workflow)

  const trigger = upsertWorkflowSchedule(businessStore, actor, {
    workflowId: workflow.id,
    schedule: 'Weekdays 07:30',
    timezone: 'UTC',
    maxRetries: 1,
  })
  businessStore.updateWorkflow(actor, workflow.id, { status: 'PAUSED' })
  trigger.nextRunAt = '2026-08-25T07:30:00.000Z'

  const tick = runSchedulerTick(businessStore, actor, new Date('2026-08-25T07:31:00.000Z'))
  assert.equal(tick.deadLettered, 1)
  assert.equal(trigger.status, 'DEAD_LETTERED')
  assert.match(trigger.deadLetterReason ?? '', /active workflows/i)
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

test('business memory migration adds storage-backed chunks and scheduler tables', () => {
  const sql = readFileSync('supabase/migrations/202608250001_business_memory_ingestion_scheduler.sql', 'utf8')
  assert.match(sql, /create table if not exists document_chunks/)
  assert.match(sql, /embedding vector\(384\)/)
  assert.match(sql, /business-documents/)
  assert.match(sql, /create table if not exists workflow_schedule_triggers/)
  assert.match(sql, /dead_letter_reason/)
  assert.match(sql, /timezone/)
})

test('connector runtime migration adds pilot integrations and token lifecycle fields', () => {
  const sql = readFileSync('supabase/migrations/202608250002_business_connector_runtime.sql', 'utf8')
  assert.match(sql, /access_token_expires_at/)
  assert.match(sql, /refresh_token_rotated_at/)
  assert.match(sql, /last_error/)
  assert.match(sql, /google-workspace/)
  assert.match(sql, /email-slack/)
  assert.match(sql, /pilot_priority/)
})

test('business route matrix marks public, onboarding, and private paths', () => {
  for (const path of ['/business', '/business/demo', '/business/pricing', '/business/ai-spend-calculator', '/business/sign-up', '/business/sign-in', '/business/forgot-password', '/business/reset-password', '/business/auth/callback']) {
    assert.equal(isPublicBusinessPath(path), true, `${path} should be public`)
  }

  assert.equal(isAuthenticatedBusinessPath('/business/onboarding'), true)
  for (const path of ['/business/dashboard', '/business/ask', '/business/workflows', '/business/workflows/wf-1', '/business/agents', '/business/context', '/business/ai-stack', '/business/recommendations', '/business/approvals', '/business/integrations', '/business/reports', '/business/audit', '/business/settings']) {
    assert.equal(isPrivateBusinessPath(path), true, `${path} should be private`)
  }
})

test('business safe next paths reject external and auth-loop redirects', () => {
  assert.equal(sanitizeBusinessNext('/business/dashboard?tab=approvals'), '/business/dashboard?tab=approvals')
  assert.equal(sanitizeBusinessNext('/business/workflows/wf-1'), '/business/workflows/wf-1')
  assert.equal(sanitizeBusinessNext('https://evil.example/business/dashboard'), '/business/dashboard')
  assert.equal(sanitizeBusinessNext('//evil.example/business/dashboard'), '/business/dashboard')
  assert.equal(sanitizeBusinessNext('/business/sign-in?next=/business/dashboard'), '/business/dashboard')
  assert.equal(sanitizeBusinessNext('/news'), '/business/dashboard')
})

test('sitemap excludes authenticated workspace routes and includes public business journey', () => {
  const source = readFileSync('app/sitemap.ts', 'utf8')
  for (const path of ['/business/demo', '/business/pricing', '/business/sign-up', '/business/sign-in', '/business/forgot-password']) {
    assert.match(source, new RegExp(`'${path}'`))
  }
  for (const path of ['/business/dashboard', '/business/ask', '/business/workflows', '/business/agents', '/business/context', '/business/ai-stack', '/business/recommendations', '/business/approvals', '/business/integrations', '/business/reports', '/business/audit', '/business/settings']) {
    assert.doesNotMatch(source, new RegExp(`'${path}'`))
  }
})

test('demo route renders explicit demo mode without authenticated mutating server actions', () => {
  const source = readFileSync('app/business/demo/page.tsx', 'utf8')
  assert.match(source, /mode="demo"/)
  assert.doesNotMatch(source, /runBusinessWorkflowAction/)
  assert.doesNotMatch(source, /decideBusinessApprovalAction/)
})

test('self-serve onboarding migration allows first owner without service role and avoids demo organization', () => {
  const sql = readFileSync('supabase/migrations/202608240001_business_self_serve_onboarding.sql', 'utf8')
  const actionSource = readFileSync('app/business/onboarding/actions.ts', 'utf8')

  assert.match(sql, /organizations authenticated create own/)
  assert.match(sql, /organization_members first owner insert/)
  assert.match(sql, /organization_has_no_members/)
  assert.doesNotMatch(actionSource, /org-growth-labs/)
  assert.match(actionSource, /create_business_organization/)
})
