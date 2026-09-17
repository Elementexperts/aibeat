import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { QUALITY, classifySource } from '../scripts/news-quality/config'
import { checkFresh, cleanDraft, duplicateEvent, renderDraft, renderApproved } from '../scripts/news-quality/gate'
import { classifyEditorial } from '../scripts/news-quality/trust'
import { classifyRisk, storyRisk } from '../scripts/news-quality/risk'
import { ordinaryTrustedCandidate } from '../scripts/news-quality/trust'
import { evaluateCandidate, processCandidate } from '../scripts/news-quality/pipeline'
import { SourceFetcher, extractSource, canonicalSource, collectSources, mergeSourceOrigins } from '../scripts/news-quality/sources'
import { documentLinks, publicationDate } from '../scripts/news-quality/documents'
import { discoverFeed } from '../scripts/news-quality/feeds'
import { diagnosticUrl } from '../scripts/news-quality/diagnostics'
import { createModel, retryDelay } from '../scripts/news-quality/model'
import { ModelFailure } from '../scripts/news-quality/model-diagnostics'
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
  uncertainClaims: [], conflictingClaims: [], riskLevel: 'low', riskAssessments: [], confidence: 95,
}
const draft: Draft = { title: candidate.title, deck: 'Acme announced its Atlas editor for developers.', sections: [
  { heading: 'What happened', kind: 'facts', paragraphs: [{ text: 'Acme announced the Atlas editor for developers.', factIds: ['f1'] }] },
  { heading: 'Why it matters', kind: 'analysis', paragraphs: [{ text: 'For developers, this could provide another editing option to evaluate.', factIds: ['f1'] }] },
] }
const review: Review = { supportedFactIds: ['f1'], unsupportedClaims: [], conflictingClaims: [], unverifiedEntities: [], derivativeGroups: [], authoritativePrimaryIds: ['s1'], trustedEditorialSourceIds: [], eventDateVerified: true, independentReporting: false, analysisGrounded: true, originalValue: true, clearWriting: true, riskLevel: 'low', riskAssessments: [] }
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
  const f = clone(facts); f.riskLevel = 'high'; f.riskAssessments = [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }]
  f.confirmedFacts[0].supportedBy.push({ sourceId: 's2', excerpt })
  const approved = await evaluateCandidate(candidate, [primary, reporting], [], model(f, draft, { ...review, riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }], independentReporting: true }), now)
  assert.equal(approved.facts.riskLevel, 'high')
  await assert.rejects(evaluateCandidate(candidate, [primary], [], model(facts, draft, { ...review, riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] }), now), rejected('UNVERIFIED_HIGH_RISK_CLAIM'))
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

const editorialHtml = (author = 'Alex Reporter', extra = '', published = candidate.publishedAt) =>
  `<meta property="og:type" content="article"><meta name="author" content="${author}"><meta property="og:title" content="Acme launches Atlas editor"><meta property="article:published_time" content="${published}"><article><p class="byline">${author}</p><p>${excerpt}</p><p>${'The editing workspace provides a place for developers to work with their software projects. '.repeat(4)}</p>${extra}</article>`
const techUrl = 'https://techcrunch.com/2026/09/15/acme-atlas/'
const trustedCandidate = { ...candidate, url: techUrl }
const trustedReview: Review = { ...review, authoritativePrimaryIds: [], trustedEditorialSourceIds: ['s1'] }
const trustedSource = () => extractSource(techUrl, editorialHtml(), 's1')
const trustedFacts = (): FactSheet => ({ ...clone(facts), eventDateEvidence: '2026-09-15T09:00:00.000Z' })

for (const [publisher, url, author] of [
  ['TechCrunch', techUrl, 'Alex Reporter'],
  ['Reuters', 'https://www.reuters.com/technology/acme-atlas-2026-09-15/', 'Alex Reporter'],
  ['Forbes staff', 'https://www.forbes.com/sites/alex/2026/09/15/acme-atlas/', 'Alex Reporter, Forbes Staff'],
]) test(`${publisher} ordinary launch passes from one original editorial source with explicit attribution`, async () => {
  const source = extractSource(url, editorialHtml(author), 's1')
  const approved = await evaluateCandidate({ ...candidate, url }, [source], [], model(trustedFacts(), draft, trustedReview), now)
  assert.equal(approved.evidenceMode, 'TRUSTED_SINGLE_SOURCE')
  assert.equal(approved.qualityScore, 87)
  const rendered = renderApproved(approved)
  assert.match(rendered, /Based on reporting by <a href=/)
  assert.ok(rendered.includes(source.name)); assert.match(rendered, /AIBeat analysis/)
  assert.doesNotMatch(rendered, /qualityScore|Score:|87/)
})

