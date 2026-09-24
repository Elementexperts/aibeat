import { selectOutreachLeads } from '../lib/gmail-outreach-drafts'
import { spawnSync } from 'node:child_process'
import { appendDailyLeadCsv, completeLeadBatch, leadHistoryPath, readLeadRows } from '../lib/daily-lead-csv'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  chooseExternalWebsite,
  extractEmailsFromHtml,
  inferContactType,
  isPublicBusinessEmail,
  runDailyLeadDiscovery,
  scoreLead,
  type LeadCandidate,
  type ValidatedContact,
} from '../lib/daily-lead-discovery'

function response(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html' } })
}

test('public business email extraction blocks unsafe and personal contacts', () => {
  const html = `
    <a href="mailto:hello@usefulai.dev">hello@usefulai.dev</a>
    privacy@usefulai.dev
    founder@gmail.com
    no-reply@usefulai.dev
  `

  assert.deepEqual(extractEmailsFromHtml(html), ['hello@usefulai.dev', 'founder@gmail.com'])
  assert.equal(isPublicBusinessEmail('hello@usefulai.dev', 'https://usefulai.dev'), true)
  assert.equal(isPublicBusinessEmail('founder@gmail.com', 'https://usefulai.dev'), false)
  assert.equal(isPublicBusinessEmail('privacy@usefulai.dev', 'https://usefulai.dev'), false)
  assert.equal(inferContactType('press@usefulai.dev'), 'press')
})

test('qualified AI launches score above the default threshold', () => {
  const candidate: LeadCandidate = {
    toolName: 'Useful AI',
    description: 'AI agent for support automation',
    productHuntUrl: 'https://www.producthunt.com/posts/useful-ai',
    websiteUrl: 'https://usefulai.dev',
    launchDate: '2026-08-02',
    category: 'AI tools',
    sourceName: 'Product Hunt',
    sourceUrl: 'https://www.producthunt.com/posts/useful-ai',
  }
  const contact: ValidatedContact = {
    email: 'press@usefulai.dev',
    contactType: 'press',
    sourceUrl: 'https://usefulai.dev/contact',
    notes: 'Email found on public page.',
  }

  const result = scoreLead(candidate, contact, new Date('2026-08-02T12:00:00Z'))

  assert.equal(result.score >= 70, true)
  assert.equal(result.reasons.includes('AI-related product positioning'), true)
})

test('daily discovery can qualify BetaList startup contacts', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-betalist-leads-'))
  const reportDir = join(dir, 'reports')
  const feed = `<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>`

  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = input.toString()
    if (url === 'https://example.test/feed') return response(feed, 200)
    if (url === 'https://betalist.test') {
      return response('<a href="/startups/beta-ai">Beta AI</a>', 200)
    }
    if (url === 'https://betalist.test/startups/beta-ai') {
      return response('<h1>Beta AI</h1><h2>AI workspace assistant for startup teams</h2><a href="https://feeds.feedburner.com/BetaList">RSS</a><a href="https://startup.jobs">Jobs</a><a href="https://betaai.test">Visit Site</a>', 200)
    }
    if (url === 'https://betaai.test/') return response('<a href="/contact">Contact</a>', 200)
    if (url === 'https://betaai.test/contact') return response('<a href="mailto:hello@betaai.test">hello@betaai.test</a>', 200)
    return response('missing', 404)
  }

  const report = await runDailyLeadDiscovery({
    now: new Date('2026-08-02T12:00:00Z'),
    fetchImpl,
    feedUrl: 'https://example.test/feed',
    betaListUrl: 'https://betalist.test',
    dryRun: true,
    maxCandidates: 5,
    maxLeads: 2,
    reportDir,
    storePath: join(dir, 'store.json'),
    sources: ['betalist'],
  })

  assert.equal(report.candidatesFound, 1)
  assert.equal(report.qualifiedLeads, 1)
  assert.equal(report.candidateInspections[0].sourceName, 'BetaList')
  assert.equal(report.candidateInspections[0].betaListUrl, 'https://betalist.test/startups/beta-ai')
  assert.equal(report.candidateInspections[0].websiteUrl, 'https://betaai.test/')
  assert.deepEqual(report.candidateInspections[0].validatedEmails, ['hello@betaai.test'])
})

