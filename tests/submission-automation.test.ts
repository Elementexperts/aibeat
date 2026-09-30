import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { groupSubmissions, ensureDraft, isPublished, validateTool, type State, type Submission, reviewSubmission, fetchReviewWithRetry } from '../lib/submission-automation'
import { mergeToolCatalog, productIdentity } from '../lib/automated-tool-catalog'
import { TOOLS, type Tool } from '../lib/data'

const tool: Tool = { slug: 'example', name: 'Example', tagline: 'A helpful example tool for teams', description: 'An example software product that helps teams organize and review their daily work together.', category: 'Productivity', pricing: 'Free plan available', pricingType: 'free', websiteUrl: 'https://example.com/', affiliateUrl: 'https://example.com/', rating: null, featured: false, logo: '#2563eb', logoInitials: 'E', pros: ['Shared workspace'], cons: [], alternatives: [] }
const row = (id: string, url: string, status = 'NEW'): Submission => ({ id, email: 'hello@example.com', status, created_at: `2026-09-${id.padStart(2, '0')}`, payload: { name: 'Example', url, type: 'free' } })
const state: State = { product_key: 'key', fingerprint: 'fp', submission_ids: ['id'], phase: 'prepared', tool, reason: null }

test('deduplicate tracking URLs and www, retain distinct products on a shared domain, exclude suppressed/completed', () => {
  const groups = groupSubmissions([row('1', 'https://www.example.com/?utm_source=x'), row('2', 'https://example.com/'), row('3', 'https://example.com/other'), row('4', 'https://example.com/', 'SUPPRESSED'), row('5', 'https://example.com/', 'COMPLETED')])
  assert.equal(groups.length, 2)
  assert.deepEqual(groups.find(g => g.rows.length === 2)?.rows.map(r => r.id), ['2', '1'])
  assert.throws(() => productIdentity('https://user:pass@example.com'))
  assert.throws(() => productIdentity('http://example.com'))
})
test('manual listing wins without duplicate slug or URL in website catalog', () => {
  const auto = { ...tool, slug: 'example-copy', websiteUrl: 'https://www.example.com/' }
  assert.deepEqual(mergeToolCatalog([tool], [auto]), [tool])
  assert.equal(mergeToolCatalog([tool], [{ ...tool, websiteUrl: 'https://another.example/' }]).length, 1)
})
test('generated catalog is validated and integrated exactly once', () => {
  for (const entry of JSON.parse(readFileSync('data/automated-tools.json', 'utf8'))) {
    const t = validateTool(entry)
    assert.equal(TOOLS.filter(x => productIdentity(x.websiteUrl) === productIdentity(t.websiteUrl)).length, 1)
  }
  assert.throws(() => validateTool({ ...tool, rating: 5 }))
  assert.throws(() => validateTool({ ...tool, featured: true }))
  assert.throws(() => validateTool({ ...tool, name: 'Hello\nBcc: victim' }))
})
test('a successful HTTP response alone is not proof of publication', () => {
  const page = '<title>Example — Features</title><a href="https://example.com/">Visit</a><link href="https://www.aibeat.dev/tools/example">'
  assert.equal(isPublished(tool, 200, page), true)
  assert.equal(isPublished(tool, 404, page), false)
  assert.equal(isPublished(tool, 200, '<title>AIBeat</title>not found'), false)
  assert.equal(isPublished(tool, 200, page.replace('https://example.com/', 'https://wrong.example/')), false)
})
test('draft reservation precedes creation; completed state never creates another', async () => {
  const events: string[] = []
  const drafts = { find: () => undefined, create: async () => { events.push('create'); return 'draft-1' } }
  const save = async (s: State) => { events.push(s.phase) }
  const done = await ensureDraft(state, 'hello@example.com', tool, drafts, save)
  assert.deepEqual(events, ['drafting', 'create', 'complete'])
  assert.equal(done.gmail_draft_id, 'draft-1')
  await ensureDraft(done, 'hello@example.com', tool, drafts, save)
  assert.equal(events.length, 3)
})
test('crash after Gmail acceptance reconciles existing draft without duplicate', async () => {
  let creates = 0
  const done = await ensureDraft({ ...state, phase: 'drafting' }, 'hello@example.com', tool, { find: () => 'recovered', create: async () => { creates++; return 'new' } }, async () => {})
  assert.equal(done.gmail_draft_id, 'recovered')
  assert.equal(creates, 0)
})
test('sent/deleted or uncertain draft holds for attention instead of recreating', async () => {
  await assert.rejects(ensureDraft({ ...state, phase: 'drafting' }, 'hello@example.com', tool, { find: () => undefined, create: async () => { throw new Error('must not create') } }, async () => {}), /uncertain/)
})
test('missing evidence rejects model approval and does not trust submission claims', async () => {
  const fake = (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ approved: true, reason: 'Looks good', evidence: [{ url: 'https://example.com/', quote: 'Invented capabilities' }, { url: 'https://example.com/', quote: 'Invented pricing' }] }) }] } }] }))) as typeof fetch
  await assert.rejects(reviewSubmission(row('1', 'https://example.com/'), [{ url: 'https://example.com/', text: 'Example: an actual official page.' }], 'test', fake), /evidence/)
})