for (const [label, suffix, author, extra] of [
  ['contributor', 'alex', 'Alex Reporter, Contributor', ''],
  ['opinion', 'alex', 'Alex Reporter, Forbes Staff', '<meta name="article:section" content="Opinion">'],
  ['sponsored', 'brandvoice', 'Alex Reporter, Forbes Staff', '<p>BrandVoice paid program</p>'],
  ['ambiguous', 'alex', 'Alex Reporter', ''],
  ['press release', 'forbespr', 'Forbes Press Releases, Forbes Staff', ''],
]) test(`Forbes ${label} cannot use the trusted-source bypass`, async () => {
  const url = `https://www.forbes.com/sites/${suffix}/2026/09/15/acme-atlas/`
  const source = extractSource(url, editorialHtml(author, extra), 's1')
  assert.notEqual(source.editorial?.contentType, 'STAFF_REPORTING'); assert.equal(source.tier, 3)
  await assert.rejects(evaluateCandidate({ ...candidate, url }, [source], [], model(trustedFacts(), draft, trustedReview), now), rejected('INSUFFICIENT_EVIDENCE'))
})

test('a Forbes staff mention in ordinary body text is not an explicit staff byline', () => {
  const result = classifyEditorial('https://forbes.com/sites/alex/2026/09/15/atlas/', editorialHtml('Alex Reporter', '<p>Forbes Staff attended a separate event.</p>'))
  assert.equal(result.contentType, 'AMBIGUOUS')
})
test('structured author staff metadata qualifies but contributor overrides it', () => {
  const url = 'https://forbes.com/sites/alex/2026/09/15/atlas/'
  const structured = '<script type="application/ld+json">{"@type":"NewsArticle","author":{"name":"Alex","jobTitle":"Forbes Staff"}}</script>'
  assert.equal(classifyEditorial(url, editorialHtml() + structured).contentType, 'STAFF_REPORTING')
  assert.equal(classifyEditorial(url, editorialHtml('Alex, Contributor') + structured).contentType, 'CONTRIBUTOR')
  assert.equal(classifyEditorial(url, editorialHtml('Alex, Forbes Staff', '<p>' + 'Article text. '.repeat(100) + '</p><span class="byline">Alex, Contributor</span>')).contentType, 'CONTRIBUTOR')
})
test('unknown hosts, unverified subdomains, aggregation, missing author, and community pages cannot bypass', async () => {
  for (const [url, html] of [
    ['https://unknown.example/atlas', editorialHtml()],
    ['https://community.techcrunch.com/atlas', editorialHtml()],
    ['https://techcrunch.com.evil.example/atlas', editorialHtml()],
    ['https://techcrunch.com/community/atlas', editorialHtml()],
    [techUrl, editorialHtml('Alex', '<p>Originally published by another outlet.</p>')],
    [techUrl, editorialHtml('')],
    [techUrl, editorialHtml('By Reuters')],
  ]) {
    const source = extractSource(url, html, 's1')
    await assert.rejects(evaluateCandidate({ ...candidate, url }, [source], [], model(trustedFacts(), draft, trustedReview), now), rejected('INSUFFICIENT_EVIDENCE'))
  }
  // Finding one trusted secondary article cannot promote an unknown original.
  await assert.rejects(evaluateCandidate(candidate, [trustedSource()], [], model(trustedFacts(), draft, trustedReview), now), rejected('INSUFFICIENT_EVIDENCE'))
})
for (const title of ['Acme announces acquisition', 'Acme reports security breach', 'Acme faces serious safety allegations'])
  test(`trusted publisher remains strict: ${title}`, async () => {
    await assert.rejects(evaluateCandidate({ ...trustedCandidate, title }, [trustedSource()], [], model(trustedFacts(), draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
  })
test('incidental body text does not escalate the story but a consequential source headline does', async () => {
  const background = { ...trustedSource(), text: trustedSource().text + ' A related-story card discusses an earlier security breach.' }
  assert.equal((await evaluateCandidate(trustedCandidate, [background], [], model(trustedFacts(), draft, trustedReview), now)).evidenceMode, 'TRUSTED_SINGLE_SOURCE')
  await assert.rejects(evaluateCandidate(trustedCandidate, [{ ...trustedSource(), title: 'Acme announces acquisition' }], [], model(trustedFacts(), draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
})
test('model and semantic reviewer can escalate risk but cannot waive primary evidence', async () => {
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model({ ...trustedFacts(), riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] }, draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model(trustedFacts(), draft, { ...trustedReview, riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] }), now), rejected('NO_PRIMARY_SOURCE'))
})
test('semantic reviewer can reject original editorial status, contradictions, or unsupported claims', async () => {
  for (const [r, reason] of [
    [{ ...trustedReview, trustedEditorialSourceIds: [] }, 'INSUFFICIENT_EVIDENCE'],
    [{ ...trustedReview, derivativeGroups: [['s1']] }, 'INSUFFICIENT_EVIDENCE'],
    [{ ...trustedReview, conflictingClaims: ['Material disagreement'] }, 'CONFLICTING_SOURCES'],
    [{ ...trustedReview, unsupportedClaims: ['Unsupported claim'] }, 'UNSUPPORTED_CLAIM'],
  ] as [Review, string][]) await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model(trustedFacts(), draft, r), now), rejected(reason))
})
test('trusted single-source unsupported numeric facts fail and unsupported analysis numbers are removed', async () => {
  const f = trustedFacts(); f.confirmedFacts[0].claim += ' It has 900 users.'
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model(f, draft, trustedReview), now), rejected('UNSUPPORTED_CLAIM'))
  const d = clone(draft); d.sections[1].paragraphs.push({ text: 'It has 900 users.', factIds: ['f1'] })
  const approved = await evaluateCandidate(trustedCandidate, [trustedSource()], [], model(trustedFacts(), d, trustedReview), now)
  assert.equal(approved.removedParagraphs, 1); assert.doesNotMatch(renderApproved(approved), /900/)
})
test('stale trusted original cannot be rescued by a fresh feed timestamp', async () => {
  const source = extractSource(techUrl, editorialHtml('Alex', '', '2026-09-01T09:00:00Z'), 's1')
  await assert.rejects(evaluateCandidate(trustedCandidate, [source], [], model(trustedFacts(), draft, trustedReview), now), rejected('STALE_STORY'))
})
test('duplicate trusted-source event remains rejected', async () => {
  const history = [{ slug: 'atlas', title: draft.title, publishedAt: candidate.publishedAt, newsEvent: facts.event }]
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], history, model(trustedFacts(), draft, trustedReview), now), rejected('DUPLICATE_STORY'))
})
test('ordinary trusted article uses one GET plus availability HEAD and skips corroboration', async () => {
  const { fetcher, requested } = fixtureFetcher({ [techUrl]: editorialHtml('Alex', '<a href="https://openai.com/index/atlas">Official announcement</a>') })
  const sources = await collectSources(trustedCandidate, [], fetcher, () => {}, now)
  assert.equal(requested.length, 1); assert.equal(sources.length, 1)
  const approved = await evaluateCandidate(trustedCandidate, sources, [], model(trustedFacts(), draft, trustedReview), now)
  await fetcher.verifyAvailable(approved.sources)
  assert.equal(fetcher.count, 2)
})
test('high-risk original and explicit enhanced discovery follow actual official links', async () => {
  const official = 'https://openai.com/index/atlas'
  for (const force of [false, true]) {
    const { fetcher, requested } = fixtureFetcher({ [techUrl]: editorialHtml('Alex', `<a href="${official}">Official announcement</a>`), [official]: evidenceHtml() })
    const c = force ? trustedCandidate : { ...trustedCandidate, title: 'Acme announces acquisition' }
    const sources = await collectSources(c, [], fetcher, () => {}, now, force)
    assert.ok(requested.includes(official)); assert.ok(sources.some(s => s.tier === 1))
  }
})
test('model risk escalation retries bounded discovery once and cannot be downgraded on retry', async () => {
  let expansions = 0, factCalls = 0, writes = 0
  const logs: string[] = []
  const accepted = await processCandidate(trustedCandidate, {
    collect: async () => [trustedSource()], collectEnhanced: async () => { expansions++; return [trustedSource()] },
    model: async stage => { if (stage === 'facts') { factCalls++; return { ...trustedFacts(), riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] } } return {} },
    history: [], now, publish: async () => { writes++ }, log: m => logs.push(m),
  })
  assert.equal(accepted, false); assert.equal(expansions, 1); assert.equal(factCalls, 1); assert.equal(writes, 0)
  assert.match(logs.join('\n'), /Model escalated risk/); assert.match(logs.join('\n'), /NO_PRIMARY_SOURCE/)
})
test('late risk escalation can publish only after primary plus independent evidence and fresh review', async () => {
  let calls = 0, writes = 0
  const f = trustedFacts(); f.confirmedFacts[0].supportedBy.push({ sourceId: 's2', excerpt })
  const official: Source = { ...primary, id: 's2', url: 'https://openai.com/index/atlas', group: 'openai', publishedAt: trustedSource().publishedAt }
  const accepted = await processCandidate(trustedCandidate, {
    collect: async () => [trustedSource()], collectEnhanced: async () => [trustedSource(), official],
    model: async stage => {
      if (stage === 'facts') return ++calls === 1 ? { ...trustedFacts(), riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] } : clone(f)
      if (stage === 'draft') return clone(draft)
      return { ...trustedReview, authoritativePrimaryIds: ['s2'], independentReporting: true }
    }, history: [], now, log: () => {}, publish: async approved => {
      writes++; assert.equal(approved.facts.riskLevel, 'high'); assert.equal(approved.evidenceMode, 'ENHANCED_VERIFICATION')
    },
  })
  assert.equal(accepted, true); assert.equal(writes, 1); assert.equal(calls, 2)
})
test('semantic rejection never triggers corroboration retries or publication', async () => {
  let sideEffects = 0
  const accepted = await processCandidate(trustedCandidate, {
    collect: async () => [trustedSource()], collectEnhanced: async () => { sideEffects++; return [] },
    model: model(trustedFacts(), draft, { ...trustedReview, unsupportedClaims: ['Unverified assertion'] }),
    history: [], now, log: () => {}, publish: async () => { sideEffects++ },
  })
  assert.equal(accepted, false); assert.equal(sideEffects, 0)
})
test('single-source availability failure still prevents final image and article side effects', async () => {
  let writes = 0
  assert.equal(await processCandidate(trustedCandidate, {
    collect: async () => [trustedSource()], model: model(trustedFacts(), draft, trustedReview),
    history: [], now, log: () => {}, verifyAvailable: async () => { throw new Rejection('SOURCE_RETRIEVAL_FAILED', 'HTTP_404') },
    publish: async () => { writes++ },
  }), false)
  assert.equal(writes, 0)
})
test('new reviewer classification is mandatory and attribution escapes publisher text', async () => {
  const r = { ...trustedReview } as Partial<Review>; delete r.trustedEditorialSourceIds
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], async stage => stage === 'facts' ? trustedFacts() : stage === 'draft' ? draft : r, now), rejected('MALFORMED_MODEL_OUTPUT'))
  const approved = await evaluateCandidate(trustedCandidate, [{ ...trustedSource(), name: '<script>{secret}</script>' }], [], model(trustedFacts(), draft, trustedReview), now)
  assert.doesNotMatch(renderApproved(approved), /<script>|\{secret\}/)
})

