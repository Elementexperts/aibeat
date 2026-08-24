'use server'

import { createClient } from '@/lib/supabase/server'
import { workflowTemplates } from '@/lib/business/demo-data'
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

  if (!companyName || !industries[industry] || !companySizes.has(companySize) || !objective || !firstWorkflow) {
    return { ok: false, error: 'Please complete all onboarding fields.' }
  }

  const supabase = createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { ok: false, error: 'Please sign in again to finish onboarding.' }

  const { data: existingMembership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userData.user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle()

  if (existingMembership?.organization_id) {
    return { ok: true, redirectTo: next }
  }

  const employeeCount = companySizeToCount(companySize)
  const primaryProfile = industries[industry]
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: companyName,
      employee_count: employeeCount,
      primary_profile: primaryProfile,
      secondary_profiles: [],
      created_by: userData.user.id,
    })
    .select('id')
    .single()

  if (orgError || !organization) return { ok: false, error: 'Unable to create your organization. Please try again.' }

  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: organization.id,
    user_id: userData.user.id,
    role: 'OWNER',
    status: 'ACTIVE',
    permissions: [],
  })

  if (memberError) return { ok: false, error: 'Organization was created, but membership setup failed. Please contact support.' }

  await supabase.from('workflows').insert(workflowTemplates.map((template) => ({
    organization_id: organization.id,
    template_id: template.id,
    name: template.name,
    description: template.description,
    agent_type: template.agentType,
    trigger: template.trigger,
    schedule: template.schedule,
    inputs: template.inputs,
    steps: template.steps,
    required_integrations: template.requiredIntegrations,
    approval_policy: template.approvalPolicy,
    output_definition: template.outputDefinition,
    status: template.name === firstWorkflow ? 'ACTIVE' : 'DRAFT',
    version: template.version,
    created_by: userData.user.id,
  })))

  await supabase.from('business_context_items').insert({
    organization_id: organization.id,
    domain: 'COMPANY_KNOWLEDGE',
    category: 'ONBOARDING',
    title: 'Onboarding setup',
    content: `Industry: ${industry}. First objective: ${objective}. First workflow: ${firstWorkflow}. Approximate paid AI tools: ${paidTools}. Estimated monthly AI spend: ${monthlySpend}.`,
    source: 'Onboarding',
    provenance: 'Entered by organization owner during onboarding',
    human_verified: true,
    created_by: userData.user.id,
  })

  return { ok: true, redirectTo: next }
}

function companySizeToCount(size: string) {
  if (size === '1-9') return 9
  if (size === '10-49') return 49
  if (size === '50-99') return 99
  if (size === '100-249') return 249
  return 250
}
