'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BUSINESS_ORG_COOKIE } from '@/lib/business/session-state'
import { acceptInvitation, invitationPath } from '@/lib/business/invitations'

export async function acceptBusinessInvitation(formData: FormData) {
  const id = String(formData.get('invitation') ?? '')
  const path = invitationPath(id)
  if (!path) redirect('/business/invitations/accept?error=Invalid%20invitation%20link.')
  let result
  try { result = await acceptInvitation(createClient(), id) }
  catch { redirect(path + '&error=' + encodeURIComponent('Unable to verify invitation acceptance. Please try again.')) }
  if (!result.ok) redirect(path + '&error=' + encodeURIComponent(result.error))
  cookies().set(process.env.AIBEAT_BUSINESS_ORG_COOKIE || BUSINESS_ORG_COOKIE, result.organizationId, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/',
  })
  redirect('/business/dashboard')
}
