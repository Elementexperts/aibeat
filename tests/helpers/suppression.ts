import type { SuppressionGuard } from '../../lib/email-suppression'
// For unrelated provider-format regression tests only; suppression behavior has dedicated tests.
export const allowMarketing: SuppressionGuard = { blocked: async () => new Set<string>(), assertAllowed: async () => {} }
export const suppressionEnv = { EMAIL_SUPPRESSION_SUPABASE_URL: 'https://suppression-test.supabase.co', EMAIL_SUPPRESSION_SERVICE_ROLE_KEY: 'synthetic-private-key' }
