import test from 'node:test'
import assert from 'node:assert/strict'
import { newsletterAudience, syncNewsletterContacts, type AudienceRow } from '../lib/newsletter-contacts'

const row = (id: string, email: string, kind: AudienceRow['kind'] = 'newsletter', status = 'NEW'): AudienceRow => ({ id, email, kind, status })
const group = { name: 'Newsletter', resourceName: 'contactGroups/newsletter' }
const membership = { contactGroupMembership: { contactGroupResourceName: group.resourceName } }
function mock(responses: unknown[]) {
  const calls: Array<{ url: string; body: any }> = []
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined })
    assert.ok(responses.length, 'Unexpected API call')
    const response = responses.shift()
    return response instanceof Response ? response : Response.json(response)
  }
  return { calls, fetcher }
}

test('audience deduplicates consent and honors completed opt-outs', () => {
  const result = newsletterAudience([row('1', ' A@example.com '), row('2', 'a@example.com'), row('3', 'b@example.com'), row('4', 'B@example.com', 'unsubscribe', 'COMPLETED'), row('5', 'bad'), row('6', 'tool@example.com', 'tool_submission'), row('7', 'c@example.com', 'newsletter', 'SUPPRESSED')])
  assert.deepEqual(Array.from(result.subscribers), [['a@example.com', ['1', '2']]])
  assert.deepEqual(Array.from(result.suppressed).sort(), ['b@example.com', 'c@example.com'])
})

test('existing labeled contacts are idempotent across completed requests', async () => {
  const api = mock([{ contactGroups: [group] }, { connections: [{ resourceName: 'people/a', emailAddresses: [{ value: 'a@example.com' }], memberships: [membership] }] }])
  const result = await syncNewsletterContacts([row('1', 'a@example.com', 'newsletter', 'COMPLETED')], 'token', api.fetcher)
  assert.deepEqual(result, { created: 0, added: 0, removed: 0, completedIds: ['1'], conflicts: [] })
  assert.equal(api.calls.length, 2)
})

test('paginates groups and contacts, reuses contacts and adds only Newsletter membership', async () => {
  const api = mock([{ nextPageToken: 'group page' }, { contactGroups: [group] }, { nextPageToken: 'people page' }, { connections: [{ resourceName: 'people/a', emailAddresses: [{ value: 'a@example.com' }] }] }, {}])
  const result = await syncNewsletterContacts([row('1', 'a@example.com')], 'token', api.fetcher)
  assert.equal(result.created, 0)
  assert.equal(result.added, 1)
  assert.match(api.calls[1].url, /pageToken=group%20page/)
  assert.match(api.calls[3].url, /pageToken=people%20page/)
  assert.deepEqual(api.calls[4].body, { resourceNamesToAdd: ['people/a'] })
})

test('creates a missing group and one contact for duplicate signups', async () => {
  const api = mock([{}, {}, group, { resourceName: 'people/a', emailAddresses: [{ value: 'a@example.com' }] }, {}])
  const result = await syncNewsletterContacts([row('1', 'a@example.com'), row('2', 'a@example.com')], 'token', api.fetcher)
  assert.equal(result.created, 1)
  assert.deepEqual(result.completedIds, ['1', '2'])
  assert.deepEqual(api.calls[2].body, { contactGroup: { name: 'Newsletter' } })
  assert.deepEqual(api.calls[3].body, { emailAddresses: [{ value: 'a@example.com' }] })
})

test('removes opt-outs before adding subscribers and holds mixed-consent contacts', async () => {
  const api = mock([{ contactGroups: [group] }, { connections: [{ resourceName: 'people/mixed', emailAddresses: [{ value: 'out@example.com' }, { value: 'in@example.com' }], memberships: [membership] }, { resourceName: 'people/new', emailAddresses: [{ value: 'new@example.com' }] }] }, {}, {}])
  const result = await syncNewsletterContacts([row('1', 'out@example.com', 'unsubscribe'), row('2', 'in@example.com'), row('3', 'new@example.com')], 'token', api.fetcher)
  assert.deepEqual(api.calls[2].body, { resourceNamesToRemove: ['people/mixed'] })
  assert.deepEqual(api.calls[3].body, { resourceNamesToAdd: ['people/new'] })
  assert.deepEqual(result.conflicts, ['2'])
  assert.deepEqual(result.completedIds, ['3'])
})

test('permission errors fail before contact writes', async () => {
  const api = mock([new Response('', { status: 403 })])
  await assert.rejects(syncNewsletterContacts([row('1', 'a@example.com')], 'token', api.fetcher), /contacts scope/)
  assert.equal(api.calls.length, 1)
})

test('membership partial failures cannot mark requests completed', async () => {
  const api = mock([{ contactGroups: [group] }, { connections: [{ resourceName: 'people/a', emailAddresses: [{ value: 'a@example.com' }] }] }, { notFoundResourceNames: ['people/a'] }])
  await assert.rejects(syncNewsletterContacts([row('1', 'a@example.com')], 'token', api.fetcher), /not applied/)
})

test('ambiguous Newsletter groups stop rather than choosing a mailing audience', async () => {
  const api = mock([{ contactGroups: [group, { name: 'NEWSLETTER', resourceName: 'contactGroups/other' }] }])
  await assert.rejects(syncNewsletterContacts([], 'token', api.fetcher), /Multiple Newsletter/)
  assert.equal(api.calls.length, 1)
})
