import { normalizeLeadUrl } from './lead-research'
import type { WorkflowDefinition } from './types'

export function buildWorkflowCatalog(workflows: WorkflowDefinition[], templates: WorkflowDefinition[]): WorkflowDefinition[] {
  const catalog = templates.map((template) => workflows.find((workflow) => workflow.templateId === template.id || workflow.id === template.id) ?? template)
  const knownIds = new Set(catalog.map((workflow) => workflow.id))
  return [...catalog, ...workflows.filter((workflow) => !knownIds.has(workflow.id) && !catalog.some((item) => item.templateId && item.templateId === workflow.templateId))]
}

export function getPreparedLeadResearchInput(suggestion?: { workflowId: string; input: Record<string, string> }) {
  if (suggestion?.workflowId !== 'tpl-lead-research') return undefined
  return { leadUrl: suggestion.input.leadUrl ?? '' }
}

export function validatePreparedLeadUrl(value: string): { ok: true; leadUrl: string } | { ok: false; error: string } {
  try { return { ok: true, leadUrl: normalizeLeadUrl(value) } } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Enter a valid prospect website URL.' } }
}