for (const title of [
  'The Boox Palma 3 gets stylus support and a sleek redesign',
  'The EOS R8 Mark II is Canon’s lightest full-frame camera with stabilization, priced at $1,499',
  'OpenAI releases a new developer API feature',
  'Microsoft announces Windows and Surface event for October 7th',
  'Meta launches smart glasses with a security feature',
  'Google releases software for government customers',
  'Canon raises camera price to $1,499',
]) test(`ordinary headline stays single-source eligible: ${title}`, () => {
  const c = { ...trustedCandidate, title }
  const s = { ...trustedSource(), title, text: trustedSource().text + ' CEO statement. Google Privacy Policy and Terms of Service apply. A million pixels. Government customers.' }
  assert.equal(storyRisk(c, s).level, 'low')
  assert.ok(ordinaryTrustedCandidate(c, s))
})
for (const [claim, trigger] of [
  ['Company announces acquisition of rival', 'ACQUISITION'],
  ['Company confirms security breach', 'SECURITY_BREACH'],
  ['Company faces lawsuit over stolen data', 'LAWSUIT'],
  ['Regulator opens enforcement action', 'REGULATORY_ENFORCEMENT'],
  ['Company cuts 5,000 jobs', 'EMPLOYMENT_REDUCTION'],
  ['CEO accused of criminal fraud', 'SERIOUS_ALLEGATION'],
  ['Company raises $50 million in a funding round', 'FUNDING'],
  ['Court orders company to stop sales', 'COURT_DECISION'],
  ['Device caused serious injuries', 'SERIOUS_SAFETY_INCIDENT'],
  ['Government bans the product', 'BAN_OR_SANCTIONS'],
]) test(`consequential claim remains HIGH: ${trigger}`, () => {
  assert.deepEqual(classifyRisk(claim), { level: 'high', trigger })
})
test('generic topic words and uncertainty never default to HIGH', () => {
  for (const value of ['company', 'price', 'data', 'AI', 'camera', 'support', 'release', 'market', 'Microsoft', 'Meta', 'Google', 'government', 'financial', 'security', 'safety', 'person', 'CEO', 'policy', 'million', 'billion', 'raise', 'department', 'security feature', 'government customers', 'AI safety research']) assert.notEqual(classifyRisk(value).level, 'high', value)
  assert.equal(classifyRisk('Unclear development').level, 'medium')
  assert.equal(classifyRisk('Company makes major competitive claims for new AI benchmark').level, 'medium')
  assert.equal(storyRisk({ ...trustedCandidate, title: 'Company makes major competitive benchmark claims' }, trustedSource()).level, 'medium')
  assert.equal(storyRisk(trustedCandidate, { ...trustedSource(), title: 'Company makes major competitive benchmark claims' }).level, 'medium')
})
test('MEDIUM remains eligible and passes the complete existing evidence gate', async () => {
  const c = { ...trustedCandidate, title: 'Acme announces strategic partnership for Atlas editor' }
  const s = { ...trustedSource(), title: c.title }
  assert.equal(storyRisk(c, s).level, 'medium'); assert.ok(ordinaryTrustedCandidate(c, s))
  const approved = await evaluateCandidate(c, [s], [], model({ ...trustedFacts(), riskLevel: 'medium' }, draft, { ...trustedReview, riskLevel: 'medium' }), now)
  assert.equal(approved.evidenceMode, 'TRUSTED_SINGLE_SOURCE'); assert.equal(approved.facts.riskLevel, 'medium')
})
test('ordinary retail price is verified exactly and can pass as single-source LOW', async () => {
  const f = trustedFacts(); f.confirmedFacts[0].claim += ' The retail price is $499.'
  const passage = excerpt + ' The retail price is $499.'
  f.confirmedFacts[0].supportedBy[0].excerpt = passage
  const s = { ...trustedSource(), text: passage + trustedSource().text }
  assert.equal((await evaluateCandidate(trustedCandidate, [s], [], model(f, draft, trustedReview), now)).evidenceMode, 'TRUSTED_SINGLE_SOURCE')
  f.confirmedFacts[0].claim = f.confirmedFacts[0].claim.replace('$499', '$999')
  await assert.rejects(evaluateCandidate(trustedCandidate, [s], [], model(f, draft, trustedReview), now), rejected('UNSUPPORTED_CLAIM'))
})
test('uncertain allegations omitted from facts do not escalate unrelated verified launch claims', async () => {
  const f = { ...trustedFacts(), uncertainClaims: ['Unverified historical allegation about a lawsuit; exclude from prose.'] }
  assert.equal((await evaluateCandidate(trustedCandidate, [trustedSource()], [], model(f, draft, trustedReview), now)).evidenceMode, 'TRUSTED_SINGLE_SOURCE')
})
test('non-core consequential claim requires its own strong evidence without escalating launch facts', async () => {
  const f = trustedFacts(), extra = 'Acme confirms a security breach affecting its service.'
  f.confirmedFacts.push({ id: 'f2', claim: extra, core: false, confidence: 95, supportedBy: [{ sourceId: 's1', excerpt: extra }, { sourceId: 's2', excerpt: extra }] })
  f.riskAssessments = [{ factId: 'f2', category: 'SECURITY_BREACH' }]
  const original = { ...trustedSource(), text: trustedSource().text + ' ' + extra }
  const official = { ...primary, id: 's2', text: extra, url: 'https://openai.com/index/incident', group: 'openai' }
  const r: Review = { ...trustedReview, supportedFactIds: ['f1', 'f2'], authoritativePrimaryIds: ['s2'], independentReporting: true, riskAssessments: f.riskAssessments }
  // f1 has only trusted editorial support; f2 has both independent reporting and primary.
  const approved = await evaluateCandidate(trustedCandidate, [original, official], [], model(f, draft, r), now)
  assert.notEqual(approved.facts.riskLevel, 'high')
  assert.equal(approved.evidenceMode, 'ENHANCED_VERIFICATION')
  f.confirmedFacts[1].supportedBy.pop()
  await assert.rejects(evaluateCandidate(trustedCandidate, [original], [], model(f, draft, r), now), (error: unknown) => error instanceof Rejection && error.reason === 'NO_PRIMARY_SOURCE' && error.detail === 'CLAIM_ONLY:SECURITY_BREACH')
})
test('model cannot hide a central high-risk claim in a LOW label', async () => {
  const f = trustedFacts(), passage = 'Acme confirms a security breach affecting its service.'
  f.confirmedFacts[0].claim = passage; f.confirmedFacts[0].supportedBy[0].excerpt = passage
  const logs: string[] = []
  await assert.rejects(evaluateCandidate(trustedCandidate, [{ ...trustedSource(), text: trustedSource().text + passage }], [], model(f, draft, trustedReview), now, false, m => logs.push(m)), rejected('NO_PRIMARY_SOURCE'))
  assert.match(logs.join('\n'), /Risk escalated: LOW → HIGH \| Trigger: SECURITY_BREACH/)
})
test('HIGH requires a valid category and concrete core fact reference; malformed risk fails safely', async () => {
  for (const change of [
    { riskLevel: 'uncertain' },
    { riskLevel: 'high', riskAssessments: [] },
    { riskLevel: 'high', riskAssessments: [{ factId: 'missing', category: 'LAWSUIT' }] },
    { riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'CEO' }] },
    { riskAssessments: undefined },
  ]) await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], async stage => stage === 'facts' ? { ...trustedFacts(), ...change } : {}, now), rejected('MALFORMED_MODEL_OUTPUT'))
})

