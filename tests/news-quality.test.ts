import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { QUALITY, classifySource } from '../scripts/news-quality/config'
import { checkFresh, cleanDraft, duplicateEvent, renderDraft } from '../scripts/news-quality/gate'
import { evaluateCandidate, processCandidate } from '../scripts/news-quality/pipeline'
import { SourceFetcher, extractSource, canonicalSource, collectSources, mergeSourceOrigins } from '../scripts/news-quality/sources'
import { documentLinks, publicationDate } from '../scripts/news-quality/documents'
import { discoverFeed } from '../scripts/news-quality/feeds'
import { diagnosticUrl } from '../scripts/news-quality/diagnostics'
import { createModel } from '../scripts/news-quality/model'
import { auditStories } from '../scripts/news-quality/audit'
import { Rejection, type Candidate, type FactSheet, type Draft, type Review, type Source, type Model } from '../scripts/news-quality/types'

const now = new Date('2026-09-16T12:00:00Z')
const candidate: Candidate = { title: 'Acme launches Atlas editor', url: 'https://acme.example/news/atlas', publishedAt: '2026-09-15T09:00:00Z' }
const excerpt = 'Acme launched the Atlas editor for developers on September 15, 2026.'
const primary: Source = { id: 's1', url: candidate.url, name: 'Acme', tier: 1, group: 'acme', text: excerpt + ' It provides an editing workspace.', publishedAt: candidate.publishedAt, links: [] }
const reporting: Source = { ...primary, id: 's2', name: 'Independent News', url: 'https://reporter.example/atlas', tier: 2, group: 'reporter', text: excerpt + ' Our reporter attended the launch.' }
const facts: FactSheet = {
  story: candidate.title, event: { entities: ['Acme'], action: 'launch', product: 'Atlas', eventDate: '2026-09-15' }, eventSourceId: 's1', eventDateEvidence: candidate.publishedAt,
  confirmedFacts: [{ id: 'f1', claim: 'Acme launched the Atlas editor for developers.', core: true, confidence: 95, supportedBy: [{ sourceId: 's1', excerpt }] }],
  uncertainClaims: [], conflictingClaims: [], riskLevel: 'low', confidence: 95,
}
const draft: Draft = { title: candidate.title, deck: 'Acme announced its Atlas editor for developers.', sections: [
  { heading: 'What happened', kind: 'facts', paragraphs: [{ text: 'Acme announced the Atlas editor for developers.', factIds: ['f1'] }] },
  { heading: 'Why it matters', kind: 'analysis', paragraphs: [{ text: 'For developers, this could provide another editing option to evaluate.', factIds: ['f1'] }] },
] }
const review: Review = { supportedFactIds: ['f1'], unsupportedClaims: [], conflictingClaims: [], unverifiedEntities: [], derivativeGroups: [], authoritativePrimaryIds: ['s1'], eventDateVerified: true, independentReporting: false, analysisGrounded: true, originalValue: true, clearWriting: true, riskLevel: 'low' }
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
function model(f = facts, d = draft, r = review): Model { return async stage => clone(stage === 'facts' ? f : stage === 'draft' ? d : r) }
const rejected = (reason: string) => (error: unknown) => error instanceof Rejection && error.reason === reason

