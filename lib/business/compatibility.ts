import type { Approval, AuditEvent, Role, WorkflowRun } from './types'

export function businessCapabilities(role?: Role) {
  return { manageMembers: role === 'OWNER', write: role === 'OWNER' || role === 'ADMIN',
    decide: role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER' }
}

export function auditResult(event: string): AuditEvent['result'] {
  if (event.endsWith('_FAILED')) return 'FAILED'
  if (event.endsWith('_REJECTED') || event.endsWith('_BLOCKED') || event === 'APPROVAL_REQUESTED') return 'BLOCKED'
  return 'SUCCESS'
}

export function needsBusinessOnboarding(userId: string, role: Role, organization: { created_by: string; business_onboarded_at: string | null }) {
  return role === 'OWNER' && organization.created_by === userId && !organization.business_onboarded_at
}

export function businessHostRoute(host: string, env: Record<string, string | undefined>): 'allow' | 'canonical' | 'deny' {
  const normalized = host.toLowerCase()
  if (env.AIBEAT_APP_ENV && env.VERCEL_ENV
    && (env.AIBEAT_APP_ENV === 'production') !== (env.VERCEL_ENV === 'production')) return 'deny'
  const mode = env.AIBEAT_APP_ENV ?? env.VERCEL_ENV
  const productionHost = normalized === 'aibeat.dev' || normalized === 'www.aibeat.dev'
  if (mode === 'production') {
    if (normalized === 'www.aibeat.dev') return 'allow'
    if (normalized === 'aibeat.dev' || (env.VERCEL_URL && normalized === env.VERCEL_URL.toLowerCase())) return 'canonical'
    return 'deny'
  }
  if (productionHost) return 'deny'
  if ((!mode || mode === 'development' || mode === 'test') && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(normalized)) return 'allow'
  if (mode !== 'staging' && mode !== 'preview') return 'deny'
  const hosts = (env.AIBEAT_STAGING_HOSTS ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
  return hosts.includes(normalized) ? 'allow' : 'deny'
}

export interface ApprovalRefresh { approval: Approval; approvals: Approval[]; runs: WorkflowRun[]; auditEvents: AuditEvent[] }

export function canDecideApproval(role: Role | undefined, approval?: Approval) {
  if (!businessCapabilities(role).decide || !approval || approval.status !== 'PENDING') return false
  return !approval.approverRoles?.length || approval.approverRoles.includes(role!)
}

export function isBusinessDatabaseEnvironmentAllowed(env: Record<string, string | undefined>) {
  if (env.AIBEAT_APP_ENV && env.VERCEL_ENV
    && (env.AIBEAT_APP_ENV === 'production') !== (env.VERCEL_ENV === 'production')) return false
  const mode = env.AIBEAT_APP_ENV ?? env.VERCEL_ENV
  if (mode === 'production') return true // Existing production configuration is not inspected here.
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    return url.protocol === 'https:' && url.hostname === 'oejxwsvlvelxmfbysjbx.supabase.co'
      && !url.username && !url.password && !url.port && url.pathname === '/'
  } catch { return false }
}
