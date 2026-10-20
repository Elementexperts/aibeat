import { cookies } from 'next/headers'
import { AuthenticationRequiredError, BusinessAuthorizationError } from './auth'
import { createClient } from '@/lib/supabase/server'
import { BUSINESS_ORG_COOKIE, loadBusinessSession } from './session-state'

export async function getAuthenticatedBusinessContext() {
  const selected = cookies().get(process.env.AIBEAT_BUSINESS_ORG_COOKIE || BUSINESS_ORG_COOKIE)?.value
  const session = await loadBusinessSession(createClient(), selected)
  if (!session.user) throw new AuthenticationRequiredError()
  if (!session.context) throw new BusinessAuthorizationError('Authenticated user has no active organization membership')
  return session.context
}
