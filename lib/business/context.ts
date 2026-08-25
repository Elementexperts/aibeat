import { businessStore } from './store'
import type { BusinessContextDomain, BusinessContextItem, BusinessContextPayload, OrganizationMember } from './types'
import type { DocumentIngestionInput } from './document-ingestion'

export function getMemberForUser(userId: string, organizationId: string): OrganizationMember | undefined {
  return businessStore.getMemberForUser(userId, organizationId)
}

export function searchBusinessContext(params: {
  organizationId: string
  userId: string
  query?: string
  domains?: BusinessContextDomain[]
}): BusinessContextItem[] {
  return businessStore.searchBusinessContext(params)
}

export function getBusinessContextPayload(organizationId: string, userId: string): BusinessContextPayload {
  return businessStore.getBusinessContextPayload({ organizationId, userId })
}

export function createBusinessContextItem(item: BusinessContextItem, actor: { organizationId: string; userId: string }): BusinessContextItem {
  return businessStore.createBusinessContextItem(actor, item)
}

export function getBusinessContextByDomain(actor: { organizationId: string; userId: string }, domain: BusinessContextDomain): BusinessContextItem[] {
  return businessStore.searchBusinessContext({ ...actor, domains: [domain] })
}

export function getBusinessContextItem(actor: { organizationId: string; userId: string }, itemId: string): BusinessContextItem {
  return businessStore.getBusinessContextItem(actor, itemId)
}

export function updateBusinessContextItem(actor: { organizationId: string; userId: string }, itemId: string, patch: Partial<BusinessContextItem>): BusinessContextItem {
  return businessStore.updateBusinessContextItem(actor, itemId, patch)
}

export function archiveBusinessContextItem(actor: { organizationId: string; userId: string }, itemId: string): BusinessContextItem {
  return businessStore.archiveBusinessContextItem(actor, itemId)
}

export function ingestBusinessMemoryDocument(actor: { organizationId: string; userId: string }, input: Omit<DocumentIngestionInput, 'organizationId' | 'userId'>) {
  return businessStore.ingestDocument(actor, input)
}

export function retrieveBusinessMemory(actor: { organizationId: string; userId: string }, query: string, limit = 8) {
  return businessStore.retrieveBusinessMemory(actor, query, limit)
}
