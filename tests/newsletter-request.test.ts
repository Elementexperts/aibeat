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

test('emails a newsletter request through Resend without calling Kit', async () => {
  process.env.RESEND_API_KEY = 'resend_secret'
  process.env.SUBMISSION_TO_EMAIL = 'owner@gmail.com'
  process.env.SUBMISSION_FROM_EMAIL = 'AIBeat <submissions@aibeat.dev>'
  const calls: Array<{ url: string; init?: RequestInit }> = []
  globalThis.fetch = async (input, init) => {
    calls.push({ url: input.toString(), init })
    return Response.json({ id: 'email_123' })
  }

  const response = await POST(request({
    email: 'Reader@Example.com',
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=direct',
    utm_source: 'direct',
  }))

  assert.equal(response.status, 200)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://api.resend.com/emails')
  const payload = JSON.parse(String(calls[0].init?.body))
  assert.deepEqual(payload.to, ['owner@gmail.com'])
  assert.equal(payload.reply_to, 'reader@example.com')
  assert.match(payload.subject, /Newsletter Signup/)
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