for (const [entity, product, title, claim] of [
  ['Boox', 'Palma 3', 'The Boox Palma 3 gets stylus support and a sleek redesign', 'Boox introduced Palma 3 with stylus input.'],
  ['Canon', 'EOS R8 Mark II', 'Canon announces EOS R8 Mark II for $1,499', 'Canon introduced EOS R8 Mark II at a retail price of $1,499.'],
]) test(`${entity} publication boundary is reachable despite privacy boilerplate`, async () => {
  const c = { ...trustedCandidate, title }
  const passage = `${entity} announced ${product} on September 15, 2026. ${claim}`
  const s = { ...trustedSource(), title, text: passage + ' Google Privacy Policy and Terms of Service apply. A CEO attended the event.' }
  const f: FactSheet = { ...trustedFacts(), story: title, event: { entities: [entity], product, action: 'launch', eventDate: '2026-09-15' }, confirmedFacts: [{ id: 'f1', claim, core: true, confidence: 95, supportedBy: [{ sourceId: 's1', excerpt: passage }] }] }
  const d: Draft = { title, deck: claim, sections: [{ heading: 'What happened', kind: 'facts', paragraphs: [{ text: claim, factIds: ['f1'] }] }] }
  let writes = 0, availability = 0
  const logs: string[] = []
  const accepted = await processCandidate(c, { collect: async () => [s], model: model(f, d, trustedReview), history: [], now,
    verifyAvailable: async () => { availability++ }, publish: async approved => { writes++; assert.equal(approved.evidenceMode, 'TRUSTED_SINGLE_SOURCE') }, log: m => logs.push(m) })
  assert.equal(accepted, true); assert.equal(availability, 1); assert.equal(writes, 1)
  assert.match(logs.join('\n'), /Risk: LOW \| Risk trigger: ROUTINE_PRODUCT_ANNOUNCEMENT/)
})

