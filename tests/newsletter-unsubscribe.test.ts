import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

import { POST } from '../app/api/unsubscribe/route'

type FetchCall = {
  url: string
  init?: RequestInit
}

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }
const originalInfo = console.info

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupKitFetch(options?: { subscriberId?: string; lookupStatus?: number; unsubscribeStatus?: number; storageStatus?: number; notificationStatus?: number }) {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = input.toString()
    calls.push({ url, init })

    if (url.includes('/v4/subscribers?email_address=')) {
      if (options?.lookupStatus) return new Response(null, { status: options.lookupStatus })
      return Response.json({
        subscribers: options?.subscriberId
          ? [{ id: options.subscriberId, email_address: 'reader@example.com' }]
          : [],
      })
    }

    if (url === 'https://api.resend.com/emails') return Response.json({ id: 'email_123' }, { status: options?.notificationStatus ?? 200 })

    if (url.includes('/unsubscribe')) {
      return new Response(null, { status: options?.unsubscribeStatus ?? 204 })
    }

    if (url.includes('/rest/v1/rpc/record_public_form_submission')) {
      return Response.json('submission_123', { status: options?.storageStatus ?? 200 })
    }

    return Response.json({ error: 'unknown endpoint' }, { status: 404 })
  }

  return calls
}

function resetEnv() {
  process.env = { ...originalEnv }
}

test.beforeEach(() => {
  resetEnv()
  process.env.RESEND_API_KEY = 'test_key'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable_key'
  console.info = () => undefined
})

test.afterEach(() => {
  globalThis.fetch = originalFetch
  console.info = originalInfo
  resetEnv()
})

test('unsubscribe validates email input', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  setupKitFetch()

  const res = await POST(request({ email: 'not-an-email' }))
  const body = await res.json()

  assert.equal(res.status, 400)
  assert.equal(body.error, 'Enter a valid email address')
})

test('unsubscribe looks up subscriber by email and calls Kit unsubscribe endpoint', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  const calls = setupKitFetch({ subscriberId: 'subscriber_123' })

  const res = await POST(request({
    email: 'Reader@Example.com',
    reason: 'Too frequent',
    page_url: 'https://www.aibeat.dev/newsletter#unsubscribe',
  }))
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.deepEqual(body, { success: true })
  assert.equal(calls.length, 4)
  assert.ok(calls[0].url.includes('/v4/subscribers?email_address=reader%40example.com'))
  assert.ok(calls[1].url.includes('/v4/subscribers/subscriber_123/unsubscribe'))
  assert.equal(calls[1].init?.method, 'POST')
  assert.equal(calls[2].url, 'https://project.supabase.co/rest/v1/rpc/record_public_form_submission')
  const notification = JSON.parse(String(calls[2].init?.body))
  assert.equal(notification.submission_email, 'reader@example.com')
  assert.equal(notification.submission_kind, 'unsubscribe')
})

test('unknown subscriber request returns success without calling unsubscribe endpoint', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  const calls = setupKitFetch()

  const res = await POST(request({ email: 'missing@example.com' }))
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.deepEqual(body, { success: true })
  assert.equal(calls.length, 3)
  assert.ok(calls[0].url.includes('/v4/subscribers?email_address=missing%40example.com'))
  assert.equal(calls[1].url, 'https://project.supabase.co/rest/v1/rpc/record_public_form_submission')
})

for (const subscriberId of [undefined, 'subscriber_123']) {
  for (const failure of ['storageStatus', 'notificationStatus'] as const) {
    test(`confirmed Kit outcome survives ${failure}, subscriber=${subscriberId}`, async () => {
      process.env.KIT_API_KEY = 'kit_secret'
      setupKitFetch({ subscriberId, [failure]: 503 })
      const response = await POST(request({ email: 'reader@example.com' }))
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { success: true })
    })
  }
}

for (const failure of ['lookupStatus', 'unsubscribeStatus'] as const) {
  test(`Kit ${failure} still returns an error`, async () => {
    process.env.KIT_API_KEY = 'kit_secret'
    const calls = setupKitFetch({ subscriberId: 'subscriber_123', [failure]: 503 })
    const response = await POST(request({ email: 'reader@example.com' }))
    assert.equal(response.status, 502)
    assert.ok(calls.every(({ url }) => url.startsWith('https://api.kit.com/')))
  })
}
