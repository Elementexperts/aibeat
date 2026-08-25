export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER'
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED'

export type IndustryProfile =
  | 'DIGITAL_MARKETING_AGENCY'
  | 'B2B_LEAD_GEN_AGENCY'
  | 'SEO_CONTENT_AGENCY'
  | 'B2B_SAAS'
  | 'CONSULTING'

export type AgentType =
  | 'LEAD_RESEARCH'
  | 'COMPETITOR_MONITOR'
  | 'MARKETING_CONTENT'
  | 'WEEKLY_REPORT'
  | 'EXECUTIVE_BRIEF'

export type ActionRisk = 'READ' | 'DRAFT' | 'APPROVAL_REQUIRED' | 'RESTRICTED'
export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type WorkflowRunStatus = 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type WorkflowStepStatus = 'PENDING' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED'
export type FindingStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'EXPIRED' | 'REJECTED'
export type ConnectorCapability = 'READ' | 'CREATE' | 'WRITE' | 'DELETE'
export type ConnectorAuthType = 'OAUTH2' | 'API_KEY' | 'MANUAL' | 'NONE'
export type IntegrationConnectionStatus = 'NOT_CONNECTED' | 'OAUTH_REQUIRED' | 'CONNECTED' | 'TOKEN_EXPIRED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED' | 'ERROR'
export type AIRecommendationType = 'KEEP' | 'CANCEL' | 'CONSOLIDATE' | 'REVIEW' | 'REPLACE' | 'AUTOMATE_WITH_AIBEAT'
export type ExecutiveBriefItemType = 'OPPORTUNITY' | 'RISK' | 'DECISION' | 'APPROVAL' | 'WORKFLOW'
export type OptimizationOpportunityType = 'TOOL_OVERLAP' | 'LOW_UTILIZATION' | 'AUTOMATION' | 'GOVERNANCE'
export type BusinessActivityStatus = 'SUCCESS' | 'NEEDS_ATTENTION' | 'WAITING_APPROVAL' | 'FAILED' | 'SCHEDULED'
export type AgentTeamGroup = 'INTELLIGENCE' | 'REPORTING' | 'EXECUTIVE'
export type BusinessDocumentStatus = 'UPLOADED' | 'EXTRACTED' | 'INDEXED' | 'FAILED' | 'ARCHIVED'
export type BusinessDocumentChunkStatus = 'ACTIVE' | 'ARCHIVED'
export type SchedulerTriggerStatus = 'ACTIVE' | 'PAUSED' | 'DEAD_LETTERED'
export type SchedulerRunStatus = 'LEASED' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTERED'
export type BusinessNotificationType = 'APPROVAL_REQUESTED' | 'WORKFLOW_FAILED' | 'PRIORITY_WORKFLOW_COMPLETED'
export type BusinessNotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

export interface Organization {
  id: string
  name: string
  employeeCount: number
  primaryProfile: IndustryProfile
  secondaryProfiles: IndustryProfile[]
  createdAt: string
  timezone?: string
}

export interface User {
  id: string
  email: string
  name: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: Role
  permissions: string[]
  status?: MembershipStatus
  createdAt?: string
  updatedAt?: string
  invitedEmail?: string
  invitedBy?: string
}

export interface BusinessNotification {
  id: string
  organizationId: string
  userId?: string
  type: BusinessNotificationType
  status: BusinessNotificationStatus
  title: string
  body: string
  href?: string
  workflowId?: string
  workflowRunId?: string
  approvalId?: string
  createdAt: string
  readAt?: string
}

export type BusinessContextDomain = 'COMPANY_KNOWLEDGE' | 'OPERATIONAL_CONTEXT' | 'PEOPLE_ACCESS' | 'AI_OPERATIONAL_MEMORY'

