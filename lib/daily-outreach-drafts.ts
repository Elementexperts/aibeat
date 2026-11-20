import { EmailSuppressionService } from './email-suppression'
import type { OutreachLead } from './outreach-types'
import { buildOutreachDraft } from './gmail-outreach-drafts'

export type DraftLedger = Record<string, { status: 'reserved' | 'complete'; draftId?: string }>
export const blockedStatuses = new Set(['suppressed', 'unsubscribed', 'bounced', 'declined', 'contacted', 'replied', 'interested', 'draft_created', 'scheduled'])

export async function processDailyDrafts(input: {
  leads: OutreachLead[]; ledger: DraftLedger; excluded: Set<string>; archived: Set<string>
  enabled: boolean
  save: () => Promise<void>
  archive: (lead: OutreachLead) => void
  create: (lead: OutreachLead, lookupOnly: boolean, beforeCreate: () => Promise<void>) => Promise<{ created: boolean; draftId: string }>
}) {
  const counts = { eligible: 0, drafted: 0, duplicates: 0, excluded: 0, failed: 0, uncertain: 0, disabled: !input.enabled }
  const seen = new Set<string>()
  for (const lead of input.leads) {
    const email = lead.email.trim().toLowerCase()
    const key = buildOutreachDraft(lead).key
    if (input.excluded.has(email)) { counts.excluded++; continue }
    if (seen.has(email) || input.archived.has(email)) { counts.duplicates++; continue }
    seen.add(email)
    counts.eligible++
    if (!input.enabled) continue
    if (input.ledger[key]?.status === 'complete') {
      input.archive(lead)
      await input.save()
      counts.duplicates++
      continue
    }
    let result
    let checkpointFailed = false
    try {
      result = await input.create(lead, input.ledger[key]?.status === 'reserved', async () => {
        input.ledger[key] = { status: 'reserved' }
        // Persist remotely before Gmail POST, so a terminated runner cannot redraft.
        try { await input.save() } catch (error) { checkpointFailed = true; throw error }
      })
    } catch {
      if (checkpointFailed) throw new Error('Draft reservation could not be persisted; processing stopped.')
      counts.failed++
      if (input.ledger[key]?.status === 'reserved') counts.uncertain++
      continue
    }
    input.ledger[key] = { status: 'complete', draftId: result.draftId }
    input.archive(lead)
    // Persistence errors stop processing: do not risk further unrecorded effects.
    await input.save()
    if (result.created) counts.drafted++; else counts.duplicates++
  }
  return counts
}

// Legacy name retained for callers; the authoritative set now includes central suppressions.
export async function fetchUnsubscribes(url: string, key: string, fetchImpl: typeof fetch = fetch) {
  return new EmailSuppressionService({ env: { EMAIL_SUPPRESSION_SUPABASE_URL: url, EMAIL_SUPPRESSION_SERVICE_ROLE_KEY: key }, fetchImpl }).list()
}
