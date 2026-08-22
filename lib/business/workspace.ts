import { AGENT_REGISTRY } from './agents'
import { getAIRecommendations, getAIToolSubscriptions, getROIMetrics, summarizeSpend } from './ai-spend'
import { getBusinessContextPayload } from './context'
import { demoFindings, demoOrganizations } from './demo-data'
import { INDUSTRY_PROFILE_LABELS, getIndustryProfile } from './industry-profiles'
import { connectorRegistry } from './connectors'
import { getApprovals, getAuditEvents, getOrganizationWorkflows, getWorkflowRuns, getWorkflowTemplates } from './workflows'

export const DEFAULT_DEMO_ORGANIZATION_ID = 'org-growth-labs'
export const DEFAULT_DEMO_USER_ID = 'user-sarah'

export function getBusinessWorkspaceData(organizationId = DEFAULT_DEMO_ORGANIZATION_ID, userId = DEFAULT_DEMO_USER_ID) {
  const organization = demoOrganizations.find((candidate) => candidate.id === organizationId)
  if (!organization) throw new Error('Demo organization not found')

  const workflows = getOrganizationWorkflows(organizationId, userId)
  const approvals = getApprovals(organizationId, userId)
  const runs = getWorkflowRuns(organizationId, userId)
  const context = getBusinessContextPayload(organizationId, userId)
  const tools = getAIToolSubscriptions(organizationId, userId)
  const recommendations = getAIRecommendations(organizationId, userId)
  const auditEvents = getAuditEvents(organizationId, userId)
  const roi = getROIMetrics(organizationId, userId)
  const spend = summarizeSpend(organizationId, userId)
  const findings = demoFindings.filter((finding) => finding.organizationId === organizationId)

  return {
    organization,
    industryProfile: getIndustryProfile(organization.primaryProfile),
    industryLabel: INDUSTRY_PROFILE_LABELS[organization.primaryProfile],
    agents: Object.values(AGENT_REGISTRY),
    workflows,
    templates: getWorkflowTemplates(),
    approvals,
    runs,
    context,
    tools,
    recommendations,
    auditEvents,
    roi,
    spend,
    findings,
    connectors: Object.values(connectorRegistry).map((connector) => ({
      id: connector.id,
      name: connector.name,
      capabilities: connector.capabilities,
      status: connector.id === 'crm' ? 'Needs OAuth' : 'Healthy mock',
    })),
  }
}