export type BusinessContextCategory =
  | 'PRODUCT'
  | 'SERVICE'
  | 'MARKET'
  | 'COMPETITOR'
  | 'SUPPLIER'
  | 'SOP'
  | 'POLICY'
  | 'DOCUMENT'
  | 'CONTRACT'
  | 'COMPANY_GOAL'
  | 'BRAND_VOICE'
  | 'ICP'
  | 'CUSTOMER'
  | 'CRM_DATA'
  | 'LEAD'
  | 'PROJECT'
  | 'TASK'
  | 'CAMPAIGN'
  | 'CALENDAR'
  | 'ANALYTICS'
  | 'CLIENT_ACCOUNT'
  | 'OPPORTUNITY'
  | 'EMPLOYEE'
  | 'DEPARTMENT'
  | 'ROLE'
  | 'PERMISSION'
  | 'WORKSPACE_MEMBERSHIP'
  | 'AGENT_ACCESS_RULE'
  | 'AI_ACTION'
  | 'AI_RECOMMENDATION'
  | 'WORKFLOW_RUN'
  | 'AGENT_FINDING'
  | 'GENERATED_REPORT'
  | 'HUMAN_CORRECTION'
  | 'APPROVAL'
  | 'REJECTION'
  | 'OUTCOME'

export interface BusinessContextItem {
  id: string
  organizationId: string
  domain: BusinessContextDomain
  category: BusinessContextCategory
  title: string
  content: string
  structuredData?: Record<string, unknown>
  source: string
  sourceType?: string
  sourceUrl?: string
  sourceDate?: string
  confidence?: number
  createdAt: string
  updatedAt?: string
  expiresAt?: string
  freshUntil?: string
  relatedEntityType?: string
  relatedEntityId?: string
  humanVerified: boolean
  provenance: string
  status?: 'ACTIVE' | 'ARCHIVED'
  createdBy?: string
}

export interface BusinessContextPayload {
  organizationId: string
  companyKnowledge: BusinessContextItem[]
  operationalContext: BusinessContextItem[]
  peopleAndAccess: BusinessContextItem[]
  aiOperationalMemory: BusinessContextItem[]
  retrievedChunks?: BusinessDocumentChunk[]
}

export interface BusinessDocument {
  id: string
  organizationId: string
  title: string
  documentType: string
  source: string
  sourceUrl?: string
  storageBucket?: string
  storagePath?: string
  byteSize?: number
  checksum?: string
  extractionStatus: BusinessDocumentStatus
  extractedText?: string
  metadata: Record<string, unknown>
  createdBy?: string
  createdAt: string
  updatedAt?: string
}

export interface BusinessDocumentChunk {
  id: string
  organizationId: string
  documentId: string
  chunkIndex: number
  title: string
  content: string
  tokenEstimate: number
  embedding: number[]
  metadata: {
    source: string
    sourceUrl?: string
    documentType: string
    documentTitle: string
    chunkIndex: number
    checksum?: string
    storagePath?: string
    [key: string]: unknown
  }
  similarity?: number
  lexicalScore?: number
  status: BusinessDocumentChunkStatus
  createdAt: string
  updatedAt?: string
}

export interface BusinessDocumentIngestionResult {
  document: BusinessDocument
  chunks: BusinessDocumentChunk[]
  contextItem: BusinessContextItem
}

export interface AgentFinding {
  id: string
  organizationId: string
  agentType: AgentType
  findingType: string
  title: string
  content: string
  structuredData?: Record<string, unknown>
  source: string
  sourceUrl?: string
  sourceDate?: string
  confidence: number
  createdAt: string
  updatedAt?: string
  expiresAt?: string
  freshUntil?: string
  relatedEntityType?: string
  relatedEntityId?: string
  workflowRunId?: string
  humanVerified: boolean
  status: FindingStatus
}

export interface AgentExecutionContext {
  organizationId: string
  userId?: string
  workflowRunId: string
  industryProfile: IndustryProfile
  permissions: string[]
  businessContext: BusinessContextPayload
}

