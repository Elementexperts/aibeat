'use server'

import { cookies } from 'next/headers'
import { BUSINESS_ORG_COOKIE, loadBusinessSession } from '@/lib/business/session-state'
import { createClient } from '@/lib/supabase/server'
import { sanitizeBusinessNext } from '@/lib/business/routes'
import type { IndustryProfile } from '@/lib/business/types'

export type OnboardingResult = { ok: true; redirectTo: string } | { ok: false; error: string }

const companySizes = new Set(['1-9', '10-49', '50-99', '100-249', '250+'])
const industries: Record<string, IndustryProfile> = {
  'Digital marketing agency': 'DIGITAL_MARKETING_AGENCY',
  'B2B service company': 'CONSULTING',
  'Lead-generation agency': 'B2B_LEAD_GEN_AGENCY',
  'Small SaaS company': 'B2B_SAAS',
  'Other knowledge-work organization': 'CONSULTING',
}

export async function completeBusinessOnboarding(formData: FormData): Promise<OnboardingResult> {
  const companyName = String(formData.get('companyName') ?? '').trim()
  const industry = String(formData.get('industry') ?? '')
  const companySize = String(formData.get('companySize') ?? '')
  const paidTools = Number(formData.get('paidTools') ?? 0)
  const monthlySpend = Number(formData.get('monthlySpend') ?? 0)
  const objective = String(formData.get('objective') ?? '').trim()
  const firstWorkflow = String(formData.get('firstWorkflow') ?? '').trim()
  const next = sanitizeBusinessNext(String(formData.get('next') ?? ''), '/business/dashboard')

  if (!companyName || companyName.length > 200 || !industries[industry] || !companySizes.has(companySize)
    || !objective || objective.length > 1000 || !firstWorkflow || firstWorkflow.length > 200
    || !Number.isFinite(paidTools) || paidTools < 0 || !Number.isFinite(monthlySpend) || monthlySpend < 0) {
    return { ok: false, error: 'Please complete all onboarding fields.' }
  }

  const supabase = createClient()
  const cookieName = process.env.AIBEAT_BUSINESS_ORG_COOKIE || BUSINESS_ORG_COOKIE
  let session
  try { session = await loadBusinessSession(supabase, cookies().get(cookieName)?.value) }
  catch { return { ok: false, error: 'Unable to verify workspace membership or setup. Please try again.' } }
  if (!session.user) return { ok: false, error: 'Please sign in again to finish onboarding.' }
  if (session.context && !session.needsOnboarding) return { ok: true, redirectTo: next }
  // The existing RPC selects the creator's earliest organization. Reject ambiguous
  // legacy multi-owner setups rather than silently provisioning a different tenant.
  if (session.context) {
    const { data: owned, error } = await supabase.from('organizations').select('id')
      .eq('created_by', session.user.id).order('created_at', { ascending: true })
    if (error || !owned || owned[0]?.id !== session.context.organizationId) {
      return { ok: false, error: 'Workspace setup needs an administrator review before it can continue.' }
    }
  }
  // Creator ownership, template seeding, context and completion marker are one
  // transaction. A failed seed leaves no half-created workspace; retries are safe.
  const { data: organizationId, error: organizationError } = await supabase.rpc('complete_business_onboarding', {
    p_name: companyName,
    p_employee_count: companySizeToCount(companySize),
    p_primary_profile: industries[industry],
    p_first_workflow: firstWorkflow,
    p_context: `Industry: ${industry}. First objective: ${objective}. First workflow: ${firstWorkflow}. Approximate paid AI tools: ${paidTools}. Estimated monthly AI spend: ${monthlySpend}.`,
  })
  if (organizationError || !organizationId) {
    console.error('Business onboarding failed', { code: organizationError?.code })
    return { ok: false, error: 'Unable to finish your workspace setup. Please try again.' }
  }

  cookies().set(cookieName, organizationId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
  return { ok: true, redirectTo: next }
}

function companySizeToCount(size: string) {
  if (size === '1-9') return 9
  if (size === '10-49') return 49
  if (size === '50-99') return 99
  if (size === '100-249') return 249
  return 250
}
