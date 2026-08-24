'use server'

import { createClient } from '@/lib/supabase/server'

export type ResetPasswordResult = { ok: true } | { ok: false; error: string }

export async function updateBusinessPassword(password: string): Promise<ResetPasswordResult> {
  if (!password || password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { ok: false, error: 'Unable to update password. Your link may be invalid or expired.' }
  return { ok: true }
}
