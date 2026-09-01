export type AIBeatAssistantIntent = 'PRODUCT_HELP' | 'WORKFLOW_DISCOVERY' | 'WORKFLOW_PREPARE' | 'BUSINESS_MEMORY_HELP' | 'INTEGRATION_HELP' | 'APPROVAL_HELP' | 'REPORT_HELP' | 'AI_STACK_HELP' | 'GENERAL_BUSINESS_GUIDANCE'
export interface AIBeatAssistantSuggestion { label: string; href?: string; intent?: string; workflowId?: string; workflowInput?: Record<string, unknown> }
export interface AIBeatAssistantUsage { provider: string; model: string; tokensIn: number; tokensOut: number; latencyMs: number }
export interface AIBeatAssistantResponse { message: string; intent: AIBeatAssistantIntent; suggestions: AIBeatAssistantSuggestion[]; missingContext: string[]; usage: AIBeatAssistantUsage }
export interface AIBeatAssistantMessage { role: 'USER' | 'ASSISTANT'; content: string }
export interface AIBeatAssistantContext {
  organizationId: string; organizationName: string; industry: string; employeeCount: number
  memoryCategories: string[]; memoryExcerpts: string[]; workflows: Array<{ id: string; name: string; status: string; inputs: string[] }>
  recentRuns: Array<{ workflowId: string; status: string }>; pendingApprovals: number
  integrations: Array<{ name: string; status: string }>; ai: { mode: string; provider: string; model: string }
}
