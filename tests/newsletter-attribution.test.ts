import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

import {
  getAttributionLimits,
  getKitReferrer,
  getSourceKey,
  getSourceTagEnvName,
  getSourceTagId,
  normalizeUtmSource,
  sanitizeNewsletterAttribution,
} from '../lib/newsletter-attribution'
import { POST } from '../app/api/subscribe/route'

type FetchCall = {
  url: string
  init?: RequestInit
}

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }
const originalWarn = console.warn

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupKitFetch(options?: { failTag?: boolean }) {
  const calls: FetchCall[] = []

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = input.toString()
    calls.push({ url, init })

    if (url.includes('/v4/subscribers')) {
      return Response.json({ subscriber: { id: 'subscriber_123' } })
    }

    if (url.includes('/v4/forms/')) {
      return Response.json({ ok: true })
    }

    if (url.includes('/v4/tags/')) {
      return options?.failTag
        ? Response.json({ error: 'tag failed' }, { status: 500 })
        : Response.json({ ok: true })
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
  console.warn = () => undefined
})

test.afterEach(() => {
  globalThis.fetch = originalFetch
  console.warn = originalWarn
  resetEnv()
})

test('UTM source normalization', () => {
  assert.equal(normalizeUtmSource(' LinkedIn '), 'linkedin')
  assert.equal(normalizeUtmSource('cross-promotion'), 'cross_promotion')
  assert.equal(normalizeUtmSource('Newsletter Partner'), 'newsletter_partner')
})

test('source-to-environment-tag mapping', () => {
  process.env.KIT_TAG_SOURCE_LINKEDIN = 'tag_linkedin'
  const attribution = sanitizeNewsletterAttribution({
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=linkedin',
    utm_source: 'linkedin',
  })

  const source = getSourceKey(attribution)
  assert.equal(source, 'linkedin')
  assert.equal(getSourceTagEnvName(source), 'KIT_TAG_SOURCE_LINKEDIN')
  assert.equal(getSourceTagId(process.env, source), 'tag_linkedin')
})

test('missing attribution uses fallback referrer and other source', () => {
  const attribution = sanitizeNewsletterAttribution({})

  assert.equal(getKitReferrer(attribution), 'https://www.aibeat.dev/newsletter')
  assert.equal(getSourceKey(attribution), 'other')
})

test('missing source with AIBeat page URL maps to direct', () => {
  const attribution = sanitizeNewsletterAttribution({
    page_url: 'https://www.aibeat.dev/newsletter',
  })

  assert.equal(getSourceKey(attribution), 'direct')
})

test('unknown source maps to other', () => {
  const attribution = sanitizeNewsletterAttribution({
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=randomsite',
    utm_source: 'randomsite',
  })

  assert.equal(getSourceKey(attribution), 'other')
})

test('malformed and overly long attribution is discarded or trimmed', () => {
  const limits = getAttributionLimits()
  const attribution = sanitizeNewsletterAttribution({
    page_url: 'not a url',
    referrer: `https://example.com/${'x'.repeat(limits.maxUrlLength)}`,
    utm_campaign: 'a'.repeat(limits.maxTextLength + 25),
  })

  assert.equal(attribution.page_url, undefined)
  assert.equal(attribution.referrer, undefined)
  assert.equal(attribution.utm_campaign?.length, limits.maxTextLength)
})

test('tagging failure does not reverse a successful subscription', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  process.env.KIT_FORM_ID = 'form_123'
  process.env.KIT_TAG_SOURCE_LINKEDIN = 'tag_linkedin'

  setupKitFetch({ failTag: true })

  const res = await POST(request({
    email: 'Reader@Example.com',
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=linkedin&utm_campaign=daily_brief',
    utm_source: 'linkedin',
  }))
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.deepEqual(body, { success: true })
})

test('missing tag ID does not block subscription', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  process.env.KIT_FORM_ID = 'form_123'
  delete process.env.KIT_TAG_SOURCE_REDDIT

  const calls = setupKitFetch()

  const res = await POST(request({
    email: 'reader@example.com',
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=reddit',
    utm_source: 'reddit',
  }))

  assert.equal(res.status, 200)
  assert.equal(calls.some((call) => call.url.includes('/v4/tags/')), false)
})

test('validated page URL is sent to Kit as referrer', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  process.env.KIT_FORM_ID = 'form_123'

  const calls = setupKitFetch()
  const pageUrl = 'https://www.aibeat.dev/newsletter?utm_source=fazier&utm_medium=directory'

  const res = await POST(request({
    email: 'reader@example.com',
    page_url: pageUrl,
    referrer: 'https://www.google.com/',
    utm_source: 'fazier',
  }))

  assert.equal(res.status, 200)
  const formCall = calls.find((call) => call.url.includes('/v4/forms/'))
  assert.equal(JSON.parse(String(formCall?.init?.body)).referrer, pageUrl)
})

test('no API keys or tag IDs are sent to the browser', async () => {
  process.env.KIT_API_KEY = 'kit_secret'
  process.env.KIT_FORM_ID = 'form_123'
  process.env.KIT_TAG_SOURCE_UNEED = 'tag_uneed'

  setupKitFetch()

  const res = await POST(request({
    email: 'reader@example.com',
    page_url: 'https://www.aibeat.dev/newsletter?utm_source=uneed',
    utm_source: 'uneed',
  }))
  const bodyText = JSON.stringify(await res.json())
  const subscribeForm = readFileSync(join(process.cwd(), 'components', 'subscribe', 'SubscribeForm.tsx'), 'utf-8')

  assert.equal(res.status, 200)
  assert.equal(bodyText.includes('kit_secret'), false)
  assert.equal(bodyText.includes('tag_uneed'), false)
  assert.equal(subscribeForm.includes('KIT_API_KEY'), false)
  assert.equal(subscribeForm.includes('KIT_TAG_SOURCE_'), false)
})