test('a reliable primary-source story passes as a concise original brief', async () => {
  const approved = await evaluateCandidate(candidate, [primary], [], model(), now)
  assert.ok(approved.qualityScore >= QUALITY.publishThreshold)
  assert.ok(renderDraft(approved.draft).includes('<h2>AIBeat analysis</h2>'))
  assert.ok(renderDraft(approved.draft).split(' ').length < 100)
})
test('two independent reputable secondary sources can support ordinary news', async () => {
  const f = clone(facts); f.confirmedFacts[0].supportedBy.push({ sourceId: 's2', excerpt })
  const approved = await evaluateCandidate(candidate, [{ ...primary, tier: 2 }, reporting], [], model(f, draft, { ...review, authoritativePrimaryIds: [], independentReporting: true }), now)
  assert.ok(approved.qualityScore >= QUALITY.publishThreshold)
})
test('a single weak discovery source is rejected without a model call', async () => {
  let calls = 0
  await assert.rejects(evaluateCandidate(candidate, [{ ...primary, tier: 3 }], [], async () => { calls++; return {} }, now), rejected('INSUFFICIENT_EVIDENCE'))
  assert.equal(calls, 0)
})
test('high-risk reporting without a primary source is rejected regardless of model confidence', async () => {
  await assert.rejects(evaluateCandidate({ ...candidate, title: 'Acme faces a lawsuit' }, [{ ...primary, tier: 2 }, reporting], [], model(), now), rejected('NO_PRIMARY_SOURCE'))
})
test('high-risk reporting also requires independent reputable corroboration for each fact', async () => {
  await assert.rejects(evaluateCandidate({ ...candidate, title: 'Acme faces a lawsuit' }, [primary], [], model(), now), rejected('UNVERIFIED_HIGH_RISK_CLAIM'))
})
test('high-risk facts pass only with primary and independent reporting for every fact', async () => {
  const f = clone(facts); f.riskLevel = 'high'
  f.confirmedFacts[0].supportedBy.push({ sourceId: 's2', excerpt })
  const approved = await evaluateCandidate(candidate, [primary, reporting], [], model(f, draft, { ...review, riskLevel: 'high', independentReporting: true }), now)
  assert.equal(approved.facts.riskLevel, 'high')
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(facts, draft, { ...review, riskLevel: 'high' }), now), rejected('UNVERIFIED_HIGH_RISK_CLAIM'))
})
test('copied passages and low confidence fail before publication', async () => {
  const copied = 'Acme announced the Atlas editor for developers and made the new editing workspace available today.'
  const d = clone(draft); d.sections[0].paragraphs[0].text = copied
  await assert.rejects(evaluateCandidate(candidate, [{ ...primary, text: primary.text + ' ' + copied }], [], model(facts, d), now), rejected('LOW_INFORMATION_VALUE'))
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model({ ...facts, confidence: 50 }), now), rejected('INSUFFICIENT_EVIDENCE'))
})
test('rendered prose cannot introduce MDX expressions or HTML', () => {
  const d = clone(draft); d.sections[0].paragraphs[0].text = '<script>{process.env.SECRET}</script>'
  const html = renderDraft(d)
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('{process'))
  assert.match(html, /&#123;process.env.SECRET&#125;/)
})
test('conflicting evidence fails before article generation', async () => {
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model({ ...facts, conflictingClaims: ['Sources disagree about the launch.'] }), now), rejected('CONFLICTING_SOURCES'))
})
test('fabricated and reconstructed quotes cannot reach publication', async () => {
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(facts, { ...draft, deck: 'Acme said “Atlas changes everything.”' }), now), rejected('UNVERIFIED_QUOTE'))
})
test('unsupported numerical paragraphs are removed, not repaired with invented values', () => {
  const d = clone(draft)
  d.sections[1].paragraphs.push({ text: 'The editor has 47.8 million users.', factIds: ['f1'] })
  const cleaned = cleanDraft(d, facts)
  assert.equal(cleaned.removedParagraphs, 1)
  assert.ok(!renderDraft(cleaned.draft).includes('47.8'))
  assert.throws(() => cleanDraft({ ...draft, title: 'Acme launches Atlas for $47.8 million' }, facts), rejected('UNSUPPORTED_CLAIM'))
})
test('made-up citation excerpts and unsupported numeric facts fail', async () => {
  const f = clone(facts); f.confirmedFacts[0].supportedBy[0].excerpt = 'This exact passage was never in the source.'
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(f), now), rejected('UNSUPPORTED_CLAIM'))
  f.confirmedFacts[0].supportedBy[0].excerpt = excerpt; f.confirmedFacts[0].claim += ' There are 200 users.'
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(f), now), rejected('UNSUPPORTED_CLAIM'))
})
test('event dedupe recognizes launch/unveil variants, preserving different product versions', async () => {
  const history = [{ slug: 'atlas', title: 'Acme unveils its new Atlas editor', publishedAt: candidate.publishedAt }]
  assert.ok(duplicateEvent(facts.event, candidate.title, history))
  await assert.rejects(evaluateCandidate(candidate, [primary], history, model(), now), rejected('DUPLICATE_STORY'))
  assert.equal(duplicateEvent({ ...facts.event, product: 'Atlas 2' }, 'Acme launches Atlas 2', [{ ...history[0], newsEvent: facts.event }]), undefined)
})
test('an old event with a refreshed RSS timestamp is rejected', async () => {
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model({ ...facts, event: { ...facts.event, eventDate: '2026-07-01' } }), now), rejected('STALE_STORY'))
  assert.throws(() => checkFresh('2026-02-30', now), rejected('INVALID_DATE'))
  assert.throws(() => checkFresh('2026-09-17', now), rejected('INVALID_DATE'))
})
test('malformed extraction safely rejects without final images or MDX writes', async () => {
  let writes = 0; const logs: string[] = []
  const accepted = await processCandidate(candidate, { collect: async () => [primary], model: async () => null, history: [], publish: async () => { writes++ }, log: message => logs.push(message), now })
  assert.equal(accepted, false); assert.equal(writes, 0)
  assert.match(logs.join('\n'), /MALFORMED_MODEL_OUTPUT/)
})
test('source retrieval failure skips all final side effects', async () => {
  let writes = 0
  const accepted = await processCandidate(candidate, { collect: async () => { throw new Rejection('SOURCE_RETRIEVAL_FAILED') }, model: model(), history: [], publish: async () => { writes++ }, log: () => {}, now })
  assert.equal(accepted, false); assert.equal(writes, 0)
})
test('approved stories reach the final side-effect boundary exactly once', async () => {
  let writes = 0
  assert.equal(await processCandidate(candidate, { collect: async () => [primary], model: model(), history: [], publish: async () => { writes++ }, log: () => {}, now }), true)
  assert.equal(writes, 1)
})
test('a source disappearing after review prevents image and MDX creation', async () => {
  let writes = 0
  const accepted = await processCandidate(candidate, { collect: async () => [primary], model: model(), history: [], verifyAvailable: async () => { throw new Rejection('SOURCE_RETRIEVAL_FAILED') }, publish: async () => { writes++ }, log: () => {}, now })
  assert.equal(accepted, false); assert.equal(writes, 0)
})
test('semantic reviewer can reject unsupported entities and non-authoritative primary evidence', async () => {
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(facts, draft, { ...review, unverifiedEntities: ['A fabricated executive'] }), now), rejected('UNVERIFIED_ENTITY'))
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(facts, draft, { ...review, authoritativePrimaryIds: [] }), now), rejected('INSUFFICIENT_EVIDENCE'))
})
test('syndicated reports and same-owner publications do not count as independent', async () => {
  const f = clone(facts); f.confirmedFacts[0].supportedBy.push({ sourceId: 's2', excerpt })
  await assert.rejects(evaluateCandidate(candidate, [{ ...primary, tier: 2 }, reporting], [], model(f, draft, { ...review, authoritativePrimaryIds: [], independentReporting: true, derivativeGroups: [['s1', 's2']] }), now), rejected('INSUFFICIENT_EVIDENCE'))
  assert.equal(classifySource('https://wired.com/story/a').group, classifySource('https://arstechnica.com/a').group)
})
test('source classification is exact-host and does not promote arbitrary GitHub or community content', () => {
  assert.equal(classifySource('https://openai.com/index/product').tier, 1)
  assert.equal(classifySource('https://reuters.com/technology/a').tier, 2)
  assert.equal(classifySource('https://unknown.example/a').tier, 3)
  assert.equal(classifySource('https://openai.com.evil.example/a').tier, 3)
  assert.equal(classifySource('https://learn.microsoft.com/answers/a').tier, 3)
  assert.equal(classifySource('https://github.com/random/project/releases/tag/v1').tier, 3)
})
test('retrieval caches a source and enforces bytes, redirects and public HTTPS', async () => {
  let calls = 0
  const fetcher = new SourceFetcher((async () => { calls++; return new Response('source', { headers: { 'Content-Type': 'text/html' } }) }) as typeof fetch, async () => {})
  await fetcher.get('https://example.com/a?utm_source=x'); await fetcher.get('https://example.com/a')
  assert.equal(calls, 1)
  assert.throws(() => canonicalSource('http://127.0.0.1/private'), rejected('SOURCE_RETRIEVAL_FAILED'))
  const large = new SourceFetcher((async () => new Response('x'.repeat(QUALITY.maxSourceBytes + 1), { headers: { 'Content-Type': 'text/html' } })) as typeof fetch, async () => {})
  await assert.rejects(large.get('https://example.com/large'), rejected('SOURCE_RETRIEVAL_FAILED'))
})
test('source extraction uses retrieved publication time, not a refreshed feed date', () => {
  const html = `<meta property="article:published_time" content="2026-01-01T00:00:00Z"><article><p>${'Evidence about a previous release. '.repeat(20)}</p></article>`
  assert.equal(extractSource('https://openai.com/index/old', html, 's1').publishedAt, '2026-01-01T00:00:00.000Z')
  assert.throws(() => extractSource('https://openai.com/index/unknown', '<article>No publication date.</article>', 's1'), rejected('INVALID_DATE'))
})
test('model JSON failure and exhausted call budgets fail closed without retries', async () => {
  let calls = 0
  const bad = createModel('fixture-key', 'fixture-model', (async () => { calls++; return Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'not JSON' } }] }) }) as typeof fetch)
  for (let i = 0; i < QUALITY.maxModelCalls; i++) await assert.rejects(bad('facts', {}), rejected('MALFORMED_MODEL_OUTPUT'))
  await assert.rejects(bad('facts', {}), rejected('BUDGET_EXHAUSTED'))
  assert.equal(calls, QUALITY.maxModelCalls)
})
test('legacy MDX remains readable without new quality fields; audit does not mutate input', () => {
  const parsed = matter('---\nslug: old\ntitle: Old story\npublishedAt: "2026-09-15"\n---\n<p>Old content.</p>')
  const input = [{ slug: parsed.data.slug, title: parsed.data.title, publishedAt: parsed.data.publishedAt, content: parsed.content }]
  const before = JSON.stringify(input)
  const report = auditStories(input)
  assert.ok(report[0].flags.includes('MISSING_SOURCES')); assert.equal(JSON.stringify(input), before)
})
test('daily images, commits and IndexNow are gated on accepted publication; bot/schedules stay intact', () => {
  const yaml = require('js-yaml')
  const source = readFileSync('.github/workflows/daily-news.yml', 'utf8')
  const workflow = yaml.load(source)
  const steps = workflow.jobs['fetch-and-post'].steps
  for (const name of ['Prepare recent article images', 'Commit and push article', 'Notify IndexNow when production content is live']) assert.equal(steps.find((s: { name: string }) => s.name === name).if, "steps.news.outputs.published_count != '' && steps.news.outputs.published_count != '0'")
  assert.equal(workflow.on.schedule.length, 3)
  assert.match(source, /41898282\+github-actions\[bot\]@users.noreply.github.com/)
  assert.doesNotMatch(source, /VERCEL_DEPLOY_HOOK/)
  assert.match(readFileSync('scripts/notify-indexnow.ts', 'utf8'), /response.ok &&/)
})

