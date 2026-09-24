import { sourcePassages, passageSources, resolveFactPassages, PassageReferenceError } from '../scripts/news-quality/passages'
import { numericDiagnostic } from '../scripts/news-quality/numeric-diagnostics'
import { explainQuantities, quantitiesSupported } from '../scripts/news-quality/quantities'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { QUALITY, classifySource } from '../scripts/news-quality/config'
import { numbersSupported, parseDraft, checkFacts, checkFresh, cleanDraft, duplicateEvent, renderDraft, renderApproved } from '../scripts/news-quality/gate'
import { classifyEditorial } from '../scripts/news-quality/trust'
import { classifyRisk, storyRisk } from '../scripts/news-quality/risk'
import { ordinaryTrustedCandidate } from '../scripts/news-quality/trust'
import { evaluateCandidate, processCandidate } from '../scripts/news-quality/pipeline'
import { SourceFetcher, extractSource, canonicalSource, collectSources, mergeSourceOrigins } from '../scripts/news-quality/sources'
import { documentLinks, publicationDate } from '../scripts/news-quality/documents'
import { discoverFeed, selectCandidates, RSS_FEEDS } from '../scripts/news-quality/feeds'
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
  assert.equal(QUALITY.maxModelCalls,30); assert.equal(QUALITY.freshnessHours,48)
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
test('incidental organization body mentions do not select an official endpoint', async () => {
  const official='https://blogs.nvidia.com/blog/atlas-release/'
  const {fetcher,requested}=fixtureFetcher({[candidate.url]:evidenceHtml('<p>Nvidia participated in the Atlas launch.</p>'),'https://blogs.nvidia.com/feed/':`<rss version="2.0"><channel><title>NVIDIA</title><item><title>Acme Atlas editor launch</title><link>${official}</link></item></channel></rss>`,[official]:evidenceHtml()})
  const result=await collectSources(candidate,[],fetcher,()=>{},now)
  assert.ok(!result.some(s=>s.url===official)); assert.ok(!requested.includes('https://blogs.nvidia.com/feed/')); assert.ok(requested.length<=QUALITY.maxSourceAttempts)
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
for (const title of ['Acme reports security breach', 'Acme faces serious safety allegations'])
  test(`trusted publisher remains strict: ${title}`, async () => {
    await assert.rejects(evaluateCandidate({ ...trustedCandidate, title }, [trustedSource()], [], model(trustedFacts(), draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
  })
test('trusted staff reporting can publish funding and acquisition news with attribution', async () => {
  for (const title of ['Acme raises $50 million in a funding round', 'Acme announces acquisition of rival']) {
    const approved = await evaluateCandidate({ ...trustedCandidate, title }, [trustedSource()], [], model(trustedFacts(), draft, trustedReview), now)
    assert.equal(approved.evidenceMode, 'TRUSTED_SINGLE_SOURCE')
    assert.match(renderApproved(approved), /Based on reporting by/)
  }
})
test('a conservative review still publishes when analysis is grounded and prose is not copied', async () => {
  const approved = await evaluateCandidate(trustedCandidate, [trustedSource()], [], model(trustedFacts(), draft, { ...trustedReview, originalValue: false, clearWriting: false }), now)
  assert.ok(approved.qualityScore >= QUALITY.publishThreshold)
  assert.equal(approved.qualityScore, 75)
})
test('incidental body text does not escalate the story but a consequential source headline does', async () => {
  const background = { ...trustedSource(), text: trustedSource().text + ' A related-story card discusses an earlier security breach.' }
  assert.equal((await evaluateCandidate(trustedCandidate, [background], [], model(trustedFacts(), draft, trustedReview), now)).evidenceMode, 'TRUSTED_SINGLE_SOURCE')
  await assert.rejects(evaluateCandidate(trustedCandidate, [{ ...trustedSource(), title: 'Acme reports security breach' }], [], model(trustedFacts(), draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
})
test('model and semantic reviewer can escalate risk but cannot waive primary evidence', async () => {
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model({ ...trustedFacts(), riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] }, draft, trustedReview), now), rejected('NO_PRIMARY_SOURCE'))
  await assert.rejects(evaluateCandidate(trustedCandidate, [trustedSource()], [], model(trustedFacts(), draft, { ...trustedReview, riskLevel: 'high', riskAssessments: [{ factId: 'f1', category: 'SERIOUS_ALLEGATION' }] }), now), rejected('NO_PRIMARY_SOURCE'))
})
test('semantic reviewer can reject derivative reporting, contradictions, or unsupported claims', async () => {
  for (const [r, reason] of [
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
    const c = force ? trustedCandidate : { ...trustedCandidate, title: 'Acme reports security breach' }
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
  for (const content of ['{bad', JSON.stringify({ ...passageFacts(), confidence: 20 }), JSON.stringify({ ...passageFacts(), confirmedFacts: [{ ...passageFacts().confirmedFacts[0], claim: 'Acme has 900 users.' }] })]) {
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
  assert.equal(calls, Math.min(failures + 1, 3)); assert.deepEqual(waits, failures === 1 ? [6000] : [6000, 11000])
})
test('retry headers, invalid values, jitter and maximum delays are bounded', () => {
  const delay = (headers: Record<string, string>, attempt = 1) => retryDelay(new Headers(headers), attempt, Date.parse('2026-09-17T00:00:00Z'), 0.5)
  assert.equal(delay({ 'retry-after': '12' }), 13000)
  assert.equal(delay({ 'retry-after': 'Thu, 17 Sep 2026 00:00:20 GMT' }), 21000)
  assert.equal(delay({ 'retry-after': '999999' }), 1000000000)
  assert.equal(delay({ 'retry-after': '0' }), 2000)
  assert.equal(delay({ 'retry-after': '-1' }), 6500)
  assert.equal(delay({ 'retry-after': 'garbage' }, 2), 11500)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': '1m2.5s' }), 63500)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': '2.5s', 'x-ratelimit-reset-requests': '4s' }), 5000)
  assert.equal(delay({ 'x-ratelimit-reset-tokens': 'secret' }), 6500)
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
  for (let i = 0; i < Math.ceil(QUALITY.maxModelCalls / 3); i++) await assert.rejects(m('facts', {}), e => e instanceof ModelFailure)
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

for (const detail of ['SOURCE_ID_NOT_FOUND', 'EXCERPT_NOT_IN_SOURCE', 'CLAIM_NUMBER_NOT_IN_EXCERPT']) test(`facts diagnostics: ${detail} stays fail-closed`, async () => {
  const f = clone(facts), bad = clone(facts.confirmedFacts[0]); bad.id = 'secret-fact-id'; bad.core = false
  if (detail === 'SOURCE_ID_NOT_FOUND') bad.supportedBy[0].sourceId = 'secret-source-id'
  if (detail === 'EXCERPT_NOT_IN_SOURCE') bad.supportedBy[0].excerpt = 'secret unsupported excerpt of sufficient length'
  if (detail === 'CLAIM_NUMBER_NOT_IN_EXCERPT') bad.claim = 'Acme has 987654 secret users.'
  f.confirmedFacts.push(bad)
  let calls = 0, writes = 0; const logs: string[] = []
  assert.equal(await processCandidate(candidate, { collect: async () => [primary], model: async () => { calls++; return f }, history: [], now, log: line => logs.push(line), publish: async () => { writes++ } }), false)
  assert.equal(calls, 1); assert.equal(writes, 0)
  const diagnostic = logs.find(line => line.startsWith('[AIBeat Facts Validation]'))!
  assert.match(diagnostic, /Facts extracted: 2.*Fact index: 2.*Core: NO.*Citation count: 1.*Citation index: 1/)
  assert.ok(diagnostic.includes(`Evidence source matched: ${detail === 'SOURCE_ID_NOT_FOUND' ? 'NO' : 'YES'}`))
  assert.ok(diagnostic.includes(`Failure detail: ${detail}`)); assert.doesNotMatch(diagnostic, /secret|987654|Acme/)
  assert.ok(logs.some(line => line.includes(`Stage: facts_validation | Reason: UNSUPPORTED_CLAIM: ${detail}`)))
})
test('facts diagnostics preserve paraphrases and normalized verbatim excerpts', () => {
  const f = clone(facts); f.confirmedFacts[0].claim = 'Acme introduced its Atlas editor.'
  f.confirmedFacts[0].supportedBy[0].excerpt = excerpt.toUpperCase().replaceAll(' ', '  ')
  const logs: string[] = []; checkFacts(candidate, f, [primary], now, undefined, false, line => logs.push(line)); assert.equal(logs.length, 0)
})
test('equivalent numeric representations pass without changing citation provenance', () => {
  const f = clone(facts), s = { ...primary, text: excerpt + ' The release costs 10 dollars.' }
  f.confirmedFacts[0].claim = 'The release costs $10.'; f.confirmedFacts[0].supportedBy[0].excerpt = excerpt + ' The release costs 10 dollars.'
  assert.equal(checkFacts(candidate, f, [s], now).confirmedFacts.length, 1)
})
test('last budgeted HTTP request receives 429 without retry or sleep', async () => {
  let calls = 0; const logs: string[] = []; const waits: number[] = []
  const m = createModel('key', 'fixture', (async () => ++calls < QUALITY.maxModelCalls ? completion(JSON.stringify(facts)) : new Response(null, { status: 429 })) as typeof fetch, line => logs.push(line), { ...noWait, sleep: async ms => { waits.push(ms) } })
  for (let i = 0; i < QUALITY.maxModelCalls - 1; i++) await m('facts', {})
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  assert.equal(calls, QUALITY.maxModelCalls); assert.equal(waits.length, 0); assert.ok(logs.some(line => /HTTP status: 429.*Attempt: 1\/3.*MODEL_RATE_LIMITED/.test(line)))
  assert.ok(!logs.some(line => line.includes('Retrying after:')))
})

// Production-unblock acceptance boundaries, specified before normalization changes.
for (const [claim, evidence] of [
  ['$10', '10 dollars'], ['$2,200', '2200 dollars'], ['10%', '10 percent'],
  ['34', '34'], ['10.00', '10'], ['18 million', '18,000,000'],
  ['$18m', '18 million dollars'], ['2 billion', '2000 million'],
  ['Raised 18 million', 'Raised $18 million'], ['Raised $18 million', 'Raised 18 million USD'],
]) test(`numeric equivalent: ${claim} / ${evidence}`, () => assert.equal(numbersSupported(claim, evidence), true))
for (const [claim, evidence] of [
  ['10', '100'], ['18 million', '18 billion'], ['$10', '€10'],
  ['5%', '0.5%'], ['10%', '10'], ['$10', '10'], ['18 million users', '$18 million'],
  ['Raised $18 million', 'Raised 18 million'], ['10.01', '10'], ['-10', '10'],
  ['$10', '10 Canadian dollars'], ['10', '1,0'], ['9007199254740993', '9007199254740992'],
]) test(`numeric mismatch: ${claim} / ${evidence}`, () => assert.equal(numbersSupported(claim, evidence), false))

for (const [a, b] of [['5m cable', '5 million cable'], ['Raised 18 million users', 'Raised $18 million'], ['10 percent', '10 dollars'], ['€10', '$10'], ['18 billion', '18 million']]) test(`ambiguous/mismatched units stay rejected: ${a}`, () => assert.equal(numbersSupported(a, b), false))
for (const key of ['citation_date', 'dc.date.issued', 'dcterms.issued', 'dc.date.published', 'parsely-pub-date', 'og:article:published_time']) test(`official structured publication date: ${key}`, () => {
  const html = `<meta name="${key}" content="2026-09-15T09:00:00Z">`
  assert.equal(publicationDate(html, '', true), '2026-09-15T09:00:00.000Z')
  assert.throws(() => publicationDate(html, ''), rejected('INVALID_DATE'))
})
test('official typed dates, microdata and date rejection boundaries', () => {
  assert.equal(publicationDate('<script type="application/ld+json">{"@type":"https://schema.org/ScholarlyArticle","datePublished":{"@value":"2026-09-15"}}</script>', '', true), '2026-09-15T00:00:00.000Z')
  assert.equal(publicationDate('<time itemprop="datePublished" datetime="2026-09-15"></time>', '', true), '2026-09-15T00:00:00.000Z')
  for (const html of ['<p>Published September 15 2026</p>', '<meta name="dateModified" content="2026-09-15">', '<meta name="date" content="2026-09-15">']) assert.throws(() => publicationDate(html, '', true), rejected('INVALID_DATE'))
  assert.throws(() => publicationDate('<meta name="citation_date" content="2026-09-15"><meta property="article:published_time" content="2026-09-14">', '', true), e => e instanceof Rejection && e.detail === 'PUBLICATION_DATES_CONFLICT')
})
test('only a related article headline can add an official organization', async () => {
  for (const headline of ['Nvidia launches Atlas editor', 'Nvidia reports unrelated earnings']) {
    const { fetcher, requested } = fixtureFetcher({ [candidate.url]: evidenceHtml(`<h1>${headline}</h1>`), 'https://blogs.nvidia.com/feed/': '<rss version="2.0"><channel><title>Nvidia</title></channel></rss>' })
    await collectSources(candidate, [], fetcher, () => {}, now)
    assert.equal(requested.includes('https://blogs.nvidia.com/feed/'), headline.includes('Atlas'))
  }
})
test('funding stories do not select Microsoft feeds from incidental product mentions', async () => {
  const c = { ...candidate, title: 'ExampleCo raises $18 million for audio technology' }
  const { fetcher, requested } = fixtureFetcher({ [c.url]: evidenceHtml('<p>Customers use Microsoft Windows and Copilot.</p>') })
  await collectSources(c, [], fetcher, () => {}, now)
  assert.ok(!requested.some(url => /microsoft|windows/.test(url)))
})
test('large official HTML retains complete evidence within retained cap', async () => {
  const html = '<script type="application/json">' + 'x'.repeat(1_100_000) + '</script>' + evidenceHtml()
  const fetcher = new SourceFetcher((async () => new Response(html, { headers: { 'content-type': 'text/html', 'content-length': String(Buffer.byteLength(html)) } })) as typeof fetch, async () => {})
  const page = await fetcher.get('https://www.anthropic.com/news/fixture')
  assert.ok(Buffer.byteLength(page.body) <= QUALITY.maxSourceBytes)
  assert.equal(extractSource(page.url, page.body, 's1').publishedAt, '2026-09-15T09:00:00.000Z')
  assert.equal(fetcher.count, 1)
})
for (const kind of ['hard-cap', 'retained-cap', 'non-primary', 'missing-body']) test(`large HTML fails closed: ${kind}`, async () => {
  const html = kind === 'hard-cap' ? 'x'.repeat(4_000_001) : kind === 'retained-cap' ? evidenceHtml('<p>' + 'x'.repeat(1_100_000) + '</p>') : '<script>' + 'x'.repeat(1_100_000) + '</script>' + (kind === 'missing-body' ? '' : evidenceHtml())
  const fetcher = new SourceFetcher((async () => new Response(html, { headers: { 'content-type': 'text/html' } })) as typeof fetch, async () => {})
  await assert.rejects(fetcher.get(kind === 'non-primary' ? 'https://theverge.com/news/test' : 'https://anthropic.com/news/test'), e => e instanceof Rejection && e.detail === 'BODY_TOO_LARGE')
})
function optionalNumericFact() {
  const f = clone(facts)
  f.confirmedFacts.push({ id: 'f2', core: false, confidence: 95, claim: 'The Atlas editor offers 100 themes.', supportedBy: [{ sourceId: 's1', excerpt }] })
  return f
}
test('independent low-risk optional numeric fact drops before draft and review', async () => {
  const f = optionalNumericFact(), logs: string[] = []
  const approved = await evaluateCandidate(candidate, [primary], [], async (stage, input) => {
    if (stage === 'facts') return f
    if (stage === 'draft') { assert.equal((input as {confirmedFacts: unknown[]}).confirmedFacts.length, 1); return draft }
    assert.equal((input as {facts: FactSheet}).facts.confirmedFacts.length, 1); return review
  }, now, false, line => logs.push(line))
  assert.equal(approved.facts.confirmedFacts.length, 1); assert.equal(f.confirmedFacts.length, 2)
  assert.match(logs.join(' '), /Result: DROP/)
})
for (const problem of ['core', 'unknown-id', 'invented-excerpt', 'confidence', 'qualification', 'dependent-core', 'risk', 'source-policy']) test(`optional fact cannot bypass ${problem}`, () => {
  const f = optionalNumericFact(), extra = f.confirmedFacts[1]
  let sources = [primary]
  if (problem === 'core') extra.core = true
  if (problem === 'unknown-id') extra.supportedBy[0].sourceId = 'invented'
  if (problem === 'invented-excerpt') extra.supportedBy[0].excerpt = 'An invented source passage with 100 themes.'
  if (problem === 'confidence') extra.confidence = 20
  if (problem === 'qualification') extra.claim = 'The Atlas editor requires 100 paid licenses.'
  if (problem === 'dependent-core') f.confirmedFacts[0].claim = 'This editor launched for developers.'
  if (problem === 'risk') { extra.claim = 'Acme raised $100 million in funding.'; f.riskAssessments = [{ factId: 'f2', category: 'FUNDING' }] }
  if (problem === 'source-policy') { sources = [primary, { ...reporting, id: 's2' }]; extra.supportedBy[0].sourceId = 's2' }
  assert.throws(() => checkFacts(candidate, f, sources, now), e => e instanceof Rejection)
})
test('draft object schema remains strict and prompt explicitly describes its shape', async () => {
  for (const value of [null, [], 'text', {draft}, {title: 'x', deck: 'y', sections: []}]) assert.throws(() => parseDraft(value), rejected('MALFORMED_MODEL_OUTPUT'))
  assert.deepEqual(parseDraft(draft), draft)
  const m = createModel('key', 'fixture', (async (_url, init) => {
    const request = JSON.parse(init!.body as string)
    assert.match(request.messages[0].content, /exactly one top-level JSON object/)
    assert.equal(request.max_tokens, 3000); assert.equal(request.model, 'fixture')
    return completion(JSON.stringify(draft))
  }) as typeof fetch, () => {}, noWait)
  assert.deepEqual(await m('draft', {}), draft)
})
test('facts prompt specifies supplied IDs and minimal verbatim numerical evidence', async () => {
  const m = createModel('key', 'fixture', (async (_url, init) => {
    const prompt = JSON.parse(init!.body as string).messages[0].content
    assert.match(prompt, /exact supplied source IDs/); assert.match(prompt, /Claims may be paraphrased/)
    assert.match(prompt, /do not copy or generate excerpt text/); assert.match(prompt, /each cited source/)
    return completion(JSON.stringify(facts))
  }) as typeof fetch, () => {}, noWait)
  await m('facts', {})
})

test('numeric punctuation, negative signs and explicit foreign dollar symbols are conservative', () => {
  assert.equal(numbersSupported('34', '34, plus other features'), true)
  assert.equal(numbersSupported('−10', '10'), false)
  assert.equal(numbersSupported('$10', 'A$10'), false)
  assert.equal(numbersSupported('$10', 'C$10'), false)
})
test('dateModified time does not substitute for publication', () => {
  assert.throws(() => publicationDate('', '<time itemprop="dateModified" datetime="2026-09-15"></time>', true), rejected('INVALID_DATE'))
})
test('large-page byte cap cancels a streaming response without reading indefinitely', async () => {
  let cancelled = false, pulls = 0
  const body = new ReadableStream<Uint8Array>({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(500_000).fill(32)) }, cancel() { cancelled = true } })
  const fetcher = new SourceFetcher((async () => new Response(body, { headers: { 'content-type': 'text/html' } })) as typeof fetch, async () => {})
  await assert.rejects(fetcher.get('https://anthropic.com/news/test'), e => e instanceof Rejection && e.detail === 'BODY_TOO_LARGE')
  assert.ok(cancelled); assert.ok(pulls <= 10)
})
test('large primary extraction retains JSON-LD and still rejects missing publication date', async () => {
  for (const hasDate of [true, false]) {
    const html = '<script>' + 'x'.repeat(1_100_000) + '</script>' + (hasDate ? '<script type="application/ld+json">{"@type":"NewsArticle","datePublished":"2026-09-15"}</script>' : '') + '<article>' + 'Evidence about the Atlas editor and developers. '.repeat(15) + '</article>'
    const fetcher = new SourceFetcher((async () => new Response(html, { headers: { 'content-type': 'text/html' } })) as typeof fetch, async () => {})
    const page = await fetcher.get('https://anthropic.com/news/test')
    if (hasDate) assert.equal(extractSource(page.url, page.body, 's1').publishedAt, '2026-09-15T00:00:00.000Z')
    else assert.throws(() => extractSource(page.url, page.body, 's1'), rejected('INVALID_DATE'))
  }
})

test('fractional percentages and negative currency preserve actual values', () => {
  assert.equal(numbersSupported('.5%', '0.5 percent'), true)
  assert.equal(numbersSupported('5%', '.5%'), false)
  assert.equal(numbersSupported('-$10', '$10'), false)
  assert.equal(numbersSupported('-$10', '-10 dollars'), true)
})

test('Apple TV 4K keeps explicit resolution evidence without interpreting it as money', () => {
  const text = 'Save $30 on a refurbished Apple TV 4K'
  assert.equal(numbersSupported(text, text), true)
  assert.equal(numbersSupported(text, text.replace('4K', '8K')), false)
  assert.equal(numbersSupported('Apple TV 4K', 'Apple TV 4000'), false)
  assert.equal(numbersSupported('4K display', 'Display costs $4,000'), false)
  assert.equal(numbersSupported('A 4K prize', 'A 4K prize'), false)
  assert.equal(numbersSupported('Raised $4K', 'Raised 4000 dollars'), true)
  const d = numericDiagnostic({ factIndex: 1, core: true, claim: text, sourceId: 's1', excerpt: text.replace('4K', '8K') })
  assert.ok('failedClaimToken' in d)
  if ('failedClaimToken' in d) { assert.equal(d.failedClaimToken?.unit, 'resolution_k'); assert.equal(d.failedClaimToken?.normalizedValue, '4') }
})

test('numeric observer agrees with unchanged acceptance across diagnostic conditions', () => {
  for (const [claim, excerpt] of [['$10', '10 dollars'], ['$10', '€10'], ['10', '20'], ['Apple TV 4K', 'Apple TV 4K'], ['Saved 10', '$10'], ['Raised 10', '$10 and €10'], ['10', '10%'], ['10', 'no numbers'], ['10', 'C$10'], ['10', '4K'], ['Raised 10', '$10'], ['1,0', '10']]) {
    const d = explainQuantities(claim, excerpt)
    assert.equal(d.failures.length === 0, numbersSupported(claim, excerpt), claim + ' / ' + excerpt)
  }
  assert.equal(explainQuantities('$10', '€10').failures[0].comparisons[0].reason, 'UNIT_OR_CURRENCY_MISMATCH')
  assert.equal(explainQuantities('10', '20').failures[0].comparisons[0].reason, 'VALUE_MISMATCH')
})
test('numeric diagnostics clip content/tokens and redact credentials including their digits', () => {
  const input = { factIndex: 1, core: true, claim: '10 '.repeat(1000), sourceId: 's1', excerpt: '20 '.repeat(1000) }
  const d = numericDiagnostic(input)
  assert.ok(JSON.stringify(d).length < 6000)
  assert.ok('diagnosticsClipped' in d && d.diagnosticsClipped)
  for (const secret of ['gsk_secret987654321', 'GROQ_API_KEY=secret987654321', 'Bearer secret987654321', 'https://example.com/path?token=secret987654321']) {
    const result = numericDiagnostic({ ...input, claim: secret, excerpt: secret })
    assert.doesNotMatch(JSON.stringify(result), /secret987654321/)
    assert.ok('numericDetails' in result && result.numericDetails === 'SUPPRESSED_REDACTED_INPUT')
  }
  assert.doesNotMatch(JSON.stringify(numericDiagnostic({ ...input, claim: 'line1\nFAKE LOG' })), /\nFAKE LOG/)
})
test('actual fact failure includes bounded numeric diagnostic without changing decision', () => {
  const f = clone(facts); f.confirmedFacts[0].claim = 'Acme launched 999 Atlas editors.'
  const logs: string[] = []
  assert.throws(() => checkFacts(candidate, f, [primary], now, undefined, false, line => logs.push(line)), e => e instanceof Rejection && e.detail === 'CLAIM_NUMBER_NOT_IN_EXCERPT')
  const line = logs.find(line => line.startsWith('[AIBeat Numeric Evidence] '))!
  const diagnostic = JSON.parse(line.slice('[AIBeat Numeric Evidence] '.length))
  assert.equal(diagnostic.factIndex, 1); assert.equal(diagnostic.core, true); assert.equal(diagnostic.citationSourceId, 's1')
  assert.equal(diagnostic.failedClaimToken.normalizedValue, '999')
})
for (const value of [null, [], 'draft text', 123, true]) test(`draft expected_object reports safe parsed type: ${typeof value}/${Array.isArray(value)}`, async () => {
  const logs: string[] = []
  const m = createModel('key', 'fixture', (async () => completion(JSON.stringify(value))) as typeof fetch, line => logs.push(line), noWait)
  await assert.rejects(m('draft', {}), e => e instanceof ModelFailure && e.category === 'MODEL_SCHEMA_INVALID')
  const expected = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  assert.ok(logs.some(line => line.includes('Parsed JSON type: ' + expected) && line.includes('Problem: expected_object')))
  assert.doesNotMatch(logs.join(' '), /draft text/)
})
test('production retry and repair sequence exhausts the configured budget at its final request', async () => {
  const sequence = [facts, draft, facts, 429, [], 429, 429, facts, ...Array.from({ length: QUALITY.maxModelCalls - 9 }, () => facts), 429]
  const logs: string[] = []; const waits: number[] = []; let calls = 0
  const m = createModel('key', 'fixture', (async () => {
    const value = sequence[calls++]
    return value === 429 ? new Response(null, { status: 429, headers: { 'retry-after': calls === 4 ? '4' : '22' } }) : completion(JSON.stringify(value))
  }) as typeof fetch, line => logs.push(line), { ...noWait, sleep: async ms => { waits.push(ms) } })
  await m('facts', {}); await m('draft', {}); await m('facts', {})
  await assert.rejects(m('draft', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  assert.equal(calls, 6)
  await m('facts', {})
  for (let i = 0; i < QUALITY.maxModelCalls - 9; i++) await m('facts', {})
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  for (let i = 0; i < 2; i++) await assert.rejects(m('facts', {}), rejected('BUDGET_EXHAUSTED'))
  assert.equal(calls, QUALITY.maxModelCalls); assert.deepEqual(waits, [5000, 23000, 23000])
  assert.ok(logs.some(line => line.includes(`Global call: 6/${QUALITY.maxModelCalls} | Retry not attempted: REPAIR_ATTEMPT_LIMIT`)))
  assert.ok(logs.some(line => line.includes(`Global call: ${QUALITY.maxModelCalls}/${QUALITY.maxModelCalls} | Retry not attempted: GLOBAL_CALL_BUDGET_EXHAUSTED`)))
  assert.equal(logs.filter(line => line.includes('Request not sent: BUDGET_EXHAUSTED')).length, 2)
})

test('terminal repair 429 cools down the next candidate without an extra retry or budget increase', async () => {
  let elapsed = 0, calls = 0, readyAt = 0; const waits: number[] = []
  const m = createModel('key', 'fixture', (async () => {
    calls++
    if (calls === 1) return completion('[]')
    if (calls === 2) { readyAt = elapsed + 22000; return new Response(null, { status: 429, headers: { 'retry-after': '22' } }) }
    assert.ok(elapsed >= readyAt, 'next candidate must respect provider cooldown')
    return completion(JSON.stringify(facts))
  }) as typeof fetch, () => {}, { now: () => elapsed, random: () => 0, sleep: async ms => { waits.push(ms); elapsed += ms } })
  await assert.rejects(m('draft', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  assert.equal(calls, 2); assert.deepEqual(waits, [])
  assert.deepEqual(await m('facts', {}), facts)
  assert.equal(calls, 3); assert.deepEqual(waits, [23000])
})
test('source discovery time reduces shared cooldown rather than adding a fresh full delay', async () => {
  let elapsed = 0, calls = 0; const waits: number[] = []
  const m = createModel('key', 'fixture', (async () => {
    calls++
    return calls <= 3 ? new Response(null, { status: 429, headers: { 'retry-after': '10' } }) : completion(JSON.stringify(facts))
  }) as typeof fetch, () => {}, { now: () => elapsed, random: () => 0, sleep: async ms => { waits.push(ms); elapsed += ms } })
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure)
  elapsed += 7000
  await m('facts', {})
  assert.deepEqual(waits, [11000, 11000, 4000]); assert.equal(calls, 4)
})
test('published stories are removed before the six-slot selection; broad coverage remains', () => {
  const old = Array.from({ length: 6 }, (_, i) => ({ ...candidate, url: `https://theverge.com/old-${i}`, publishedAt: '2026-09-16T11:00:00Z' }))
  const pending = ['AI tool launches', 'New game announced', 'Camera release', 'Streaming service update', 'Laptop launch', 'Display update', 'Phone launch'].map((title, i) => ({ ...candidate, title, url: `https://theverge.com/new-${i}` }))
  const history = old.map((c, i) => ({ slug: `old-${i}`, title: c.title, publishedAt: c.publishedAt, sources: [{ name: 'The Verge', url: c.url + '?utm_source=feed' }] }))
  const selected = selectCandidates([...old, ...pending], history)
  assert.equal(selected.length, 6); assert.ok(selected.every(c => c.url.includes('/new-')))
  assert.ok(selected.some(c => c.title === 'New game announced')); assert.ok(selected.some(c => c.title === 'Camera release'))
  assert.equal(QUALITY.maxCandidates, 6); assert.equal(QUALITY.maxModelCalls, 30)
})


function splitEvidenceFixture() {
  const price = 'Acme Atlas is available for $875 with an editing workspace.'
  const duration = 'Acme Atlas includes updates for 12 years with that purchase.'
  const f = clone(facts)
  f.confirmedFacts[0].claim = 'Acme Atlas costs $875 and includes 12 years of updates.'
  f.confirmedFacts[0].supportedBy = [price, duration].map(excerpt => ({ sourceId: 's1', excerpt }))
  return { f, source: { ...primary, text: primary.text + ' ' + price + ' ' + duration } }
}

test('verified passages from one source jointly support an original factual brief', async () => {
  const { f, source } = splitEvidenceFixture()
  const d = clone(draft)
  d.sections[0].paragraphs[0].text = 'For $875, buyers get Acme Atlas with updates included for 12 years.'
  const result = await evaluateCandidate(candidate, [source], [], model(f, d), now)
  assert.equal(result.facts.confirmedFacts.length, 1)
  assert.equal(result.draft.sections[0].paragraphs[0].text, d.sections[0].paragraphs[0].text)
})

test('grouped citations cannot supply a missing number or borrow from a different source', () => {
  const { f, source } = splitEvidenceFixture()
  f.confirmedFacts[0].supportedBy.pop()
  assert.throws(() => checkFacts(candidate, f, [source], now), rejected('UNSUPPORTED_CLAIM'))
  const other = splitEvidenceFixture()
  other.f.confirmedFacts[0].supportedBy[1].sourceId = 's2'
  assert.throws(() => checkFacts(candidate, other.f, [other.source, { ...reporting, text: other.source.text }], now), rejected('UNSUPPORTED_CLAIM'))
})

test('grouped evidence still validates every excerpt and source ID', () => {
  for (const mode of ['excerpt', 'sourceId'] as const) {
    const { f, source } = splitEvidenceFixture()
    f.confirmedFacts[0].supportedBy[1][mode] = 'fabricated evidence not in the retrieved document'
    assert.throws(() => checkFacts(candidate, f, [source], now), rejected('UNSUPPORTED_CLAIM'))
  }
})

test('numeric support cannot cross fact boundaries', () => {
  const { f, source } = splitEvidenceFixture()
  const duration = f.confirmedFacts[0].supportedBy.pop()!
  f.confirmedFacts.push({ ...clone(f.confirmedFacts[0]), id: 'f2', claim: 'Acme Atlas includes 12 years of updates.', supportedBy: [duration] })
  assert.throws(() => checkFacts(candidate, f, [source], now), rejected('UNSUPPORTED_CLAIM'))
})

test('separate excerpts cannot synthesize a currency or magnitude at their boundary', () => {
  assert.equal(quantitiesSupported('18 million users', ['The count is 18', 'million people elsewhere']), false)
  assert.equal(quantitiesSupported('$18', ['The currency symbol is $', '18 users joined']), false)
  assert.equal(quantitiesSupported('$18 million over 12 years', ['The price is $18 million.', 'The duration is 12 years.']), true)
})

test('multiple passages never replace independent high-risk corroboration', () => {
  const { f, source } = splitEvidenceFixture()
  assert.throws(() => checkFacts(candidate, f, [source], now, undefined, true), rejected('UNVERIFIED_HIGH_RISK_CLAIM'))
  f.confirmedFacts[0].supportedBy.push(...f.confirmedFacts[0].supportedBy.map(c => ({ ...c, sourceId: 's2' })))
  assert.doesNotThrow(() => checkFacts(candidate, f, [source, { ...reporting, text: source.text }], now, undefined, true))
  f.confirmedFacts[0].supportedBy.pop()
  assert.throws(() => checkFacts(candidate, f, [source, { ...reporting, text: source.text }], now, undefined, true), rejected('UNSUPPORTED_CLAIM'))
})

test('final review can reject misleading combinations even when numbers are present', async () => {
  const { f, source } = splitEvidenceFixture()
  await assert.rejects(evaluateCandidate(candidate, [source], [], model(f, draft, { ...review, supportedFactIds: [], unsupportedClaims: ['The duration concerns a different product.'] }), now), rejected('UNSUPPORTED_CLAIM'))
})

test('grouped numeric diagnostics use all passages and suppress secrets in any passage', () => {
  const input = { factIndex: 1, core: true, claim: '$875 over 13 years', sourceId: 's1', excerpt: 'It costs $875.', excerpts: ['It costs $875.', 'It lasts 12 years.'], citationIndices: [1, 2] }
  const result = numericDiagnostic(input)
  assert.equal(result.citationCount, 2)
  assert.deepEqual(result.citationIndices, [1, 2])
  assert.ok('excerptTokenCount' in result && result.excerptTokenCount === 2)
  assert.ok('failedClaimToken' in result && result.failedClaimToken?.normalizedValue === '13')
  const redacted = numericDiagnostic({ ...input, excerpts: [...input.excerpts, 'gsk_secret123456'] })
  assert.ok('numericDetails' in redacted && redacted.numericDetails === 'SUPPRESSED_REDACTED_INPUT')
  assert.doesNotMatch(JSON.stringify(redacted), /secret123456/)
})


test('review diagnostics identify quality flags without logging review content', async () => {
  for (const field of ['analysisGrounded', 'originalValue', 'clearWriting'] as const) {
    const logs: string[] = []
    const evaluation = evaluateCandidate(candidate, [primary], [], model(facts, draft, { ...review, [field]: false }), now, false, line => logs.push(line))
    if (field === 'analysisGrounded') await assert.rejects(evaluation, rejected('LOW_INFORMATION_VALUE'))
    else assert.ok((await evaluation).qualityScore >= QUALITY.publishThreshold)
    const label = { analysisGrounded: 'Analysis grounded', originalValue: 'Original value', clearWriting: 'Clear writing' }[field]
    assert.ok(logs.some(line => line.startsWith('[AIBeat Review]') && line.includes(label + ': FAIL')))
    assert.doesNotMatch(logs.join(' '), /Acme launched/)
  }
})

test('long provider cooldown defers requests without spending more model calls', async () => {
  let elapsed = 0, calls = 0; const logs: string[] = []
  const m = createModel('key', 'fixture', (async () => {
    calls++
    return calls === 1 ? new Response(null, { status: 429, headers: { 'retry-after': '120' } }) : completion(JSON.stringify(facts))
  }) as typeof fetch, line => logs.push(line), { now: () => elapsed, random: () => 0, sleep: async ms => { elapsed += ms } })
  await assert.rejects(m('facts', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  await assert.rejects(m('draft', {}), e => e instanceof ModelFailure && e.category === 'MODEL_RATE_LIMITED')
  assert.equal(calls, 1); assert.equal(elapsed, 0)
  assert.ok(logs.some(line => line.includes('PROVIDER_COOLDOWN_EXCEEDS_WAIT_WINDOW')))
  elapsed = 121000
  await m('facts', {})
  assert.equal(calls, 2)
})

test('official feed discovery retains exact host authority and the existing budgets', () => {
  for (const url of ['https://openai.com/news/rss.xml', 'https://blog.google/rss/', 'https://blogs.nvidia.com/feed/']) {
    assert.ok(RSS_FEEDS.includes(url))
    assert.equal(classifySource(url).tier, 1)
  }
  assert.equal(classifySource('https://openai.com.example.org/news/').tier, 3)
  assert.equal(QUALITY.maxFetches, 32); assert.equal(QUALITY.maxModelCalls, 30)
  assert.ok(RSS_FEEDS.includes('https://www.theverge.com/rss/index.xml'))
})


test('editorial candidates keep priority when official feeds contain many recent announcements', () => {
  const editorial = Array.from({ length: 7 }, (_, i) => ({ ...candidate, url: `https://techcrunch.com/2026/09/15/story-${i}`, publishedAt: '2026-09-15T09:00:00Z' }))
  const official = Array.from({ length: 10 }, (_, i) => ({ ...candidate, url: `https://openai.com/index/story-${i}`, publishedAt: '2026-09-16T09:00:00Z' }))
  const selected = selectCandidates([...official, ...editorial], [])
  assert.equal(selected.length, 6)
  assert.ok(selected.slice(0, 4).every(c => classifySource(c.url).tier === 2))
  assert.equal(selected.filter(c => classifySource(c.url).tier === 1).length, 2)
  assert.equal(selectCandidates(editorial, []).length, 6)
  assert.equal(selectCandidates(official, []).length, 6)
})

test('verified staff reporting does not require a second model endorsement of its publisher', async () => {
  for (const [url, author] of [[techUrl, 'Alex Reporter'], ['https://www.forbes.com/sites/alex/2026/09/15/acme-atlas/', 'Alex Reporter, Forbes Staff']]) {
    const source = extractSource(url, editorialHtml(author), 's1')
    const approved = await evaluateCandidate({ ...candidate, url }, [source], [], model(trustedFacts(), draft, { ...trustedReview, trustedEditorialSourceIds: [] }), now)
    assert.equal(approved.evidenceMode, 'TRUSTED_SINGLE_SOURCE')
    assert.equal(approved.sources.length, 1)
  }
})

test('explicit calendar day ranges normalize separators without changing negative quantities', () => {
  for (const separator of ['-', '‐', '‑', '–']) {
    assert.equal(numbersSupported('Sept 22 to 23', `Sept. 22${separator}23`), true)
    assert.equal(numbersSupported(`Sept 22${separator}23`, 'Sept. 22 to 23'), true)
  }
  assert.equal(numbersSupported('Sept 22 to 23 2026', 'Sept. 22-23'), false)
  assert.equal(numbersSupported('23 degrees', '-23 degrees'), false)
  assert.equal(numbersSupported('$23', '-$23'), false)
  assert.equal(numbersSupported('23', '−23'), false)
})

test('draft diagnostics show retained coverage and removed paragraphs without emitting text', async () => {
  const logs: string[] = []
  await evaluateCandidate(candidate, [primary], [], model(), now, false, line => logs.push(line))
  const line = logs.find(line => line.startsWith('[AIBeat Draft]'))!
  assert.match(line, /Verified facts: 1.*Paragraphs retained: 2.*Paragraphs removed: 0.*Body words: \d+/)
  assert.doesNotMatch(line, /Acme|developers/)
})


function passageFacts() {
  return { ...clone(facts), eventDatePassageId: 'publication_timestamp', confirmedFacts: facts.confirmedFacts.map(f => ({ ...f, supportedBy: [{ sourceId: 's1', passageId: 's1:p1' }] })) }
}

test('passage IDs are deterministic exact contiguous slices with no text loss or duplication', () => {
  const text = ('Acme Atlas release has carefully verified details. '.repeat(35)) + 'Final supported sentence.'
  const passages = sourcePassages('s1', text)
  assert.deepEqual(sourcePassages('s1', text), passages)
  assert.equal(passages.map(p => p.text).join(''), text)
  assert.ok(passages.every(p => p.text.length >= 20 && p.text.length < 620 && text.includes(p.text)))
  assert.equal(new Set(passages.map(p => p.id)).size, passages.length)
  const prepared = passageSources([{ ...primary, text }])[0]
  assert.equal('text' in prepared, false)
  assert.equal(prepared.passages.length, passages.length)
})

test('passage resolver attaches source text, ignores invented excerpts and resolves event evidence', () => {
  const input = { sources: passageSources([primary]) }
  const value = passageFacts()
  const resolved = resolveFactPassages({ ...value, confirmedFacts: value.confirmedFacts.map(f => ({ ...f, supportedBy: [{ ...f.supportedBy[0], excerpt: 'Invented quote' }] })) }, input) as FactSheet
  assert.equal(resolved.confirmedFacts[0].supportedBy[0].excerpt, primary.text)
  assert.equal(resolved.eventDateEvidence, primary.publishedAt)
  const dated = resolveFactPassages({ ...value, eventDatePassageId: 's1:p1' }, input) as FactSheet
  assert.equal(dated.eventDateEvidence, primary.text)
  assert.doesNotThrow(() => checkFacts(candidate, resolved, [primary], now))
})

for (const citation of [{ sourceId: 'missing', passageId: 's1:p1' }, { sourceId: 's1', passageId: 's2:p1' }, { sourceId: 's1', passageId: 's1:p999' }, { sourceId: 's1', excerpt: primary.text }]) test(`invalid passage reference cannot supply evidence: ${JSON.stringify(citation)}`, () => {
  const value = passageFacts()
  assert.throws(() => resolveFactPassages({ ...value, confirmedFacts: [{ ...value.confirmedFacts[0], supportedBy: [citation] }] }, { sources: passageSources([primary, reporting]) }), e => e instanceof PassageReferenceError)
})

test('passage facts complete the real model adapter and pipeline without extra requests', async () => {
  let calls = 0
  const m = createModel('key', 'fixture', (async (_url, options) => {
    const request = JSON.parse(options!.body as string)
    const input = JSON.parse(request.messages[1].content)
    calls++
    if (calls === 1) {
      assert.equal(input.sources[0].text, undefined)
      assert.equal(input.sources[0].passages[0].text, primary.text)
      return completion(JSON.stringify(passageFacts()))
    }
    if (calls === 2) {
      assert.equal(input.confirmedFacts[0].supportedBy, undefined)
      assert.equal(input.confirmedFacts[0].claim, facts.confirmedFacts[0].claim)
      return completion(JSON.stringify(draft))
    }
    assert.equal(input.sources[0].text, primary.text)
    return completion(JSON.stringify(review))
  }) as typeof fetch, () => {}, noWait)
  const approved = await evaluateCandidate(candidate, [primary], [], m, now)
  assert.equal(approved.facts.confirmedFacts[0].supportedBy[0].excerpt, primary.text)
  assert.equal(calls, 3)
})

test('unknown passage repair emits safe field diagnostics and cannot invent evidence', async () => {
  const logs: string[] = []; let calls = 0
  const value = passageFacts(); value.confirmedFacts[0].supportedBy[0].passageId = 'gsk_secret_dont_log'
  const m = createModel('key', 'fixture', (async () => { calls++; return completion(JSON.stringify(value)) }) as typeof fetch, line => logs.push(line), noWait)
  await assert.rejects(m('facts', { sources: passageSources([primary]) }), e => e instanceof ModelFailure && e.category === 'MODEL_SCHEMA_INVALID')
  assert.equal(calls, 2)
  assert.match(logs.join(' '), /Field: confirmedFacts.item.supportedBy.item.passageId.*Problem: unknown_passage_id/)
  assert.doesNotMatch(logs.join(' '), /gsk_secret_dont_log|Acme launched/)
})

test('entity names elsewhere in a cited document pass, while uncited or partial names fail', () => {
  const f = clone(facts); f.event.entities.push('Qualcomm')
  const source = { ...primary, text: primary.text + ' Qualcomm supplies the processor.' }
  assert.doesNotThrow(() => checkFacts(candidate, f, [source], now))
  assert.throws(() => checkFacts(candidate, f, [primary, { ...reporting, text: source.text }], now), rejected('UNVERIFIED_ENTITY'))
  f.event.entities = ['Qual']
  assert.throws(() => checkFacts(candidate, f, [source], now), rejected('UNVERIFIED_ENTITY'))
  f.event.entities = ['Acme']; f.event.product = 'Atlas Pro'
  assert.throws(() => checkFacts(candidate, f, [source], now), rejected('UNVERIFIED_ENTITY'))
})

test('whole-document entity presence does not bypass semantic review of roles', async () => {
  const f = clone(facts); f.event.entities.push('Qualcomm')
  await assert.rejects(evaluateCandidate(candidate, [{ ...primary, text: primary.text + ' Qualcomm supplies the processor.' }], [], model(f, draft, { ...review, unverifiedEntities: ['Qualcomm role unsupported'] }), now), rejected('UNVERIFIED_ENTITY'))
})

test('entity diagnostic identifies the field without logging supplied names', () => {
  const logs: string[] = []; const f = clone(facts); f.event.entities.push('secret_entity')
  assert.throws(() => checkFacts(candidate, f, [primary], now, undefined, false, line => logs.push(line)), e => e instanceof Rejection && e.detail === 'event.entities[1]:NAME_NOT_IN_CITED_SOURCE')
  assert.match(logs.join(' '), /event.entities\[1\].*NAME_NOT_IN_CITED_SOURCE/)
  assert.doesNotMatch(logs.join(' '), /secret_entity/)
})

test('draft diagnostics identify unsupported title, deck, heading and unknown fact reference', () => {
  for (const field of ['title', 'deck', 'heading', 'reference']) {
    const d = clone(draft); const logs: string[] = []
    if (field === 'title' || field === 'deck') d[field] += ' 999 users'
    if (field === 'heading') d.sections[0].heading += ' 999 users'
    if (field === 'reference') d.sections[0].paragraphs[0].factIds = ['secret_fake_id']
    assert.throws(() => cleanDraft(d, facts, line => logs.push(line)), rejected('UNSUPPORTED_CLAIM'))
    assert.match(logs.join(' '), field === 'reference' ? /factIds\[0\].*UNKNOWN_FACT_REFERENCE/ : /NUMBER_NOT_IN_CONFIRMED_FACTS/)
    assert.doesNotMatch(logs.join(' '), /secret_fake_id|999|Acme/)
  }
  const d = clone(draft); const logs: string[] = []
  d.sections[1].paragraphs.push({ text: 'There are 999 users.', factIds: ['f1'] })
  assert.equal(cleanDraft(d, facts, line => logs.push(line)).removedParagraphs, 1)
  assert.match(logs.join(' '), /Result: DROP.*sections\[1\].paragraphs\[1\].*NUMBER_NOT_IN_REFERENCED_FACTS/)
})