const completion = (content: unknown, finish_reason = 'stop') => Response.json({ choices: [{ finish_reason, message: { content } }], usage: { prompt_tokens: 1000, completion_tokens: 3000, total_tokens: 4000 } })
for (const [label, response, category] of [
  ['HTTP 429', () => Response.json({ error: 'secret request material' }, { status: 429 }), 'MODEL_RATE_LIMITED'],
  ['HTTP 500', () => Response.json({ error: 'secret request material' }, { status: 500 }), 'MODEL_SERVER_ERROR'],
  ['HTTP 401', () => Response.json({ error: 'secret request material' }, { status: 401 }), 'MODEL_HTTP_ERROR'],
  ['length', () => completion('{', 'length'), 'MODEL_TRUNCATED'],
  ['missing content', () => completion(undefined), 'MODEL_EMPTY_CONTENT'],
  ['blank content', () => completion('  '), 'MODEL_EMPTY_CONTENT'],
  ['invalid JSON', () => completion('{secret response material'), 'MODEL_INVALID_JSON'],
  ['invalid finish reason', () => completion('{}', 'secret finish value'), 'MODEL_INVALID_FINISH_REASON'],
  ['invalid schema', () => completion('{}'), 'MODEL_SCHEMA_INVALID'],
  ['unexpected exception', () => { throw new Error('secret exception material') }, 'MODEL_UNEXPECTED_ERROR'],
  ['timeout', () => { throw new DOMException('secret timeout material', 'TimeoutError') }, 'MODEL_TIMEOUT'],
  ['invalid envelope', () => new Response('secret non-JSON envelope'), 'MODEL_UNEXPECTED_ERROR'],
] as [string, () => Response, string][]) test(`model diagnostics: ${label} maps safely to ${category}`, async () => {
  const logs: string[] = []; let calls = 0
  const m = createModel('secret-api-key', 'openai/gpt-oss-120b', (async () => { calls++; return response() }) as typeof fetch, line => logs.push(line), { sleep: async () => {}, now: () => 0, random: () => 0 })
  await assert.rejects(m('facts', { evidence: 'secret source document' }), (e: unknown) => e instanceof ModelFailure && e.category === category && e.reason === 'MALFORMED_MODEL_OUTPUT')
  assert.equal(calls, category === 'MODEL_RATE_LIMITED' ? 3 : category === 'MODEL_SCHEMA_INVALID' ? 2 : 1)
  assert.match(logs[0], new RegExp(`Failure: ${category}`)); assert.match(logs[0], /Attempt: 1\/3/)
  assert.doesNotMatch(logs[0], /secret/)
  if (label === 'length') assert.match(logs[0], /Finish reason: length.*Prompt tokens: 1000.*Completion tokens: 3000.*Total tokens: 4000/)
  if (label === 'invalid JSON') assert.match(logs[0], /JSON parse: FAIL.*Problem: json_syntax_error/)
  if (label === 'invalid schema') assert.match(logs[0], /JSON parse: PASS.*Schema validation: FAIL.*Field: story \| Problem: missing_required_field/)
})
test('facts/draft/review success logs reuse existing schemas without changing request settings', async () => {
  const outputs = { facts, draft, review }; const logs: string[] = []; let calls = 0
  for (const stage of ['facts', 'draft', 'review'] as const) {
    const m = createModel('fixture-key', 'openai/gpt-oss-120b', (async (url, options) => {
      calls++; assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions')
      const body = JSON.parse(options!.body as string)
      assert.deepEqual(body.response_format, { type: 'json_object' }); assert.equal(body.max_tokens, QUALITY.maxOutputTokens)
      assert.equal(body.temperature, 0.1); assert.equal(body.model, 'openai/gpt-oss-120b')
      return completion(JSON.stringify(outputs[stage]))
    }) as typeof fetch, line => logs.push(line))
    assert.deepEqual(await m(stage, {}), outputs[stage])
    assert.match(logs[logs.length - 1], /Provider: Groq.*HTTP status: 200.*JSON parse: PASS \| Schema validation: PASS/)
  }
  assert.equal(calls, 3)
})
test('schema failure reports one safe missing-field issue without response values', async () => {
  const value = { ...facts } as Partial<FactSheet>; delete value.confirmedFacts; delete value.confidence
  const logs: string[] = []
  const m = createModel('fixture-key', 'fixture-model', (async () => completion(JSON.stringify(value))) as typeof fetch, line => logs.push(line))
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_SCHEMA_INVALID')
  assert.match(logs[0], /Field: confirmedFacts \| Problem: missing_required_field/)
  assert.equal((logs[0].match(/Field:/g) || []).length, 1); assert.ok(!logs[0].includes(excerpt))
})
test('diagnostic observation preserves extra-property acceptance and does not normalize fenced JSON', async () => {
  const extra = { ...facts, extra: 'not previously forbidden' }
  const valid = createModel('key', 'fixture', (async () => completion(JSON.stringify(extra))) as typeof fetch, () => {})
  assert.deepEqual(await valid('facts', {}), extra)
  const fenced = createModel('key', 'fixture', (async () => completion('```json\n' + JSON.stringify(facts) + '\n```')) as typeof fetch, () => {})
  await assert.rejects(fenced('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_INVALID_JSON')
})
test('diagnostic model names cannot expose the credential or inject log fields', async () => {
  for (const modelName of ['secret-api-key', 'prefix-secret-api-key', 'bad\nInjected: value']) {
    const logs: string[] = []
    const m = createModel('secret-api-key', modelName, (async () => completion(JSON.stringify(facts))) as typeof fetch, line => logs.push(line))
    await m('facts', {})
    assert.match(logs[0], /Model: REDACTED_INVALID_MODEL_ID/); assert.doesNotMatch(logs[0], /secret-api-key|Injected/)
  }
})
test('malformed, unsupported, low-confidence outputs still skip without retry or side effects', async () => {
  for (const content of ['{bad', JSON.stringify({ ...facts, confidence: 20 }), JSON.stringify({ ...facts, confirmedFacts: [{ ...facts.confirmedFacts[0], claim: 'Acme has 900 users.' }] })]) {
    let calls = 0, writes = 0
    const m = createModel('key', 'fixture', (async () => { calls++; return completion(content) }) as typeof fetch, () => {})
    assert.equal(await processCandidate(candidate, { collect: async () => [primary], model: m, history: [], now, log: () => {}, publish: async () => { writes++ } }), false)
    assert.equal(calls, 1); assert.equal(writes, 0)
  }
})

const noWait = { sleep: async (_ms: number) => {}, now: () => 0, random: () => 0 }
for (const failures of [1, 2, 3]) test(`429 bounded recovery: ${failures} rate limits`, async () => {
  let calls = 0; const waits: number[] = []
  const m = createModel('key', 'fixture', (async () => ++calls <= failures ? new Response(null, { status: 429 }) : completion(JSON.stringify(facts))) as typeof fetch, () => {}, { ...noWait, sleep: async ms => { waits.push(ms) } })
  if (failures === 3) await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  else assert.deepEqual(await m('facts', {}), facts)
  assert.equal(calls, Math.min(failures + 1, 3)); assert.deepEqual(waits, failures === 1 ? [5000] : [5000, 10000])
})
test('retry headers, invalid values, jitter and maximum delays are bounded', () => {
  const delay = (headers: Record<string, string>, attempt = 1) => retryDelay(new Headers(headers), attempt, Date.parse('2026-09-17T00:00:00Z'), 0.5)
  assert.equal(delay({ 'retry-after': '12' }), 12000)
  assert.equal(delay({ 'retry-after': 'Thu, 17 Sep 2026 00:00:20 GMT' }), 20000)
  assert.equal(delay({ 'retry-after': '999999' }), 30000)
  assert.equal(delay({ 'retry-after': '0' }), 1000)
  assert.equal(delay({ 'retry-after': '-1' }), 5500)
  assert.equal(delay({ 'retry-after': 'garbage' }, 2), 10500)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': '1m2.5s' }), 30000)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': '2.5s', 'x-ratelimit-reset-requests': '4s' }), 4000)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': 'secret' }), 5500)
})
for (const outcome of ['success', 'schema', 'json', '429'] as const) test(`one schema repair: ${outcome}`, async () => {
  let calls = 0; const bodies: { messages: { content: string }[] }[] = []; const logs: string[] = []
  const input = { evidence: 'same evidence fixture' }
  const m = createModel('key', 'fixture', (async (_url, options) => {
    bodies.push(JSON.parse(options!.body as string)); calls++
    if (calls === 1 || outcome === 'schema') return completion('{}')
    if (outcome === '429') return new Response(null, { status: 429 })
    return completion(outcome === 'json' ? '{bad' : JSON.stringify(facts))
  }) as typeof fetch, line => logs.push(line), noWait)
  if (outcome === 'success') assert.deepEqual(await m('facts', input), facts)
  else await assert.rejects(m('facts', input), e => e instanceof ModelFailure && e.category === ({ schema: 'MODEL_SCHEMA_INVALID', json: 'MODEL_INVALID_JSON', '429': 'MODEL_RATE_LIMITED' }[outcome]))
  assert.equal(calls, 2)
  assert.equal(bodies[0].messages[1].content, bodies[1].messages[1].content)
  assert.match(bodies[1].messages[0].content, /previous JSON failed local structure validation/)
  assert.match(logs.join(' '), /Initial schema validation: FAIL/)
  assert.match(logs.join(' '), /Repair JSON parse:/)
  assert.doesNotMatch(logs.join(' '), /same evidence fixture/)
})
test('retry and repair requests consume the unchanged global call budget', async () => {
  let calls = 0
  const m = createModel('key', 'fixture', (async () => { calls++; return new Response(null, { status: 429 }) }) as typeof fetch, () => {}, noWait)
  for (let i = 0; i < 3; i++) await assert.rejects(m('facts', {}), e => e instanceof ModelFailure)
  await assert.rejects(m('facts', {}), rejected('BUDGET_EXHAUSTED'))
  assert.equal(calls, QUALITY.maxModelCalls)
})
test('missing primary evidence never invokes a model repair', async () => {
  let calls = 0
  const m = createModel('key', 'fixture', (async () => { calls++; return completion(JSON.stringify(facts)) }) as typeof fetch, () => {}, noWait)
  await assert.rejects(evaluateCandidate({ ...candidate, title: 'Acme raises $18 million in funding round' }, [reporting], [], m, now), rejected('NO_PRIMARY_SOURCE'))
  assert.equal(calls, 0)
})

test('explicit empty facts abstention is never repaired into new claims', async () => {
  let calls = 0
  const m = createModel('key', 'fixture', (async () => { calls++; return completion(JSON.stringify({ ...facts, confirmedFacts: [] })) }) as typeof fetch, () => {}, noWait)
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_SCHEMA_INVALID')
  assert.equal(calls, 1)
})