const evidenceHtml = (links = '', date = '2026-09-15T09:00:00Z') => `<meta property="article:published_time" content="${date}"><article>${'Acme Atlas editor launch supports developers building software. '.repeat(8)}${links}</article>`
function fixtureFetcher(pages: Record<string, string | number>) {
  const requested: string[] = []
  const fetcher = new SourceFetcher((async (input: string | URL | Request) => {
    const url = String(input); requested.push(url)
    const page = pages[url]
    return typeof page === 'string' ? new Response(page, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: page || 404 })
  }) as typeof fetch, async () => {})
  return { fetcher, requested }
}
test('collector follows official links on the second reporting document, not just the first', async () => {
  const first = 'https://theverge.com/news/acme', second = 'https://techcrunch.com/acme-atlas', official = 'https://openai.com/index/atlas'
  const {fetcher} = fixtureFetcher({ [first]: evidenceHtml(`<a href="${second}">Acme Atlas editor launch</a>`), [second]: evidenceHtml(`<a href="${official}">Official announcement</a>`), [official]: evidenceHtml() })
  const result = await collectSources({...candidate,url:first},[],fetcher,()=>{},now)
  assert.ok(result.some(s=>s.url===official && s.tier===1))
})
test('undated discovery pages still yield canonical and official source URLs without becoming evidence', async () => {
  const first = 'https://theverge.com/news/acme', official = 'https://openai.com/index/atlas'
  const {fetcher} = fixtureFetcher({ [first]: `<link rel="canonical" href="${official}"><article>No usable date</article>`, [official]: evidenceHtml() })
  const logs: string[]=[]
  const result = await collectSources({...candidate,url:first},[],fetcher,m=>logs.push(m),now)
  assert.equal(result.length,1); assert.equal(result[0].url,official)
  assert.match(logs.join('\n'),/PUBLICATION_DATE_MISSING/)
})
test('RSS outbound primary hints survive an inaccessible article', async () => {
  const official = 'https://openai.com/index/atlas'
  const {fetcher}=fixtureFetcher({[candidate.url]:403,[official]:evidenceHtml()})
  const result=await collectSources({...candidate,discoveryLinks:[official]},[],fetcher,()=>{},now)
  assert.equal(result[0].url,official)
})
test('known official feeds supply actual relevant URLs; feed entries are not evidence', async () => {
  const official='https://blogs.nvidia.com/blog/atlas-release/'
  const {fetcher,requested}=fixtureFetcher({[candidate.url]:evidenceHtml(),'https://blogs.nvidia.com/feed/':`<rss version="2.0"><channel><title>NVIDIA</title><item><title>Nvidia Atlas editor launch</title><link>${official}</link></item><item><title>Unrelated event</title><link>https://blogs.nvidia.com/blog/unrelated/</link></item></channel></rss>`,[official]:evidenceHtml()})
  const result=await collectSources({...candidate,title:'Nvidia launches Atlas editor'},[],fetcher,()=>{},now)
  assert.ok(result.some(s=>s.url===official && s.tier===1))
  assert.ok(!result.some(s=>s.url.endsWith('/feed/')))
  assert.ok(!requested.some(u=>u.includes('unrelated')))
  assert.ok(requested.length<=QUALITY.maxSourceAttempts)
})
test('official pages are prioritized ahead of same-publisher navigation and capacity', async () => {
  const official='https://openai.com/index/atlas'
  const links=Array.from({length:8},(_,i)=>`<a href="https://theverge.com/news/unrelated-${i}">Unrelated gadget ${i}</a>`).join('')+`<a href="${official}">Official source</a>`
  const {fetcher,requested}=fixtureFetcher({[candidate.url]:evidenceHtml(links),[official]:evidenceHtml()})
  const result=await collectSources(candidate,[],fetcher,()=>{},now)
  assert.equal(result.filter(s=>s.tier===1).length,1)
  assert.equal(requested.length,2)
})
test('failed official retrieval logs HTTP status and counts without logging query secrets', async () => {
  const official='https://openai.com/index/atlas?token=secret-value'
  const {fetcher}=fixtureFetcher({[candidate.url]:evidenceHtml(`<a href="${official}">Official announcement</a>`),[official]:404})
  const logs:string[]=[]
  await collectSources(candidate,[],fetcher,m=>logs.push(m),now)
  assert.match(logs.join('\n'),/Primary retrieval failed:.*HTTP_404/)
  assert.match(logs.join('\n'),/Official-domain candidates: 1/)
  assert.doesNotMatch(logs.join('\n'),/secret-value/)
  assert.equal(diagnosticUrl('https://user:secret@example.com/a?key=x#x'),'https://example.com/a')
})
test('official URLs remain exact-host; arbitrary linked domains are never promoted or crawled', async () => {
  const spoof='https://openai.com.evil.example/index/atlas'
  const {fetcher,requested}=fixtureFetcher({[candidate.url]:evidenceHtml(`<a href="${spoof}">Official release</a>`)})
  await collectSources(candidate,[],fetcher,()=>{},now)
  assert.equal(requested.length,1); assert.equal(classifySource(spoof).tier,3)
  assert.equal(classifySource('https://blogs.windows.com/windowsexperience/2026/09/15/news').tier,1)
  assert.equal(classifySource('https://blogs.windows.com/community/post').tier,3)
})
test('discovery links support structured citations and apostrophes in double-quoted attributes', () => {
  const links=documentLinks(`<a href="https://openai.com/index/editor's-release">source</a><script type="application/ld+json">{"@type":"NewsArticle","citation":{"url":"https://ftc.gov/news/decision"}}</script>`,'https://theverge.com/news/a')
  assert.ok(links.some(l=>l.url.includes("editor's-release")))
  assert.ok(links.some(l=>l.url==='https://ftc.gov/news/decision'))
})
test('date parsing reads itemprop and typed JSON-LD instead of arbitrary embedded datePublished', () => {
  assert.equal(publicationDate('<meta itemprop="datePublished" content="2026-09-15T09:00:00Z">',''),'2026-09-15T09:00:00.000Z')
  const html='<script type="application/json">{"datePublished":"1999-01-01"}</script><script type="application/ld+json">{"@graph":[{"@type":"WebSite","datePublished":"2000-01-01"},{"@type":"NewsArticle","datePublished":"2026-09-15T09:00:00Z"}]}</script>'
  assert.equal(publicationDate(html,''),'2026-09-15T09:00:00.000Z')
})
test('missing, impossible and conflicting publication dates fail with distinct diagnostics', () => {
  for(const [html,detail] of [
    ['<meta property="article:modified_time" content="2026-09-15">','PUBLICATION_DATE_MISSING'],
    ['<meta property="article:published_time" content="2026-02-30">','PUBLICATION_DATE_UNPARSABLE'],
    ['<meta property="article:published_time" content="2026-09-15"><script type="application/ld+json">{"@type":"Article","datePublished":"2026-01-01"}</script>','PUBLICATION_DATES_CONFLICT'],
  ]) assert.throws(()=>publicationDate(html,''),(e:unknown)=>e instanceof Rejection && e.detail===detail)
})
test('future event, stale event, missing date evidence and reviewer refusal remain different failures', async () => {
  const scenarios:[FactSheet,Review,string][]=[
    [{...facts,event:{...facts.event,eventDate:'2026-10-07'}},review,'EVENT_DATE_IN_FUTURE'],
    [{...facts,event:{...facts.event,eventDate:'2026-01-01'}},review,'EVENT_DATE_OUTSIDE_48H'],
    [{...facts,eventDateEvidence:'Missing evidence'},review,'EVENT_DATE_EVIDENCE_NOT_FOUND'],
    [facts,{...review,eventDateVerified:false},'REVIEW_EVENT_DATE_NOT_VERIFIED'],
  ]
  for(const [f,r,detail] of scenarios) await assert.rejects(evaluateCandidate(candidate,[primary],[],model(f,draft,r),now),(e:unknown)=>e instanceof Rejection && e.detail===detail)
})
test('feed failures identify exact endpoint and distinguish HTTP, malformed XML and empty feed', async () => {
  const url='https://feeds.feedburner.com/venturebeat/SZYF', logs:string[]=[]
  await discoverFeed(url,fixtureFetcher({[url]:404}).fetcher,m=>logs.push(m),now)
  assert.match(logs.join('\n'),/feeds.feedburner.com\/venturebeat\/SZYF.*HTTP_404/)
  await discoverFeed(url,fixtureFetcher({[url]:'not a feed'}).fetcher,m=>logs.push(m),now)
  assert.match(logs.join('\n'),/FEED_PARSE_ERROR/)
  const empty:string[]=[]
  await discoverFeed(url,fixtureFetcher({[url]:'<rss version="2.0"><channel><title>Empty</title></channel></rss>'}).fetcher,m=>empty.push(m),now)
  assert.match(empty.join('\n'),/Items: 0/); assert.doesNotMatch(empty.join('\n'),/unavailable/)
})
test('existing hard budgets and freshness thresholds remain unchanged', async () => {
  assert.equal(QUALITY.maxFetches,32); assert.equal(QUALITY.maxSourceAttempts,6); assert.equal(QUALITY.maxSources,4)
  assert.equal(QUALITY.maxModelCalls,9); assert.equal(QUALITY.freshnessHours,48)
  assert.equal(QUALITY.publishThreshold,75); assert.equal(QUALITY.minFactConfidence,85); assert.equal(QUALITY.minStoryConfidence,85)
  const {fetcher}=fixtureFetcher({})
  for(let i=0;i<QUALITY.maxFetches;i++) await assert.rejects(fetcher.get(`https://example.com/${i}`))
  await assert.rejects(fetcher.get('https://example.com/overflow'),rejected('BUDGET_EXHAUSTED'))
  assert.equal(fetcher.count,32)
})
test('mentioning Reuters never makes two Verge articles independent', () => {
  const a=extractSource('https://theverge.com/news/a',evidenceHtml(),'s1')
  const b=extractSource('https://theverge.com/news/b',evidenceHtml('<p>According to Reuters, another report exists.</p>'),'s2')
  assert.equal(a.group,b.group)
  mergeSourceOrigins([a,b]); assert.equal(a.group,b.group)
})
test('byline syndication collapses origins without splitting same-owner publications', () => {
  const a=extractSource('https://theverge.com/news/a','<meta name="author" content="Reuters">'+evidenceHtml(),'s1')
  const b=extractSource('https://theverge.com/news/b',evidenceHtml('<p>A different original report.</p>'),'s2')
  const c=extractSource('https://reuters.com/news/a',evidenceHtml('<p>The wire original.</p>'),'s3')
  mergeSourceOrigins([a,b,c]); assert.equal(new Set([a.group,b.group,c.group]).size,1)
})
test('discovery ignores navigation, admin handlers and tag pagination on official sites', () => {
  const links=documentLinks('<nav><a href="https://openai.com/index/noise">Noise</a></nav><article><a href="/wp-admin/admin-post.php">Action</a><a href="/news/tag/ai/page/2/">Archive</a><a href="/news/real-release/">Real release</a></article>','https://about.fb.com/news/story/')
  assert.deepEqual(links.map(l=>l.url),['https://about.fb.com/news/real-release/'])
})
test('organization mentions in article text can select an official endpoint within the same budget', async () => {
  const official='https://blogs.nvidia.com/blog/atlas-release/'
  const {fetcher,requested}=fixtureFetcher({[candidate.url]:evidenceHtml('<p>Nvidia participated in the Atlas launch.</p>'),'https://blogs.nvidia.com/feed/':`<rss version="2.0"><channel><title>NVIDIA</title><item><title>Acme Atlas editor launch</title><link>${official}</link></item></channel></rss>`,[official]:evidenceHtml()})
  const result=await collectSources(candidate,[],fetcher,()=>{},now)
  assert.ok(result.some(s=>s.url===official)); assert.ok(requested.length<=QUALITY.maxSourceAttempts)
})
