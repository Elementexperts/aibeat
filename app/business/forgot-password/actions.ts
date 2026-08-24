'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type ForgotPasswordResult = { ok: true } | { ok: false; error: string }

export async function requestBusinessPasswordReset(email: string): Promise<ForgotPasswordResult> {
  if (!email) return { ok: false, error: 'Enter your work email.' }
  const origin = headers().get('origin') ?? 'https://www.aibeat.dev'
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/business/auth/callback?type=recovery`,
  })
  if (error) return { ok: false, error: 'Unable to send a reset link. Please try again.' }
  return { ok: true }
}
