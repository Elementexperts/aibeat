import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from '../app/api/unsubscribe/route'

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }
const calls: Array<{ url: string; init?: RequestInit }> = []
function request(body: unknown) {
  return new NextRequest('http://localhost/api/unsubscribe', { method: 'POST', body: JSON.stringify(body) })
}
function setup(options: { storageFailure?: boolean; gmailFailure?: boolean } = {}) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    if (String(url).includes('/rpc/record_public_form_submission')) return Response.json('submission_123', { status: options.storageFailure ? 503 : 200 })
    if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
    if (String(url).includes('gmail.googleapis.com')) return Response.json({ id: 'email_123' }, { status: options.gmailFailure ? 503 : 200 })
    throw new Error('Unexpected external service: ' + url)
  }
}
test.beforeEach(() => {
  process.env = { NODE_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test', GMAIL_CLIENT_ID: 'client', GMAIL_CLIENT_SECRET: 'secret', GMAIL_REFRESH_TOKEN: 'refresh' }
  calls.length = 0
  setup()
})
test.afterEach(() => { process.env = { ...originalEnv }; globalThis.fetch = originalFetch })
test('stores unsubscribe without Kit or Resend and notifies through Gmail', async () => {
  const response = await POST(request({ email: ' Reader@Example.com ', reason: ' Too frequent ', page_url: 'https://www.aibeat.dev/unsubscribe' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, submissionId: 'submission_123', notificationStatus: 'sent' })
  assert.equal(calls.length, 3)
  const stored = JSON.parse(String(calls[0].init?.body))
  assert.equal(stored.submission_kind, 'unsubscribe')
  assert.equal(stored.submission_email, 'reader@example.com')
  assert.equal(stored.submission_payload.reason, 'Too frequent')
  assert.match(calls[2].url, /gmail.googleapis.com/)
})
test('invalid email never contacts any service', async () => {
  assert.equal((await POST(request({ email: 'invalid' }))).status, 400)
  assert.equal(calls.length, 0)
})
test('storage failure returns an error and sends no email', async () => {
  setup({ storageFailure: true })
  assert.equal((await POST(request({ email: 'reader@example.com' }))).status, 502)
  assert.equal(calls.length, 1)
})
test('Gmail failure does not reject a saved unsubscribe request', async () => {
  setup({ gmailFailure: true })
  const response = await POST(request({ email: 'reader@example.com' }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).notificationStatus, 'failed')
  assert.equal(calls.length, 3)
})
test('missing Gmail configuration still preserves unsubscribe request', async () => {
  delete process.env.GMAIL_REFRESH_TOKEN
  const response = await POST(request({ email: 'reader@example.com' }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).notificationStatus, 'failed')
  assert.equal(calls.length, 1)
})