export interface AgentDefinition {
  type: AgentType
  name: string
  description: string
  responsibilities: string[]
  defaultRisk: ActionRisk
  outputSchema: Record<string, string>
}

export interface WorkflowStepDefinition {
  id: string
  name: string
  description: string
  action: string
  risk: ActionRisk
  connectorId?: string
}

export interface IntegrationDefinition {
  id: string
  name: string
  category: 'GOOGLE_WORKSPACE' | 'CRM' | 'EMAIL_COLLABORATION' | 'ANALYTICS' | 'DOCUMENTS' | 'WEB_RESEARCH' | 'NOTIFICATIONS'
  authType: ConnectorAuthType
  capabilities: ConnectorCapability[]
  pilotPriority: number
  oauthScopes?: string[]
  description: string
}

export interface IntegrationConnection {
  id: string
  organizationId: string
  integrationId: string
  status: IntegrationConnectionStatus
  encryptedSecretRef?: string
  accessTokenExpiresAt?: string
  refreshTokenRotatedAt?: string
  lastConnectedAt?: string
  lastHealthCheckAt?: string
  lastError?: string
  reconnectUrl?: string
  metadata: Record<string, unknown>
  createdBy?: string
  createdAt: string
  updatedAt?: string
}

export interface ConnectorExecutionRecord {
  connectorId: string
  action: string
  ok: boolean
  summary: string
  error?: string
  risk: ActionRisk
}

export interface ApprovalPolicy {
  requiredForRisks: ActionRisk[]
  approverRoles: Role[]
}

export interface WorkflowDefinition {
  id: string
  organizationId: string
  templateId?: string
  name: string
  description: string
  agentType: AgentType
  trigger: 'MANUAL' | 'SCHEDULED'
  schedule?: string
  timezone?: string
  nextRunAt?: string
  inputs: Array<{ key: string; label: string; required: boolean }>
  steps: WorkflowStepDefinition[]
  requiredIntegrations: string[]
  approvalPolicy: ApprovalPolicy
  outputDefinition: Record<string, string>
  status: WorkflowStatus
  version: number
  idempotencyKey?: string
}

export interface WorkflowRunStep {
  id: string
  workflowRunId: string
  stepDefinitionId: string
  name: string
  risk: ActionRisk
  status: WorkflowStepStatus
  startedAt?: string
  completedAt?: string
  outputSummary?: string
  error?: string
  approvalId?: string
}

export interface WorkflowRun {
  id: string
  organizationId: string
  workflowId: string
  status: WorkflowRunStatus
  startedAt: string
  completedAt?: string
  currentStepId?: string
  retryCount?: number
  resultMetadata?: Record<string, unknown>
  steps: WorkflowRunStep[]
  resultSummary?: string
  idempotencyKey: string
  scheduledTriggerId?: string
  scheduledFor?: string
  deadLetterReason?: string
  connectorExecutions?: ConnectorExecutionRecord[]
}

export interface WorkflowScheduleTrigger {
  id: string
  organizationId: string
  workflowId: string
  timezone: string
  schedule: string
  nextRunAt: string
  status: SchedulerTriggerStatus
  retryCount: number
  maxRetries: number
  deadLetterReason?: string
  lastRunAt?: string
  lastError?: string
  createdAt: string
  updatedAt?: string
}

export interface WorkflowScheduleAttempt {
  id: string
  organizationId: string
  triggerId: string
  workflowId: string
  workflowRunId?: string
  status: SchedulerRunStatus
  attempt: number
  scheduledFor: string
  leasedUntil?: string
  error?: string
  createdAt: string
  completedAt?: string
}

