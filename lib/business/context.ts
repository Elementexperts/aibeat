import { demoContextItems, demoFindings, demoMembers } from './demo-data'
import { assertPermission, assertTenantAccess } from './security'
import type { BusinessContextDomain, BusinessContextItem, BusinessContextPayload, OrganizationMember } from './types'

export function getMemberForUser(userId: string, organizationId: string): OrganizationMember | undefined {
  return demoMembers.find((member) => member.userId === userId && member.organizationId === organizationId)
}

export function searchBusinessContext(params: {
  organizationId: string
  userId: string
  query?: string
  domains?: BusinessContextDomain[]
}): BusinessContextItem[] {
  const member = assertTenantAccess(getMemberForUser(params.userId, params.organizationId), params.organizationId)
  assertPermission(member, 'business:read')

  const query = params.query?.toLowerCase()
  return demoContextItems.filter((item) => {
    if (item.organizationId !== params.organizationId) return false
    if (params.domains?.length && !params.domains.includes(item.domain)) return false
    if (!query) return true
    return `${item.title} ${item.content} ${item.category}`.toLowerCase().includes(query)
  })
}

export function getBusinessContextPayload(organizationId: string, userId: string): BusinessContextPayload {
  const items = searchBusinessContext({ organizationId, userId })

  const payload: BusinessContextPayload = {
    organizationId,
    companyKnowledge: [],
    operationalContext: [],
    peopleAndAccess: [],
    aiOperationalMemory: [],
  }

  for (const item of items) {
    if (item.domain === 'COMPANY_KNOWLEDGE') payload.companyKnowledge.push(item)
    if (item.domain === 'OPERATIONAL_CONTEXT') payload.operationalContext.push(item)
    if (item.domain === 'PEOPLE_ACCESS') payload.peopleAndAccess.push(item)
    if (item.domain === 'AI_OPERATIONAL_MEMORY') payload.aiOperationalMemory.push(item)
  }

  payload.aiOperationalMemory.push(
    ...demoFindings
      .filter((finding) => finding.organizationId === organizationId)
      .map((finding) => ({
        id: `ctx-${finding.id}`,
        organizationId,
        domain: 'AI_OPERATIONAL_MEMORY' as const,
        category: 'AGENT_FINDING' as const,
        title: finding.title,
        content: finding.content,
        source: finding.source,
        sourceUrl: finding.sourceUrl,
        sourceDate: finding.sourceDate,
        confidence: finding.confidence,
        createdAt: finding.createdAt,
        expiresAt: finding.expiresAt,
        relatedEntityType: finding.relatedEntityType,
        relatedEntityId: finding.relatedEntityId,
        humanVerified: finding.humanVerified,
        provenance: `Agent finding ${finding.id} from ${finding.agentType}`,
      })),
  )

  return payload
}

export function createBusinessContextItem(item: BusinessContextItem, actor: { organizationId: string; userId: string }): BusinessContextItem {
  const member = assertTenantAccess(getMemberForUser(actor.userId, actor.organizationId), actor.organizationId)
  assertPermission(member, 'business:write')

  if (item.organizationId !== actor.organizationId) {
    throw new Error('Cannot write context outside actor organization')
  }

  return item
}
