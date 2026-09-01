import type { AgentFinding, WorkflowRun } from './types'

export const DEFAULT_RUN_HISTORY_LIMIT = 8

export interface QualificationHistoryGroup {
  key: string
  prospectLabel: string
  latest: AgentFinding
  history: AgentFinding[]
}

function timestamp(value?: string) {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isNaN(parsed) ? 0 : parsed
}

export function sortAndDedupeRuns(runs: WorkflowRun[]) {
  const unique = new Map<string, WorkflowRun>()
  for (const run of runs) if (!unique.has(run.id)) unique.set(run.id, run)
  return Array.from(unique.values()).sort((left, right) => timestamp(right.startedAt) - timestamp(left.startedAt))
}

export function defaultRunHistory(runs: WorkflowRun[], expanded = false) {
  const ordered = sortAndDedupeRuns(runs)
  return expanded ? ordered : ordered.slice(0, DEFAULT_RUN_HISTORY_LIMIT)
}

export function normalizeProspectUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`)
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    return hostname ? `${hostname}${url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '').toLowerCase()}` : undefined
  } catch {
    return undefined
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

export function runProspectUrl(run?: WorkflowRun) {
  const metadata = record(run?.resultMetadata)
  const input = record(metadata?.workflowInput)
  return normalizeProspectUrl(input?.leadUrl ?? record(metadata?.ai)?.prospectUrl)
}

export function runProspectLabel(run: WorkflowRun) {
  return runProspectUrl(run) ?? run.resultSummary ?? run.id
}

function findingProspectUrl(finding: AgentFinding, run?: WorkflowRun) {
  const data = record(finding.structuredData)
  const provenance = record(data?.provenance)
  return normalizeProspectUrl(provenance?.prospectUrl ?? provenance?.finalUrl ?? finding.sourceUrl) ?? runProspectUrl(run)
}

function companyFallback(finding: AgentFinding) {
  const company = record(finding.structuredData)?.company
  const value = typeof company === 'string' && company.trim() ? company : finding.title
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ')
}

export function groupLeadQualifications(findings: AgentFinding[], runs: WorkflowRun[]): QualificationHistoryGroup[] {
  const runById = new Map(runs.map((run) => [run.id, run]))
  const unique = new Map<string, AgentFinding>()
  for (const finding of findings) {
    if (finding.agentType === 'LEAD_RESEARCH' && !unique.has(finding.id)) unique.set(finding.id, finding)
  }
  const ordered = Array.from(unique.values()).sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))
  const groups = new Map<string, QualificationHistoryGroup>()
  for (const finding of ordered) {
    const url = findingProspectUrl(finding, finding.workflowRunId ? runById.get(finding.workflowRunId) : undefined)
    const key = url ? `url:${url}` : `company:${companyFallback(finding)}`
    const existing = groups.get(key)
    if (existing) existing.history.push(finding)
    else groups.set(key, { key, prospectLabel: url ?? String(record(finding.structuredData)?.company ?? finding.title), latest: finding, history: [finding] })
  }
  return Array.from(groups.values())
}

export function isActiveWorkflowStatus(status: WorkflowRun['status']) {
  return status === 'RUNNING' || status === 'WAITING_FOR_APPROVAL'
}
