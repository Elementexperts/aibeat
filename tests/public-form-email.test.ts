import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { getPublicFormRecipients } from '../lib/public-form-email'
import { recordPublicFormSubmission, type PublicFormKind } from '../lib/public-form-submissions'
import { POST as submit } from '../app/api/submit/route'
import { POST as earlyAccess } from '../app/api/business/early-access/route'

const kinds: PublicFormKind[] = ['tool_submission', 'newsletter', 'unsubscribe', 'business_early_access']
const variables = ['SUBMISSION_TO_EMAIL', 'NEWSLETTER_TO_EMAIL', 'UNSUBSCRIBE_TO_EMAIL', 'BUSINESS_EARLY_ACCESS_TO_EMAIL']
const originalEnv = { ...process.env }
const originalFetch = globalThis.fetch

test.beforeEach(() => {
  process.env = { NODE_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test', GMAIL_CLIENT_ID: 'client', GMAIL_CLIENT_SECRET: 'secret', GMAIL_REFRESH_TOKEN: 'refresh' }
})
test.afterEach(() => { process.env = { ...originalEnv }; globalThis.fetch = originalFetch })

for (const [index, kind] of Array.from(kinds.entries())) {
  test(`${kind}: defaults, legacy recipients, normalization, and precedence`, () => {
    assert.deepEqual(getPublicFormRecipients(kind, {}), ['hello@aibeat.dev'])
    assert.deepEqual(getPublicFormRecipients(kind, { SUBMISSION_TO_EMAIL: 'info@aibeat.dev' }), ['hello@aibeat.dev', 'info@aibeat.dev'])
    assert.deepEqual(getPublicFormRecipients(kind, { SUBMISSION_TO_EMAIL: 'info@aibeat.dev', [variables[index]]: ' HELLO@AIBEAT.DEV, TEAM@example.com\nteam@example.com invalid ' }), ['hello@aibeat.dev', 'team@example.com'])
    for (const value of ['', '   ', 'invalid, nope']) {
      assert.deepEqual(getPublicFormRecipients(kind, { [variables[index]]: value }), ['hello@aibeat.dev'])
      if (index > 0) assert.deepEqual(getPublicFormRecipients(kind, { SUBMISSION_TO_EMAIL: 'info@aibeat.dev', [variables[index]]: value }), ['hello@aibeat.dev', 'info@aibeat.dev'])
    }
  })
  test(`${kind}: stores before sending and preserves reply-to`, async () => {
    const calls: string[] = []
    await recordPublicFormSubmission({ kind, email: 'reader@example.com', payload: { note: 'hello' }, fetchImpl: async (url, init) => {
      if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
      calls.push(String(url))
      if (calls.length === 1) return Response.json('submission_123')
      const mime = Buffer.from(JSON.parse(String(init?.body)).raw, 'base64url').toString('utf8')
      assert.match(mime, /To: hello@aibeat.dev/)
      assert.match(mime, /Reply-To: reader@example.com/)
      assert.match(mime, /From: AIBeat <hello@aibeat.dev>/)
      assert.match(Buffer.from(mime.split('\r\n\r\n')[1], 'base64').toString(), /submission_123/)
      return Response.json({ id: 'email_123' })
    } })
    assert.deepEqual(calls, ['https://project.supabase.co/rest/v1/rpc/record_public_form_submission', 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'])
  })
}

test('sender override takes precedence over shared sender', async () => {
  process.env.NEWSLETTER_FROM_EMAIL = 'Newsletter <newsletter@aibeat.dev>'
  process.env.SUBMISSION_FROM_EMAIL = 'Shared <hello@aibeat.dev>'
  await recordPublicFormSubmission({ kind: 'newsletter', payload: {}, fetchImpl: async (url, init) => {
    if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
    if (!String(url).includes('gmail.googleapis.com')) return Response.json('id')
    assert.match(Buffer.from(JSON.parse(String(init?.body)).raw, 'base64url').toString(), /From: Newsletter <newsletter@aibeat.dev>/)
    return Response.json({ id: 'email' })
  } })
})

test('storage failure prevents sending', async () => {
  let calls = 0
  await assert.rejects(recordPublicFormSubmission({ kind: 'newsletter', payload: {}, fetchImpl: async () => { calls++; return new Response('', { status: 500 }) } }), /storage failed/)
  assert.equal(calls, 1)
})

for (const failure of ['missing-key', 'rejected', 'missing-id', 'network']) {
  test(`notification ${failure} is surfaced after preserving submission`, async () => {
    if (failure === 'missing-key') delete process.env.GMAIL_REFRESH_TOKEN
    let stored = false
    await assert.rejects(recordPublicFormSubmission({ kind: 'newsletter', payload: {}, fetchImpl: async (url) => {
      if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
      if (!String(url).includes('gmail.googleapis.com')) { stored = true; return Response.json('id') }
      if (failure === 'network') throw new Error('network failed')
      return Response.json({}, { status: failure === 'rejected' ? 503 : 200 })
    } }))
    assert.ok(stored)
  })
}

for (const [name, handler, payload] of [
  ['submit', submit, { type: 'free', name: 'Tool', url: 'https://example.com', category: 'AI', description: 'Useful tool', email: 'founder@example.com', submitWithoutVerification: true }],
  ['early-access', earlyAccess, { email: 'founder@example.com', company: 'Example', companySize: '1-9' }],
] as const) {
  test(`${name} route sends through the shared notification path`, async () => {
    let sent = false
    globalThis.fetch = async (url, init) => {
      if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
      if (!String(url).includes('gmail.googleapis.com')) return Response.json('id')
      sent = true
      assert.match(Buffer.from(JSON.parse(String(init?.body)).raw, 'base64url').toString(), /To: hello@aibeat.dev/)
      return Response.json({ id: 'email' })
    }
    const response = await handler(new NextRequest(`http://localhost/api/${name}`, { method: 'POST', body: JSON.stringify(payload) }))
    assert.equal(response.status, 200)
    assert.ok(sent)
  })
}
