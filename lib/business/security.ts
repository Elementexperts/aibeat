import type { ActionRisk, OrganizationMember, Role } from './types'

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: ['*'],
  ADMIN: ['business:read', 'business:write', 'workflow:run', 'approval:decide', 'integration:manage'],
  MANAGER: ['business:read', 'approval:decide'],
  MEMBER: ['business:read'],
}

export function assertTenantAccess(member: OrganizationMember | undefined, organizationId: string): OrganizationMember {
  if (!member || member.organizationId !== organizationId || (member.status ?? 'ACTIVE') !== 'ACTIVE') {
    throw new Error('Tenant access denied')
  }

  return member
}

export function hasPermission(member: OrganizationMember, permission: string): boolean {
  if ((member.status ?? 'ACTIVE') !== 'ACTIVE') return false
  if (['workflow:run', 'business:write', 'integration:manage'].includes(permission)) return member.role === 'OWNER' || member.role === 'ADMIN'
  if (permission === 'approval:decide') return ['OWNER', 'ADMIN', 'MANAGER'].includes(member.role)
  const inherited = ROLE_PERMISSIONS[member.role]
  return inherited.includes('*') || inherited.includes(permission) || member.permissions.includes(permission)
}

export function assertPermission(member: OrganizationMember, permission: string): void {
  if (!hasPermission(member, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}

export function classifyActionRisk(action: string): ActionRisk {
  const normalized = action.toLowerCase()

  if (/(delete|payroll|transfer money|legal commitment|hire|fire|destructive)/.test(normalized)) {
    return 'RESTRICTED'
  }

  if (/(send|publish|modify crm|create external task|client report|post)/.test(normalized)) {
    return 'APPROVAL_REQUIRED'
  }

  if (/(draft|prepare|recommend|generate|summarize|brief)/.test(normalized)) {
    return 'DRAFT'
  }

  return 'READ'
}

export function canAutoExecuteRisk(risk: ActionRisk): boolean {
  return risk === 'READ' || risk === 'DRAFT'
}

export function sanitizeAuditSummary(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted-token]')
    .slice(0, 600)
}

// Persisted privileged mutations follow database roles, not custom permission strings.
export function assertBusinessRole(role: Role, allowed: readonly Role[]): void {
  if (!allowed.includes(role)) throw new Error('Business role is not authorized for this operation')
}
