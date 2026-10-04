import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from '../app/api/newsletter-request/route'

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }

function request(body: unknown) {
  return new NextRequest('http://localhost/api/newsletter-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

test.afterEach(() => {
  globalThis.fetch = originalFetch
  process.env = { ...originalEnv }
})

test('stores a newsletter request in Supabase and sends an owner notification', async () => {
  process.env.GMAIL_CLIENT_ID = 'client'
  process.env.GMAIL_CLIENT_SECRET = 'secret'
  process.env.GMAIL_REFRESH_TOKEN = 'refresh'
  process.env.SUBMISSION_TO_EMAIL = 'info@aibeat.dev'
  delete process.env.NEWSLETTER_TO_EMAIL
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable_key'
  const calls: Array<{ url: string; init?: RequestInit }> = []
  globalThis.fetch = async (input, init) => {
    if (input.toString().includes('oauth2.googleapis.com')) return Response.json({ access_token: 'token' })
    calls.push({ url: input.toString(), init })
    return input.toString().includes('gmail.googleapis.com') ? Response.json({ id: 'email_123' }) : Response.json('submission_123')
  }

  const response = await POST(request({
    email: 'Reader@Example.com',
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=direct',
    utm_source: 'direct',
  }))

  assert.equal(response.status, 200)
  assert.equal(calls.length, 2)
  assert.match(Buffer.from(JSON.parse(String(calls[1].init?.body)).raw, 'base64url').toString(), /To: hello@aibeat.dev, info@aibeat.dev/)
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/rpc/record_public_form_submission')
  const payload = JSON.parse(String(calls[0].init?.body))
  assert.equal(payload.submission_kind, 'newsletter')
  assert.equal(payload.submission_email, 'reader@example.com')
  assert.equal(payload.submission_payload.utm_source, 'direct')
})

test('rejects invalid subscriber email without sending', async () => {
  let called = false
  globalThis.fetch = async () => {
    called = true
    return Response.json({})
  }

  const response = await POST(request({ email: 'not-an-email' }))
  assert.equal(response.status, 400)
  assert.equal(called, false)
})

test('newsletter storage success survives Gmail failure and returns the stored ID', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable_key'
  process.env.GMAIL_CLIENT_ID = 'client'
  process.env.GMAIL_CLIENT_SECRET = 'secret'
  process.env.GMAIL_REFRESH_TOKEN = 'refresh'
  let saves = 0
  globalThis.fetch = async input => {
    if (String(input).includes('/rpc/')) { saves++; return Response.json('saved-newsletter') }
    return new Response('', { status: 503 })
  }
  const response = await POST(request({ email: 'reader@example.com' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, submissionId: 'saved-newsletter', notificationStatus: 'failed' })
  assert.equal(saves, 1)
})

test('newsletter database failure does not claim success or notify Gmail', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable_key'
  let calls = 0
  globalThis.fetch = async input => { calls++; assert.match(String(input), /\/rpc\//); return new Response('', { status: 503 }) }
  const response = await POST(request({ email: 'reader@example.com' }))
  assert.equal(response.status, 502)
  assert.equal(calls, 1)
})
