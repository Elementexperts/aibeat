import { EmailSuppressionService, type SuppressionGuard } from './email-suppression'
export async function verifySuppressionSetup(
  env: Readonly<Record<string, string | undefined>> = process.env,
  guard: SuppressionGuard = new EmailSuppressionService({ env }),
) {
  const expected = env.SUBMISSIONS_SUPABASE_URL?.trim().replace(/\/$/, '')
  const actual = env.EMAIL_SUPPRESSION_SUPABASE_URL?.trim().replace(/\/$/, '')
  if (!expected) throw new Error('Suppression preflight blocked: configure SUBMISSIONS_SUPABASE_URL to independently identify the public submissions project.')
  if (!actual) throw new Error('Suppression preflight blocked: configure the EMAIL_SUPPRESSION_SUPABASE_URL Actions variable.')
  if (actual !== expected) throw new Error('Suppression preflight blocked: suppression and public-submissions project URLs differ. Verify the intended project; do not bypass this check.')
  // Read-only RPC; no fixture insertion, enrollment, Gmail call or email delivery.
  await guard.blocked(['suppression-preflight@example.invalid'])
}