export interface Approval {
  id: string
  organizationId: string
  workflowRunId: string
  workflowStepId: string
  agentType: AgentType
  proposedAction: string
  actionType?: string
  proposedPayload?: Record<string, unknown>
  targetSystem: string
  affectedEntity: string
  generatedContent: string
  reason: string
  risk: ActionRisk
  status: ApprovalStatus
  createdAt: string
  decidedAt?: string
  approverId?: string
  requestedBy?: string
  resolvedBy?: string
  decision?: string
  editedContent?: string
  editedPayload?: Record<string, unknown>
  executionResult?: string
}

export interface AuditEvent {
  id: string
  organizationId: string
  userId?: string
  agentType?: AgentType
  workflowId?: string
  workflowRunId?: string
  stepId?: string
  tool?: string
  action: string
  inputSummary: string
  outputSummary: string
  approvalId?: string
  result: 'SUCCESS' | 'BLOCKED' | 'FAILED'
  timestamp: string
  error?: string
}

export interface AIToolSubscription {
  id: string
  organizationId: string
  toolName: string
  vendor: string
  category: string
  capability: string
  department: string
  owner: string
  monthlyCost: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  seatsPurchased: number
  activeSeats: number
  renewalDate: string
  status: 'APPROVED' | 'UNAPPROVED' | 'REVIEWING'
  usageLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  notes?: string
}

export interface AIRecommendation {
  id: string
  organizationId: string
  type: AIRecommendationType
  title: string
  rationale: string
  estimatedMonthlySavings?: number
  confidence: number
  relatedToolIds: string[]
  relatedAgentType?: AgentType
  relatedWorkflowTemplateId?: string
}

export interface ExecutiveBriefItem {
  id: string
  organizationId: string
  type: ExecutiveBriefItemType
  title: string
  summary: string
  href?: string
}

export interface BusinessMemoryHealth {
  organizationId: string
  companyKnowledgeScore: number
  operationalContextScore: number
  crmStatus: 'CONNECTED' | 'NEEDS_CONNECTION' | 'DISCONNECTED'
  analyticsStatus: 'CONNECTED' | 'NEEDS_CONNECTION' | 'DISCONNECTED'
  calendarStatus: 'CONNECTED' | 'NEEDS_CONNECTION' | 'DISCONNECTED'
  documentCount: number
  chunkCount?: number
  indexedDocumentCount?: number
  agentFindingCount: number
  lastUpdatedAt?: string
}

export interface OptimizationOpportunity {
  id: string
  organizationId: string
  type: OptimizationOpportunityType
  title: string
  problem: string
  currentStateLabel: string
  currentStateValue: string
  recommendedCapability: string
  potentialAction: string
  estimatedMonthlySavings?: number
  estimatedHoursSaved?: number
  confidence?: number
  relatedAgentType?: AgentType
  relatedWorkflowTemplateId?: string
  ctaLabel: string
  ctaHref: string
}

export interface AgentOperationalSummary {
  agentType: AgentType
  group: AgentTeamGroup
  status: 'ACTIVE' | 'SCHEDULED' | 'WAITING_APPROVAL' | 'DRAFT'
  lastRunAt?: string
  nextRunAt?: string
  keyResult: string
  pendingOutput?: string
}

export interface AgentEvaluationResult {
  id: string
  organizationId: string
  agentType: AgentType
  workflowRunId?: string
  findingId?: string
  factuality: number
  relevance: number
  duplicateRate: number
  editRate: number
  estimatedCostUsd: number
  latencyMs: number
  passed: boolean
  notes: string[]
  createdAt: string
}

export interface RecentBusinessActivity {
  id: string
  organizationId: string
  timestampLabel: string
  title: string
  summary: string
  status: BusinessActivityStatus
  href?: string
  agentType?: AgentType
}

export interface ROIMetrics {
  organizationId: string
  aiSpendMonthly: number
  potentialSavingsMonthly: number
  workflowsCompleted: number
  estimatedHoursSaved: number
  estimatedSavings: number
  aiToolCost: number
  workflowSuccessRate: number
  approvalRate: number
  activeWorkflows: number
  activeAgents: number
}
