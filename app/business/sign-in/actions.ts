'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizeBusinessNext } from '@/lib/business/routes'

export type BusinessAuthActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string }

export async function signInBusinessUser(email: string, password: string, nextPath?: string): Promise<BusinessAuthActionResult> {
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { ok: false, error: error.message }
    }

    if (!data.session || !data.user) {
      return { ok: false, error: 'Sign-in succeeded, but the server session was not established. Please try again.' }
    }

    const { data: memberships } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('status', 'ACTIVE')
      .limit(1)

    return { ok: true, redirectTo: memberships?.length ? sanitizeBusinessNext(nextPath) : '/business/onboarding' }
  } catch (error) {
    return { ok: false, error: getSafeAuthError(error) }
  }
}

export async function signOutBusinessUser(): Promise<BusinessAuthActionResult> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: getSafeAuthError(error) }
  }
}

function getSafeAuthError(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes('NEXT_PUBLIC_SUPABASE_URL') || error.message.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
      return error.message
    }
  }

  return 'Unable to complete authentication. Please try again.'
}
