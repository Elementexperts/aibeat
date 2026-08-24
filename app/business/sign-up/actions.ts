'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { sanitizeBusinessNext } from '@/lib/business/routes'

export type SignUpResult =
  | { ok: true; status: 'check-email' | 'signed-in'; redirectTo?: string; email?: string }
  | { ok: false; error: string }

const companySizes = new Set(['1-9', '10-49', '50-99', '100-249', '250+'])
const allowedPlans = new Set(['starter', 'growth', 'scale', 'design-partner'])

export async function signUpBusinessUser(formData: FormData): Promise<SignUpResult> {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const companyName = String(formData.get('companyName') ?? '').trim()
  const companySize = String(formData.get('companySize') ?? '')
  const acceptedTerms = formData.get('acceptedTerms') === 'on'
  const plan = String(formData.get('plan') ?? '')
  const next = sanitizeBusinessNext(String(formData.get('next') ?? ''), '/business/onboarding')

  if (!fullName || !email || !password || !companyName || !companySizes.has(companySize)) {
    return { ok: false, error: 'Please complete all required fields.' }
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  if (!acceptedTerms) return { ok: false, error: 'Please accept the Terms and Privacy Policy to continue.' }

  const origin = headers().get('origin') ?? 'https://www.aibeat.dev'
  const params = new URLSearchParams()
  params.set('next', next)
  if (allowedPlans.has(plan)) params.set('plan', plan)

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/business/auth/callback?${params.toString()}`,
      data: {
        full_name: fullName,
        pending_company_name: companyName,
        pending_company_size: companySize,
        selected_business_plan: allowedPlans.has(plan) ? plan : null,
      },
    },
  })

  if (error) {
    return { ok: false, error: 'Unable to create an account with those details. Please try signing in or use a different work email.' }
  }

  if (data.session) return { ok: true, status: 'signed-in', redirectTo: '/business/onboarding' }
  return { ok: true, status: 'check-email', email }
}
