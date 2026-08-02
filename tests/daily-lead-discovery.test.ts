import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
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
  })

  assert.equal(report.candidatesFound, 1)
  assert.equal(report.qualifiedLeads, 1)
  assert.equal(report.leadsStored, 0)
  assert.equal(report.draftsCreated.length, 0)
  assert.equal(report.candidateInspections[0].contactLinksFound.includes('https://usefulai.dev/contact-sales'), true)
  assert.deepEqual(report.candidateInspections[0].validatedEmails, ['press@usefulai.dev'])
  assert.equal(existsSync(join(reportDir, '2026-08-02.json')), true)
  assert.equal(existsSync(join(dir, 'store.json')), false)
})
