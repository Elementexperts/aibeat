import type { SupabaseClient } from '@supabase/supabase-js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function invitationPath(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value)
    ? `/business/invitations/accept?invitation=${value}` : null
}
export function invitationNext(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value, 'https://www.aibeat.dev')
    if (!value.startsWith('/') || value.includes('\\') || url.origin !== 'https://www.aibeat.dev'
      || url.pathname !== '/business/invitations/accept' || url.hash
      || Array.from(url.searchParams.keys()).some(key => key !== 'invitation')
      || url.searchParams.getAll('invitation').length !== 1) return null
    return invitationPath(url.searchParams.get('invitation'))
  } catch { return null }
}
export type AcceptanceResult = { ok: true; organizationId: string } | { ok: false; error: string }
const messages: Record<string, string> = {
  VERIFIED_EMAIL_REQUIRED: 'Verify your account email before accepting this invitation.',
  INVITATION_EXPIRED: 'This invitation has expired. Ask the workspace owner for a new invitation.',
  INVITATION_REVOKED: 'This invitation is no longer available. Contact the workspace owner.',
  MEMBERSHIP_EXISTS: 'You already have a membership in this workspace. Contact its owner for changes.',
  MEMBERSHIP_CHANGED: 'Your membership has changed since acceptance. Contact the workspace owner.',
}
// Auth is checked here for useful UX; the database independently verifies identity and authorization.
export async function acceptInvitation(client: SupabaseClient, id: unknown): Promise<AcceptanceResult> {
  if (!invitationPath(id)) return { ok: false, error: 'This invitation link is invalid.' }
  const { data: auth, error: authError } = await client.auth.getUser()
  if (authError || !auth.user) return { ok: false, error: 'Sign in to accept this invitation.' }
  if (!auth.user.email || !auth.user.email_confirmed_at) return { ok: false, error: messages.VERIFIED_EMAIL_REQUIRED }
  const { data, error } = await client.rpc('accept_business_invitation', { p_invitation_id: id })
  if (error) return { ok: false, error: messages[error.message] ?? 'This invitation is unavailable for your account. Contact the workspace owner.' }
  if (!data || !UUID.test(data.organization_id) || data.user_id !== auth.user.id || data.status !== 'ACTIVE') {
    return { ok: false, error: 'Unable to verify invitation acceptance. Please try again.' }
  }
  return { ok: true, organizationId: data.organization_id }
}
