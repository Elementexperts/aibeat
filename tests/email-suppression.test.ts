import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { EmailSuppressionService, SuppressionUnavailableError, RecipientSuppressedError, normalizeEmail, filterMarketingRecipients, deliverEmail } from '../lib/email-suppression'
import { createGmailDraft, createGmailNewsletterDraft } from '../lib/gmail-newsletter-draft'
import { buildLatestNewsNewsletter } from '../lib/latest-news-newsletter'
import { buildWeeklyToolsNewsletter } from '../lib/weekly-tools-newsletter'
import { KitClient } from '../lib/kit/client'
import { syncNewsletterContacts } from '../lib/newsletter-contacts'
import { createIndividualLeadDrafts } from '../lib/outreach-workflow'
import { POST as unsubscribe } from '../app/api/unsubscribe/route'
import { POST as subscribe } from '../app/api/subscribe/route'
import { suppressionEnv } from './helpers/suppression'

const id = '00000000-0000-4000-8000-000000000999'
function database(initial: string[] = []) {
  const blocked = new Set(initial.map(normalizeEmail))
  const requests: Array<{ name: string; body: any; init?: RequestInit }> = []
  const fetchImpl: typeof fetch = async (url, init) => {
    const name = String(url).split('/').pop()!
    const body = JSON.parse(String(init?.body))
    requests.push({ name, body, init })
    assert.match(String(url), /^https:\/\/suppression-test\.supabase\.co\/rest\/v1\/rpc\//)
    if (name === 'check_marketing_recipients') return Response.json(body.recipient_emails.filter((email: string) => blocked.has(email)))
    if (name === 'record_email_unsubscribe') { blocked.add(body.submission_email); return Response.json(id) }
    if (name === 'list_marketing_suppressions') return Response.json(Array.from(blocked).sort().slice(body.page_offset, body.page_offset + 500))
    throw new Error('Unexpected database request')
  }
  return { blocked, requests, fetchImpl, service: new EmailSuppressionService({ env: suppressionEnv, fetchImpl }) }
}
const config = { clientId: 'fake', clientSecret: 'fake', refreshToken: 'fake', to: 'reader@example.com', fromEmail: 'hello@aibeat.dev' }
const message = { to: config.to, subject: 'Promotion', html: '<p>Promotion</p>', plainText: 'Promotion', key: 'test-promotion' }
function gmail(onLookup?: () => void) {
  const writes: string[] = []
  const fetchImpl: typeof fetch = async (url, init) => {
    if (String(url).includes('oauth2')) return Response.json({ access_token: 'synthetic' })
    if (String(url).includes('/drafts?')) { onLookup?.(); return Response.json({ drafts: [] }) }
    assert.equal(String(url), 'https://gmail.googleapis.com/gmail/v1/users/me/drafts')
    assert.equal(init?.method, 'POST'); writes.push(String(url)); return Response.json({ id: 'draft-test' })
  }
  return { writes, fetchImpl }
}

test('normalizes casing and whitespace, rejects lists and header injection', () => {
  assert.equal(normalizeEmail(' Reader@Example.COM '), 'reader@example.com')
  for (const email of ['bad', 'a@example.com,b@example.com', 'a@example.com\r\nBcc:x@example.com', 'Reader <a@example.com>']) assert.throws(() => normalizeEmail(email))
})
test('previous suppression blocks mixed-case recipients and sends no message', async () => {
  const db = database(['reader@example.com']); let sent = 0
  await assert.rejects(deliverEmail('marketing', [' READER@EXAMPLE.COM '], async () => ++sent, db.service), RecipientSuppressedError)
  assert.equal(sent, 0)
  assert.equal(db.requests[0].init?.cache, 'no-store')
})
test('bulk filtering excludes suppressed recipients in all batches', async () => {
  const db = database(['p1@example.com', 'p401@example.com'])
  const rows = Array.from({ length: 450 }, (_, i) => ({ email: `p${i}@example.com` }))
  assert.equal((await filterMarketingRecipients(rows, r => r.email, db.service)).length, 448)
  assert.deepEqual(db.requests.map(r => r.body.recipient_emails.length), [200, 200, 50])
})
test('database errors, malformed JSON/results and missing configuration fail closed', async () => {
  const cases: Array<typeof fetch> = [async () => { throw new Error('secret in upstream error') }, async () => new Response('', { status: 503 }), async () => new Response('invalid'), async () => Response.json({ error: 'unexpected' }), async () => Response.json(['unrequested@example.com'])]
  for (const fetchImpl of cases) {
    let sent = 0
    const service = new EmailSuppressionService({ env: suppressionEnv, fetchImpl })
    await assert.rejects(deliverEmail('marketing', ['reader@example.com'], async () => ++sent, service), e => e instanceof SuppressionUnavailableError && !e.message.includes('secret'))
    assert.equal(sent, 0)
  }
  await assert.rejects(new EmailSuppressionService({ env: {} }).assertAllowed(['reader@example.com']), SuppressionUnavailableError)
})
test('anonymous credentials receiving denied RPC cannot appear to be an empty list', async () => {
  const service = new EmailSuppressionService({ env: suppressionEnv, fetchImpl: async () => new Response('', { status: 403 }) })
  await assert.rejects(service.assertAllowed(['reader@example.com']), SuppressionUnavailableError)
})
test('duplicate opt-outs normalize to one suppression and preserve submission requests', async () => {
  const db = database()
  await db.service.unsubscribe(' READER@EXAMPLE.COM ', { reason: 'Too frequent' })
  await db.service.unsubscribe('reader@example.com', { reason: 'Still opted out' })
  assert.equal(db.blocked.size, 1)
  assert.equal(db.requests.filter(r => r.name === 'record_email_unsubscribe').length, 2)
  assert.equal(db.requests[0].body.submission_payload.reason, 'Too frequent')
  await assert.rejects(db.service.assertAllowed(['reader@example.com']), RecipientSuppressedError)
})
test('uncached preflight blocks a new unsubscribe after bulk filtering', async () => {
  const db = database(); const rows = await filterMarketingRecipients([config.to], r => r, db.service)
  await db.service.unsubscribe(config.to, {})
  let sent = false
  await assert.rejects(deliverEmail('marketing', rows, async () => { sent = true }, db.service), RecipientSuppressedError)
  assert.equal(sent, false)
})
test('password reset, security and transactional notifications survive database outage', async () => {
  const guard = new EmailSuppressionService({ env: {} })
  for (const purpose of ['password-reset', 'security-notification', 'internal-form-notification', 'submission-confirmation'] as const) {
    assert.equal(await deliverEmail(purpose, ['reader@example.com'], async () => 'delivered', guard), 'delivered')
  }
})
test('Gmail outreach rechecks after token refresh and draft lookup before POST', async () => {
  const db = database(); const api = gmail(() => db.blocked.add(config.to))
  await assert.rejects(createGmailDraft({ message, config, suppression: db.service, fetchImpl: api.fetchImpl }), RecipientSuppressedError)
  assert.equal(api.writes.length, 0)
  assert.equal(db.requests.length, 2)
})
test('Gmail rechecks after reservation callback and prevents header-list bypass', async () => {
  const db = database(); const api = gmail()
  await assert.rejects(createGmailDraft({ message, config, suppression: db.service, fetchImpl: api.fetchImpl, beforeCreate: async () => { db.blocked.add(config.to) } }), RecipientSuppressedError)
  await assert.rejects(createGmailDraft({ message: { ...message, to: 'a@example.com,b@example.com' }, config, suppression: db.service, fetchImpl: api.fetchImpl }), /one bare/)
  assert.equal(api.writes.length, 0)
})
test('Wednesday news and Friday tools draft entry points block suppressed recipients', async () => {
  const db = database([config.to]); const api = gmail()
  await assert.rejects(createGmailNewsletterDraft({ newsletter: buildLatestNewsNewsletter(), config, suppression: db.service, fetchImpl: api.fetchImpl }), RecipientSuppressedError)
  const tools = buildWeeklyToolsNewsletter()
  await assert.rejects(createGmailDraft({ message: { ...message, ...tools }, config, suppression: db.service, fetchImpl: api.fetchImpl }), RecipientSuppressedError)
  assert.equal(api.writes.length, 0)
})
test('Kit subscriber creation is suppressed before provider contact', async () => {
  const db = database([config.to]); let requests = 0
  const client = new KitClient({ apiKey: 'fake', suppression: db.service, fetchImpl: async () => { requests++; throw new Error('not expected') } })
  await assert.rejects(client.createOrUpdateSubscriber({ email_address: config.to }), RecipientSuppressedError)
  assert.equal(requests, 0)
})
test('Kit retries recheck suppression before a second write', async () => {
  const db = database(); let writes = 0
  const client = new KitClient({ apiKey: 'fake', suppression: db.service, fetchImpl: async () => { writes++; db.blocked.add(config.to); return Response.json({}, { status: 503 }) } })
  await assert.rejects(client.createOrUpdateSubscriber({ email_address: config.to }), RecipientSuppressedError)
  assert.equal(writes, 1)
})
test('Kit tag operations resolve current email from the provider, not stale local data', async () => {
  const db = database([config.to]); let writes = 0
  const client = new KitClient({ apiKey: 'fake', suppression: db.service, fetchImpl: async (_url, init) => { if (init?.method === 'POST') writes++; return Response.json({ subscriber: { id: '1', email_address: config.to } }) } })
  await assert.rejects(client.tagSubscriber('tag', '1'), RecipientSuppressedError)
  assert.equal(writes, 0)
})
const broadcast = { subject: 'Promo', content: 'Promo', public: false, send_at: null, subscriber_filter: [{ all: [{ type: 'tag' as const, ids: ['tag'] }] }] }
test('Kit broadcast inspects all tag pages and blocks an unexpected suppressed member', async () => {
  const db = database([config.to]); let writes = 0; let pages = 0
  const client = new KitClient({ apiKey: 'fake', suppression: db.service, fetchImpl: async (_url, init) => {
    if (init?.method === 'POST') { writes++; return Response.json({ broadcast: { id: '1' } }) }
    pages++; return Response.json({ subscribers: [{ email_address: pages === 1 ? 'allowed@example.com' : config.to }], pagination: { has_next_page: pages === 1, end_cursor: 'next' } })
  } })
  await assert.rejects(client.createBroadcast(broadcast), RecipientSuppressedError)
  assert.equal(pages, 2); assert.equal(writes, 0)
})
test('provider-side scheduling cannot bypass checks through either broadcast method', async () => {
  let calls = 0
  const client = new KitClient({ apiKey: 'fake', fetchImpl: async () => { calls++; throw new Error('not expected') } })
  await assert.rejects(client.createBroadcast({ ...broadcast, public: true, send_at: '2030-01-01T00:00:00Z' }), /scheduling is blocked/)
  await assert.rejects(client.updateBroadcast('1', { send_at: '2030-01-01T00:00:00Z' }), /scheduling is blocked/)
  assert.equal(calls, 0)
})
test('ambiguous Kit filter and incomplete pagination fail closed', async () => {
  const db = database()
  const client = new KitClient({ apiKey: 'fake', suppression: db.service, fetchImpl: async () => Response.json({ subscribers: [] }) })
  await assert.rejects(client.createBroadcast({ ...broadcast, subscriber_filter: [] }), /Ambiguous/)
  await assert.rejects(client.createBroadcast(broadcast), /Incomplete/)
})
test('central suppression removes a Google Contacts audience member absent from legacy opt-outs', async () => {
  const db = database([config.to]); const writes: any[] = []
  const fetchImpl: typeof fetch = async (url, init) => {
    if (String(url).includes('contactGroups?')) return Response.json({ contactGroups: [{ name: 'Newsletter', resourceName: 'contactGroups/newsletter' }] })
    if (String(url).includes('connections?')) return Response.json({ connections: [{ resourceName: 'people/reader', emailAddresses: [{ value: config.to }], memberships: [{ contactGroupMembership: { contactGroupResourceName: 'contactGroups/newsletter' } }] }] })
    writes.push(JSON.parse(String(init?.body))); return Response.json({})
  }
  const result = await syncNewsletterContacts([{ id: '1', kind: 'newsletter', email: config.to, status: 'NEW' }], 'fake', fetchImpl, db.service)
  assert.equal(result.removed, 1); assert.equal(result.added, 0)
  assert.deepEqual(writes, [{ resourceNamesToRemove: ['people/reader'] }])
})
test('Google Contacts never mutates on database outage', async () => {
  let calls = 0
  await assert.rejects(syncNewsletterContacts([{ id: '1', kind: 'newsletter', email: config.to, status: 'NEW' }], 'fake', async () => { calls++; throw new Error('not expected') }, new EmailSuppressionService({ env: {} })), SuppressionUnavailableError)
  assert.equal(calls, 0)
})

test('unsubscribe endpoint has uniform response, immediate block and no resubscribe', async () => {
  const originalEnv = process.env; const originalFetch = globalThis.fetch
  const db = database()
  try {
    process.env = { NODE_ENV: 'test', ...suppressionEnv, KIT_API_KEY: 'fake', KIT_FORM_ID: '1' }
    globalThis.fetch = db.fetchImpl // Missing Gmail credentials: no real notification; opt-out still succeeds.
    for (let i = 0; i < 2; i++) {
      const response = await unsubscribe(new NextRequest('http://localhost/api/unsubscribe', { method: 'POST', body: JSON.stringify({ email: ' READER@example.com ', reason: 'No marketing' }) }))
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { success: true, submissionId: id, notificationStatus: 'failed' })
    }
    const result = await subscribe(new NextRequest('http://localhost/api/subscribe', { method: 'POST', body: JSON.stringify({ email: config.to }) }))
    assert.equal(result.status, 200); assert.deepEqual(await result.json(), { success: true })
    assert.equal(db.blocked.size, 1)
    assert.ok(db.requests.every(r => ['record_email_unsubscribe', 'check_marketing_recipients'].includes(r.name)))
  } finally { process.env = originalEnv; globalThis.fetch = originalFetch }
})
