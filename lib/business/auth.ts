import type { OrganizationMember, Role } from './types'

export interface AuthenticatedBusinessContext {
  userId: string
  organizationId: string
  role: Role
  permissions: string[]
  member: OrganizationMember
}

export class AuthenticationRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationRequiredError'
  }
}

export class BusinessAuthorizationError extends Error {
  constructor(message = 'Business authorization denied') {
    super(message)
    this.name = 'BusinessAuthorizationError'
  }
}

export function resolveBusinessMembership(params: {
  userId?: string
  organizationId?: string
  members: OrganizationMember[]
}): AuthenticatedBusinessContext {
  if (!params.userId) throw new AuthenticationRequiredError()

  const activeMemberships = params.members.filter((member) => {
    return member.userId === params.userId && (member.status ?? 'ACTIVE') === 'ACTIVE'
  })

  if (!activeMemberships.length) {
    throw new BusinessAuthorizationError('Authenticated user has no active organization membership')
  }

  const member = params.organizationId
    ? activeMemberships.find((candidate) => candidate.organizationId === params.organizationId)
    : activeMemberships[0]

  if (!member) {
    throw new BusinessAuthorizationError('Requested organization is not available to this user')
  }

  return {
    userId: params.userId,
    organizationId: member.organizationId,
    role: member.role,
    permissions: member.permissions,
    member,
  }
}

