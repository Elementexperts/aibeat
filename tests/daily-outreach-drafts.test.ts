import test from 'node:test'
import assert from 'node:assert/strict'
import { processDailyDrafts, fetchUnsubscribes, type DraftLedger } from '../lib/daily-outreach-drafts'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import { buildOutreachDraft } from '../lib/gmail-outreach-drafts'
import { createGmailDraft } from '../lib/gmail-newsletter-draft'

const leads = (n: number) => parseDailyManualLeads('website,email,source,tool_name\n' + Array.from({ length: n }, (_, i) => `https://tool${i}.test,hello@tool${i}.test,Manual,Tool ${i}`).join('\n')).leads
test('every eligible lead is processed; partial failure preserves progress and uncertain POST is not retried blindly', async () => {
  const rows = leads(135)
  const ledger: DraftLedger = {}
  const archived: string[] = []
  let calls = 0
  const input = { leads: rows, ledger, excluded: new Set<string>(), archived: new Set<string>(), enabled: true,
    save: async () => {}, archive: (lead: typeof rows[number]) => { archived.push(lead.email) },
    create: async (lead: typeof rows[number], lookup: boolean, reserve: () => Promise<void>) => {
      calls++
      if (lead === rows[1] && lookup) throw new Error('uncertain')
      await reserve()
      if (lead === rows[1]) throw new Error('response lost after POST')
      return { created: true, draftId: lead.id }
    },
  }
  const result = await processDailyDrafts(input)
  assert.equal(result.drafted, 134)
  assert.equal(result.failed, 1)
  assert.equal(archived.length, 134)
  calls = 0
  const repeat = await processDailyDrafts(input)
  assert.equal(calls, 1)
  assert.equal(repeat.uncertain, 1)
  assert.equal(repeat.duplicates, 134)
})
test('suppression and legacy history exclusions are applied before draft creation; disabled runs are read only', async () => {
  const rows = leads(4)
  let writes = 0
  const result = await processDailyDrafts({ leads: rows, ledger: {}, excluded: new Set([rows[0].email]), archived: new Set([rows[1].email]), enabled: false,
    save: async () => { writes++ }, archive: () => { writes++ }, create: async () => { writes++; return { created: true, draftId: 'unexpected' } },
  })
  assert.equal(result.excluded, 1)
  assert.equal(result.duplicates, 1)
  assert.equal(result.eligible, 2)
  assert.equal(writes, 0)
})
test('failed reservation persistence aborts before Gmail and before the next lead', async () => {
  let posts = 0
  await assert.rejects(processDailyDrafts({ leads: leads(2), ledger: {}, excluded: new Set(), archived: new Set(), enabled: true,
    save: async () => { throw new Error('push failed') }, archive: () => {},
    create: async (_lead, _lookup, reserve) => { await reserve(); posts++; return { created: true, draftId: 'bad' } },
  }), /reservation/)
  assert.equal(posts, 0)
})
test('campaign keys survive week changes without truncation collisions', () => {
  const lead = leads(1)[0]
  assert.equal(buildOutreachDraft(lead, new Date('2026-10-01')).key, buildOutreachDraft(lead, new Date('2027-01-01')).key)
  const prefix = 'a'.repeat(45)
  assert.notEqual(buildOutreachDraft({ ...lead, email: prefix + '1@example.com' }).key, buildOutreachDraft({ ...lead, email: prefix + '2@example.com' }).key)
})
test('unsubscribe lookup paginates and fails closed on errors', async () => {
  let calls = 0
  const set = await fetchUnsubscribes('https://example.test', 'fake', async () => {
    calls++
    return Response.json(calls === 1 ? Array.from({ length: 500 }, (_, i) => ({ email: `p${i}@example.com` })) : [{ email: ' LAST@example.com ' }])
  })
  assert.equal(set.size, 501)
  assert.ok(set.has('last@example.com'))
  await assert.rejects(fetchUnsubscribes('https://example.test', 'fake', async () => new Response('', { status: 503 })), /Suppression check failed/)
})

test('legacy weekly draft is reused; uncertain missing draft never invokes Gmail POST', async () => {
  const lead = leads(1)[0]
  for (const found of [true, false]) {
    let posts = 0
    const promise = createGmailDraft({ message: buildOutreachDraft(lead), lookupOnly: true,
      config: { to: lead.email, fromEmail: 'hello@aibeat.dev', clientId: 'c', clientSecret: 's', refreshToken: 'r' },
      fetchImpl: async (url, init) => {
        if (String(url).includes('oauth2')) return Response.json({ access_token: 'token' })
        if (init?.method === 'POST') { posts++; throw new Error('unexpected POST') }
        if (String(url).includes('/drafts?')) return Response.json({ drafts: found ? [{ id: 'legacy' }] : [] })
        return Response.json({ message: { payload: { headers: [{ name: 'To', value: lead.email }, { name: 'X-AIBeat-Newsletter-Key', value: 'aibeat-gmail-outreach-2026-W37-old' }] } } })
      },
    })
    if (found) assert.equal((await promise).draftId, 'legacy')
    else await assert.rejects(promise, /uncertain/)
    assert.equal(posts, 0)
  }
})