test('review request contains public page evidence only, never private form fields', async () => {
  const submitted = row('1', 'https://example.com/')
  submitted.payload.description = 'PRIVATE FORM DESCRIPTION'
  const fake = (async (_url: unknown, init: RequestInit) => {
    const body = String(init.body)
    assert.ok(!body.includes(submitted.email))
    assert.ok(!body.includes('PRIVATE FORM DESCRIPTION'))
    assert.ok(body.includes('Example public website'))
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ approved: false, reason: 'Insufficient pricing evidence' }) }] } }] }))
  }) as typeof fetch
  assert.equal((await reviewSubmission(submitted, [{ url: 'https://example.com/', text: 'Example public website' }], 'test', fake)).tool, null)
})

test('temporary reviewer outages retry within a bound; authentication errors do not', async () => {
  const calls: number[] = []
  const responses = [503, 429, 200]
  const fetcher = (async () => { const status = responses[calls.length]; calls.push(status); return new Response('{}', { status }) }) as typeof fetch
  assert.equal((await fetchReviewWithRetry('https://example.com', {}, fetcher, async () => {})).status, 200)
  assert.deepEqual(calls, [503, 429, 200])
  let attempts = 0
  const permanent = (async () => { attempts++; return new Response('{}', { status: 403 }) }) as typeof fetch
  assert.equal((await fetchReviewWithRetry('https://example.com', {}, permanent, async () => {})).status, 403)
  assert.equal(attempts, 1)
  attempts = 0
  const outage = (async () => { attempts++; return new Response('{}', { status: 503 }) }) as typeof fetch
  assert.equal((await fetchReviewWithRetry('https://example.com', {}, outage, async () => {})).status, 503)
  assert.equal(attempts, 3)
})

 test('email addresses cannot be published as product names', async () => {
  const submission = row('1', 'https://example.com/');
  submission.payload.name = 'support@example.com';
  const result = await reviewSubmission(submission, [{url: 'https://example.com/', text: 'Contact support@example.com for our software.'}], 'unused', async () => { throw new Error('Reviewer must not run'); });
  assert.equal(result.tool, null);
  assert.match(result.reason, /email address/);
});

test('reviewed MangaTranslate language URLs share one identity without collapsing other products', () => {
  const paths = ['/', '/ai-manga-translator/', '/ko/ai-manga-translator/', '/ru/ai-manga-translator/', '/ar/ai-manga-translator/']
  for (const path of paths) assert.equal(productIdentity('https://www.mangatranslate.com' + path), 'mangatranslate.com')
  assert.notEqual(productIdentity('https://www.mangatranslate.com/another-product'), 'mangatranslate.com')
  assert.notEqual(productIdentity('https://example.com/ko/product'), productIdentity('https://example.com/product'))
})

test('existing listing reconciliation requires production identity before completing requests', async () => {
  const { reconcileExistingListing } = await import('../lib/submission-automation')
  const events: string[] = []
  const store = { save: async () => { events.push('saved') }, complete: async (ids: string[]) => { assert.deepEqual(ids, state.submission_ids); events.push('completed') } }
  const fake = (html: string) => (async () => new Response(html)) as typeof fetch
  assert.equal(await reconcileExistingListing(store, state, tool, fake('<title>Not found</title>')), false)
  assert.deepEqual(events, [])
  assert.equal(await reconcileExistingListing(store, state, tool, fake('<title>Example</title><a href="https://example.com/">Visit</a><link href="https://www.aibeat.dev/tools/example">')), true)
  assert.deepEqual(events, ['saved', 'completed'])
})

test('Toolsvio homepage and tools index match its already featured listing', () => {
  assert.equal(productIdentity('https://www.toolsvio.online/'), productIdentity('https://www.toolsvio.online/tools'))
  assert.notEqual(productIdentity('https://www.toolsvio.online/tools/word-counter'), productIdentity('https://www.toolsvio.online/'))
})
