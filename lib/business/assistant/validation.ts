import { normalizeLeadUrl } from '../lead-research'
import { AIBEAT_ALLOWED_ROUTES, AIBEAT_ALLOWED_WORKFLOW_IDS } from './product-guide'
import type { AIBeatAssistantIntent, AIBeatAssistantResponse, AIBeatAssistantSuggestion } from './types'

export const MAX_ASSISTANT_MESSAGE_LENGTH = 4000
const intents = new Set<AIBeatAssistantIntent>(['PRODUCT_HELP','WORKFLOW_DISCOVERY','WORKFLOW_PREPARE','BUSINESS_MEMORY_HELP','INTEGRATION_HELP','APPROVAL_HELP','REPORT_HELP','AI_STACK_HELP','GENERAL_BUSINESS_GUIDANCE'])
export function validateAssistantMessage(value: unknown) { const message = typeof value === 'string' ? value.trim() : ''; if (!message) throw new Error('Enter a question for AIBeat.'); if (message.length > MAX_ASSISTANT_MESSAGE_LENGTH) throw new Error('Questions must be 4,000 characters or fewer.'); return message }
export function sanitizeAssistantSuggestion(value: unknown): AIBeatAssistantSuggestion | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>; const label = typeof item.label === 'string' ? item.label.trim().slice(0, 80) : ''
  if (!label) return undefined
  const href = typeof item.href === 'string' && AIBEAT_ALLOWED_ROUTES.has(item.href) ? item.href : undefined
  const workflowId = typeof item.workflowId === 'string' && AIBEAT_ALLOWED_WORKFLOW_IDS.has(item.workflowId) ? item.workflowId : undefined
  let workflowInput: Record<string, unknown> | undefined
  if (workflowId === 'tpl-lead-research' && item.workflowInput && typeof item.workflowInput === 'object') { try { workflowInput = { leadUrl: normalizeLeadUrl((item.workflowInput as Record<string, unknown>).leadUrl) } } catch { workflowInput = undefined } }
  if (!href && !workflowId) return undefined
  return { label, href, workflowId, workflowInput, intent: typeof item.intent === 'string' ? item.intent.slice(0, 80) : undefined }
}
export function validateAssistantResponse(value: unknown, usage: AIBeatAssistantResponse['usage']): AIBeatAssistantResponse {
  if (!value || typeof value !== 'object') throw new Error('AIBeat returned a malformed assistant response.')
  const item = value as Record<string, unknown>; const message = typeof item.message === 'string' ? item.message.trim() : ''; const intent = item.intent as AIBeatAssistantIntent
  if (!message || !intents.has(intent)) throw new Error('AIBeat returned a malformed assistant response.')
  return { message: message.slice(0, 6000), intent, suggestions: (Array.isArray(item.suggestions) ? item.suggestions : []).map(sanitizeAssistantSuggestion).filter((entry): entry is AIBeatAssistantSuggestion => Boolean(entry)).slice(0, 4), missingContext: (Array.isArray(item.missingContext) ? item.missingContext : []).filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.slice(0, 120)).slice(0, 6), usage }
}
