import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config'

export type PublicFormKind = 'newsletter' | 'tool_submission' | 'business_early_access' | 'unsubscribe'

export async function recordPublicFormSubmission(input: {
  kind: PublicFormKind
  email?: string
  payload: Record<string, unknown>
  fetchImpl?: typeof fetch
}) {
  const url = `${getSupabaseUrl()}/rest/v1/rpc/record_public_form_submission`
  const key = getSupabasePublishableKey()
  const response = await (input.fetchImpl ?? fetch)(url, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      submission_kind: input.kind,
      submission_email: input.email || null,
      submission_payload: input.payload,
    }),
  })

  if (!response.ok) {
    throw new Error(`Supabase form storage failed (${response.status}): ${(await response.text()).slice(0, 240)}`)
  }

  const result = await response.json() as string | null
  if (!result) throw new Error('Supabase form storage did not return a submission ID.')
  return result
}
