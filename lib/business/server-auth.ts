import { cookies } from 'next/headers'
import { resolveBusinessMembership, type AuthenticatedBusinessContext } from './auth'
import { createClient } from '@/lib/supabase/server'
import type { OrganizationMember } from './types'

const ORG_COOKIE = process.env.AIBEAT_BUSINESS_ORG_COOKIE || 'aibeat_business_organization_id'

export async function getAuthenticatedBusinessContext(): Promise<AuthenticatedBusinessContext> {
  const cookieStore = cookies()
  const organizationId = cookieStore.get(ORG_COOKIE)?.value
  const supabase = createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return resolveBusinessMembership({ members: [] })
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role, permissions, status, created_at, updated_at')
    .eq('user_id', userData.user.id)
    .eq('status', 'ACTIVE')

  if (error) throw new Error('Unable to resolve organization membership')

  return resolveBusinessMembership({
    userId: userData.user.id,
    organizationId,
    members: (data ?? []).map(mapMembership),
  })
}

function mapMembership(row: Record<string, unknown>): OrganizationMember {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    userId: String(row.user_id),
    role: row.role as OrganizationMember['role'],
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [],
    status: row.status as OrganizationMember['status'],
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  }
}
