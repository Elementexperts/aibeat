import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailSuppressionService, SuppressionUnavailableError } from '../lib/email-suppression'
import { verifySuppressionSetup } from '../lib/email-suppression-preflight'
import { suppressionEnv } from './helpers/suppression'
test('missing or mismatched project configuration fails before any network request', async () => {
  let called = false
  const guard = { blocked: async () => { called = true; return new Set<string>() }, assertAllowed: async () => {} }
  await assert.rejects(verifySuppressionSetup({},guard), /SUBMISSIONS_SUPABASE_URL/)
  await assert.rejects(verifySuppressionSetup({ SUBMISSIONS_SUPABASE_URL: suppressionEnv.EMAIL_SUPPRESSION_SUPABASE_URL },guard), /EMAIL_SUPPRESSION_SUPABASE_URL/)
  await assert.rejects(verifySuppressionSetup({ SUBMISSIONS_SUPABASE_URL: 'https://other.supabase.co', EMAIL_SUPPRESSION_SUPABASE_URL: suppressionEnv.EMAIL_SUPPRESSION_SUPABASE_URL },guard), /differ/)
  assert.equal(called, false)
})
test('valid setup probes only the read-only RPC with a reserved synthetic address', async () => {
  let calls=0
  await verifySuppressionSetup({ ...suppressionEnv, SUBMISSIONS_SUPABASE_URL: suppressionEnv.EMAIL_SUPPRESSION_SUPABASE_URL }, {
    blocked: async emails => { calls++; assert.deepEqual(emails,['suppression-preflight@example.invalid']); return new Set() },
    assertAllowed: async () => { throw new Error('Not a send operation') },
  })
  assert.equal(calls,1)
})
test('missing secret is actionable and still fails closed',async()=>{
  const db=new EmailSuppressionService({env:{EMAIL_SUPPRESSION_SUPABASE_URL:suppressionEnv.EMAIL_SUPPRESSION_SUPABASE_URL}})
  await assert.rejects(db.blocked(['test@example.invalid']),e=>e instanceof SuppressionUnavailableError && e.code==='missing_configuration')
})
for(const [status,code] of [[401,'credentials_rejected'],[403,'credentials_rejected'],[404,'migration_unavailable'],[503,'database_unavailable']] as const) {
  test('HTTP '+status+' diagnostics never expose response bodies or credentials',async()=>{
    const db=new EmailSuppressionService({env:suppressionEnv,fetchImpl:async()=>new Response('private-token person@example.com',{status})})
    await assert.rejects(db.blocked(['test@example.invalid']),e=>e instanceof SuppressionUnavailableError && e.code===code && !e.message.includes('private-token') && !e.message.includes('@'))
  })
}
test('malformed response is distinguished from a successful suppression lookup',async()=>{
  const db=new EmailSuppressionService({env:suppressionEnv,fetchImpl:async()=>new Response('not json')})
  await assert.rejects(db.blocked(['test@example.invalid']),e=>e instanceof SuppressionUnavailableError && e.code==='invalid_response')
})
