import type { AgentEvaluationResult, AgentFinding, AgentType, BusinessContextPayload, WorkflowRun } from './types'

export function evaluateAgentFinding(params: {
  organizationId: string
  agentType: AgentType
  finding: AgentFinding
  context: BusinessContextPayload
  priorFindings: AgentFinding[]
  run?: WorkflowRun
  now?: string
}): AgentEvaluationResult {
  const content = params.finding.content
  const contextTerms = [
    ...params.context.companyKnowledge,
    ...params.context.operationalContext,
    ...params.context.aiOperationalMemory,
  ].flatMap((item) => tokenize(`${item.title} ${item.content}`))
  const contentTerms = tokenize(content)
  const evidenceMatches = contentTerms.filter((term) => contextTerms.includes(term)).length
  const factuality = clampScore(contentTerms.length ? evidenceMatches / Math.max(8, contentTerms.length) : 0.5, 0.35, 0.96)
  const relevance = clampScore(overlap(tokenize(params.agentType.replace('_', ' ')), contentTerms) + overlap(['workflow', 'approval', 'business', 'memory'], contentTerms), 0.4, 0.98)
  const duplicateRate = calculateDuplicateRate(params.finding, params.priorFindings)
  const editRate = estimateEditRate(params.run)
  const estimatedCostUsd = Number(((content.length / 4000) * 0.01 + (params.run?.steps.length ?? 1) * 0.002).toFixed(4))
  const latencyMs = 600 + (params.run?.steps.length ?? 1) * 180 + Math.min(2500, content.length * 2)
  const notes = [
    `Factuality based on overlap with tenant context: ${Math.round(factuality * 100)}%.`,
    `Duplicate similarity against prior findings: ${Math.round(duplicateRate * 100)}%.`,
    `Estimated edit rate from approval outcome: ${Math.round(editRate * 100)}%.`,
  ]

  return {
    id: `eval-${params.finding.id}`,
    organizationId: params.organizationId,
    agentType: params.agentType,
    workflowRunId: params.finding.workflowRunId,
    findingId: params.finding.id,
    factuality,
    relevance,
    duplicateRate,
    editRate,
    estimatedCostUsd,
    latencyMs,
    passed: factuality >= 0.45 && relevance >= 0.45 && duplicateRate <= 0.72 && editRate <= 0.55,
    notes,
    createdAt: params.now ?? new Date().toISOString(),
  }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((term) => term.length > 3)
}

function overlap(source: string[], target: string[]): number {
  if (!source.length) return 0
  const targetSet = new Set(target)
  return source.filter((term) => targetSet.has(term)).length / source.length
}

function calculateDuplicateRate(finding: AgentFinding, priorFindings: AgentFinding[]): number {
  const current = new Set(tokenize(finding.content))
  if (!current.size) return 0
  return priorFindings
    .filter((candidate) => candidate.id !== finding.id && candidate.agentType === finding.agentType)
    .reduce((max, candidate) => Math.max(max, overlap(Array.from(current), tokenize(candidate.content))), 0)
}

function estimateEditRate(run?: WorkflowRun): number {
  if (!run) return 0.15
  const edited = run.resultSummary?.toLowerCase().includes('edited') || run.steps.some((step) => step.outputSummary?.toLowerCase().includes('edit'))
  const failed = run.status === 'FAILED'
  if (failed) return 0.8
  return edited ? 0.45 : 0.12
}

function clampScore(value: number, min: number, max: number): number {
  return Number(Math.max(min, Math.min(max, value)).toFixed(2))
}