test('website detection ignores assets analytics and generic jobs links', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-link-filter-leads-'))
  const reportDir = join(dir, 'reports')
  const feed = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Signal AI</title>
          <link>https://www.producthunt.com/posts/signal-ai</link>
          <description>AI agent for sales automation</description>
          <pubDate>Sun, 02 Aug 2026 08:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`

  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = input.toString()
    if (url === 'https://example.test/feed') return response(feed, 200)
    if (url === 'https://www.producthunt.com/posts/signal-ai') {
      return response([
        '<a href="https://ph-files.imgix.net/logo.gif">Logo</a>',
        '<a href="https://www.googletagmanager.com/gtag/js?id=G-WZ46833KH9">Analytics</a>',
        '<a href="https://startup.jobs">Jobs</a>',
        '<a href="https://signalai.test">Visit Website</a>',
      ].join(''), 200)
    }
    if (url === 'https://signalai.test/') return response('<a href="/contact">Contact</a>', 200)
    if (url === 'https://signalai.test/contact') return response('<a href="mailto:sales@signalai.test">sales@signalai.test</a>', 200)
    return response('missing', 404)
  }

  const report = await runDailyLeadDiscovery({
    now: new Date('2026-08-02T12:00:00Z'),
    fetchImpl,
    feedUrl: 'https://example.test/feed',
    dryRun: true,
    maxCandidates: 5,
    maxLeads: 2,
    reportDir,
    storePath: join(dir, 'store.json'),
    sources: ['product_hunt'],
  })

  assert.equal(report.qualifiedLeads, 1)
  assert.equal(report.candidateInspections[0].websiteUrl, 'https://signalai.test/')
  assert.deepEqual(report.candidateInspections[0].validatedEmails, ['sales@signalai.test'])
})

test('daily discovery dry run validates leads and writes a report only', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-daily-leads-'))
  const reportDir = join(dir, 'reports')
  const feed = `<?xml version="1.0"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Useful AI</title>
          <link>https://www.producthunt.com/posts/useful-ai</link>
          <description>AI agent for support automation</description>
          <pubDate>Sun, 02 Aug 2026 08:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`

  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const url = input.toString()
    if (url === 'https://example.test/feed') return response(feed, 200)
    if (url === 'https://www.producthunt.com/posts/useful-ai') {
      return response('<a href="https://usefulai.dev">Website</a>', 200)
    }
    if (url === 'https://usefulai.dev/') return response('<main><a href="/contact-sales">Contact us</a></main>', 200)
    if (url === 'https://usefulai.dev/contact-sales') return response('<a href="mailto:press@usefulai.dev">press@usefulai.dev</a>', 200)
    if (url === 'https://usefulai.dev/contact') return response('<a href="mailto:press@usefulai.dev">press@usefulai.dev</a>', 200)
    return response('missing', 404)
  }

  const report = await runDailyLeadDiscovery({
    now: new Date('2026-08-02T12:00:00Z'),
    fetchImpl,
    feedUrl: 'https://example.test/feed',
    dryRun: true,
    maxCandidates: 5,
    maxLeads: 2,
    reportDir,
    storePath: join(dir, 'store.json'),
    sources: ['product_hunt'],
  })

  assert.equal(report.candidatesFound, 1)
  assert.equal(report.qualifiedLeads, 1)
  assert.equal(report.leadsStored, 0)
  assert.equal(report.draftsCreated.length, 0)
  assert.equal(report.candidateInspections[0].contactLinksFound.includes('https://usefulai.dev/contact-sales'), true)
  assert.deepEqual(report.candidateInspections[0].validatedEmails, ['press@usefulai.dev'])
  assert.equal(existsSync(join(reportDir, `${report.runId}.json`)), true)
  assert.equal(existsSync(join(dir, 'store.json')), false)
})

test('off-site and same public-suffix contacts are not treated as product contacts', () => {
  assert.equal(isPublicBusinessEmail('hello@unrelated.com', 'https://usefulai.dev'), false)
  assert.equal(isPublicBusinessEmail('hello@other.co.uk', 'https://product.co.uk'), false)
  assert.equal(isPublicBusinessEmail('hello@product.co.uk', 'https://www.product.co.uk'), true)
  assert.deepEqual(extractEmailsFromHtml('<script>hello@product.co.uk</script><a href="mailto:press@product.co.uk">Press</a>'), ['press@product.co.uk'])
})

for (const mode of ['valid', 'offline', 'challenge', 'redirect', 'dry'] as const) test(`daily CSV handoff: ${mode}`, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-lead-handoff-'))
  const path = join(dir, 'leads.csv')
  writeFileSync(path, 'website,email,source,tool_name,category,personalized_opening\nold.test,hello@old.test,Manual,Old,,\n')
  const before = readFileSync(path, 'utf8')
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input)
    if (url === 'https://broken.test/feed') return response('unavailable', 503)
    if (url === 'https://betalist.test') return response('<a href="/startups/tool">Tool</a>')
    if (url === 'https://betalist.test/startups/tool') return response('<h1>Tool AI</h1><h2>AI editing for teams</h2><a href="https://tool.test">Visit Website</a>')
    if (url === 'https://tool.test/') {
      if (mode === 'offline') return response('Unavailable', 503)
      if (mode === 'challenge') return response('<title>Just a moment</title>hello@tool.test')
      if (mode === 'redirect') return new Response(null, { status: 302, headers: { location: 'https://other.test/' } })
      return response('<a href="/contact-sales">Contact</a>')
    }
    if (url === 'https://tool.test/contact-sales') return response('Email <a href="mailto:hello@tool.test">our team</a>')
    if (url === 'https://other.test/') assert.fail('must not follow off-site product redirects')
    return response('Missing', 404)
  }) as typeof fetch
  const options = { fetchImpl, sources: ['product_hunt', 'betalist'], feedUrl: 'https://broken.test/feed', betaListUrl: 'https://betalist.test', manualLeadsPath: path, storePath: join(dir, 'store.json'), reportDir: join(dir, 'reports'), dryRun: mode === 'dry', createDrafts: false }
  const report = await runDailyLeadDiscovery(options)
  assert.ok(report.skipped.some(item => item.reason.includes('Product Hunt discovery unavailable')))
  assert.equal(report.csvLeadsAdded, mode === 'valid' ? 1 : 0)
  assert.equal(report.draftsCreated.length, 0)
  if (mode === 'valid') {
    const parsed = parseDailyManualLeads(readFileSync(path, 'utf8'))
    assert.equal(parsed.errors.length, 0)
    assert.equal(parsed.leads.length, 2)
    assert.equal(parsed.leads[1].public_contact_source_url, 'https://tool.test/contact-sales')
    assert.equal(parsed.leads[1].tool_name, 'Tool AI')
    assert.equal((await runDailyLeadDiscovery(options)).csvLeadsAdded, 0)
    assert.equal(parseDailyManualLeads(readFileSync(path, 'utf8')).leads.length, 2)
  } else assert.equal(readFileSync(path, 'utf8'), before)
})

test('CSV export escapes commas and multiline text while preserving old rows', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-lead-csv-'))
  const path = join(dir, 'leads.csv')
  const lead = parseDailyManualLeads('website,email,source\ntool.test,hello@tool.test,Manual').leads[0]
  lead.tool_name = 'Tool, Inc.'; lead.personalized_opening = 'Useful tools\nfor teams'
  assert.equal(appendDailyLeadCsv(path, [lead, lead]), 1)
  const parsed = parseDailyManualLeads(readFileSync(path, 'utf8'))
  assert.equal(parsed.errors.length, 0); assert.equal(parsed.leads[0].tool_name, 'Tool, Inc.')
  assert.equal(parsed.leads[0].personalized_opening, 'Useful tools for teams')
})

test('workflow environment dry-run reaches CLI without writing CSV or store', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-cli-dry-'))
  const csv = join(dir, 'leads.csv'), store = join(dir, 'store.json')
  writeFileSync(csv, 'website,email,source\nold.test,hello@old.test,Manual\n')
  const before = readFileSync(csv, 'utf8')
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/daily-lead-discovery.ts'], {
    encoding: 'utf8', timeout: 30000, env: { ...process.env, DAILY_LEAD_DISCOVERY_SOURCES: 'offline-test', DAILY_LEAD_DISCOVERY_DRY_RUN: 'true', DAILY_LEAD_DISCOVERY_REPORT_DIR: dir, DAILY_MANUAL_LEADS_FILE: csv, OUTREACH_DATA_FILE: store },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /"dryRun": true/)
  assert.equal(readFileSync(csv, 'utf8'), before)
  assert.equal(existsSync(store), false)
})
test('Monday selects newly discovered rows beyond the first 120 without exceeding its limit', () => {
  const rows = Array.from({ length: 120 }, (_, i) => `old${i}.test,hello@old${i}.test,Manual,`).join('\n')
  const parsed = parseDailyManualLeads('website,email,source,discovered_at\n' + rows + '\nnew.test,hello@new.test,Daily discovery,2026-09-24T04:00:00Z')
  const selected = selectOutreachLeads(parsed.leads, 120)
  assert.equal(selected.length, 120)
  assert.equal(selected[0].email, 'hello@new.test')
  assert.equal(selected[1].email, 'hello@old0.test')
  assert.equal(selected[0].discovered_at, '2026-09-24T04:00:00Z')
})

test('BetaList image link and Product Hunt written website link select product destination', () => {
  assert.equal(chooseExternalWebsite('<a href="https://sponsor.test">Sponsor</a><a href="/startups/tool/visit"><picture><img src="/tool.png"></picture></a>', 'https://betalist.com/startups/tool'), 'https://betalist.com/startups/tool/visit')
  assert.equal(chooseExternalWebsite('<a href="https://sponsor.test">Sponsor</a><a href="https://product.test/app">Visit website</a>', 'https://www.producthunt.com/products/tool'), 'https://product.test/app')
})
test('Monday archive removes completed leads only, preserves overflow, and records batch date', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-weekly-'))
  const path = join(dir, 'leads.csv')
  const leads = parseDailyManualLeads('website,email,source,tool_name\none.test,hello@one.test,Daily,One\ntwo.test,hello@two.test,Daily,Two').leads
  leads[0].discovery_run_id = 'daily_fixture'
  appendDailyLeadCsv(path, leads)
  completeLeadBatch(path, [leads[0]], new Date('2026-09-28T16:00:00Z'))
  assert.deepEqual(readLeadRows(path).map(row => row.email), ['hello@two.test'])
  const history = readLeadRows(leadHistoryPath(path))
  assert.equal(history[0].outreach_drafted_at, '2026-09-28T16:00:00.000Z')
  assert.equal(history[0].discovery_run_id, 'daily_fixture')
  completeLeadBatch(path, [leads[0]])
  assert.equal(readLeadRows(leadHistoryPath(path)).length, 1)
  completeLeadBatch(path, [leads[1]])
  assert.equal(readLeadRows(path).length, 0)
  assert.equal(readLeadRows(leadHistoryPath(path)).length, 2)
})
test('archived tools are not rediscovered under a different email the next week', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'aibeat-history-'))
  const path = join(dir, 'leads.csv')
  const old = parseDailyManualLeads('website,email,source,tool_name\ntool.test,old@tool.test,Daily,Tool AI').leads
  appendDailyLeadCsv(path, old); completeLeadBatch(path, old)
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input)
    if (url === 'https://betalist.test') return response('<a href="/startups/tool">Tool</a>')
    if (url === 'https://betalist.test/startups/tool') return response('<h1>Tool AI</h1><a href="/startups/tool/visit"><img src="/tool.png"></a>')
    if (url === 'https://betalist.test/startups/tool/visit') return new Response(null, { status: 302, headers: { location: 'https://tool.test/' } })
    if (url === 'https://tool.test/') return response('Contact hello@tool.test')
    return response('missing', 404)
  }) as typeof fetch
  const report = await runDailyLeadDiscovery({ fetchImpl, sources: ['betalist'], betaListUrl: 'https://betalist.test', manualLeadsPath: path, storePath: join(dir, 'store.json'), reportDir: join(dir, 'reports'), createDrafts: false })
  assert.equal(report.csvLeadsAdded, 0)
  assert.ok(report.skipped.some(row => row.reason === 'Tool already queued or archived.'))
  assert.equal(readLeadRows(path).length, 0)
})
