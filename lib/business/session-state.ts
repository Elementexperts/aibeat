import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveBusinessMembership } from './auth'
import { needsBusinessOnboarding } from './compatibility'
import type { OrganizationMember } from './types'

export const BUSINESS_ORG_COOKIE = 'aibeat_business_organization_id'

export async function loadBusinessSession(client: SupabaseClient, selected?: string, strictSelection = false) {
  const { data, error } = await client.auth.getUser()
  if (!data.user) return { user: null, context: null, needsOnboarding: false }
  if (error) throw new Error('Unable to verify authentication')
  const { data: rows, error: membershipError } = await client.from('organization_members')
    .select('id,organization_id,user_id,role,permissions,status,created_at,updated_at')
    .eq('user_id', data.user.id).eq('status', 'ACTIVE')
  if (membershipError) throw new Error('Unable to verify workspace membership. Please try again.')
  const members: OrganizationMember[] = (rows ?? []).map(row => ({
    id: row.id, organizationId: row.organization_id, userId: row.user_id, role: row.role,
    status: row.status, permissions: row.permissions ?? [], createdAt: row.created_at,
  }))
  if (!members.length) {
    if (strictSelection) throw new Error('Requested organization is not available to this user')
    return { user: data.user, context: null, needsOnboarding: true }
  }
  const validSelection = members.some(member => member.organizationId === selected)
  const context = resolveBusinessMembership({ userId: data.user.id, members,
    organizationId: strictSelection || validSelection ? selected : undefined })
  const { data: organization, error: organizationError } = await client.from('organizations')
    .select('created_by,business_onboarded_at').eq('id', context.organizationId).single()
  if (organizationError || !organization) throw new Error('Unable to verify workspace setup. Please try again.')
  return { user: data.user, context, needsOnboarding: needsBusinessOnboarding(data.user.id, context.role, organization) }
}
