import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import { buildGenericMimeMessage, createGmailDraft, validateWeeklyReviewRecipient } from '../lib/gmail-newsletter-draft'
import { buildOutreachDraft } from '../lib/gmail-outreach-drafts'
import { buildWeeklyToolsNewsletter, PICTORY_PARTNER_HTML, selectWeeklyTools } from '../lib/weekly-tools-newsletter'
import type { Tool } from '../lib/data'

function tool(index: number): Tool {
  return { slug: `tool-${index}`, name: `Tool ${index}`, tagline: `Useful workflow ${index}`, description: '', category: 'AI Tools', logo: '#000', logoInitials: 'T', logoUrl: `https://example.com/${index}.png`, rating: 4, pricing: 'Free', pricingType: 'free', affiliateUrl: `https://tool${index}.example`, websiteUrl: `https://tool${index}.example`, featured: true, pros: [], cons: [], alternatives: [] }
}

test('weekly tools draft contains exactly eight current tools and preserves Pictory promotion verbatim', () => {
  const tools = Array.from({ length: 10 }, (_, index) => tool(index + 1))
  const newsletter = buildWeeklyToolsNewsletter({ tools, now: new Date('2026-09-04T16:00:00Z') })
  assert.deepEqual(newsletter.selectedTools.map((item) => item.slug), ['tool-1', 'tool-2', 'tool-3', 'tool-4', 'tool-5', 'tool-6', 'tool-7', 'tool-8'])
  assert.equal(newsletter.html.includes(PICTORY_PARTNER_HTML), true)
  assert.match(newsletter.html, /Cpiabd20/)
  assert.match(newsletter.html, /Affiliate disclosure/)
  assert.match(newsletter.key, /2026-W36/)
})

test('weekly tool slug override is explicit and rejects missing or incomplete selections', () => {
  const tools = Array.from({ length: 8 }, (_, index) => tool(index + 1))
  assert.deepEqual(selectWeeklyTools({ tools, slugs: tools.map((item) => item.slug) }).map((item) => item.slug), tools.map((item) => item.slug))
  assert.throws(() => selectWeeklyTools({ tools, slugs: ['missing', ...tools.slice(1).map((item) => item.slug)] }), /unknown tool slug/)
  assert.throws(() => selectWeeklyTools({ tools, slugs: tools.slice(0, 7).map((item) => item.slug) }), /exactly 8/)
})

test('weekly newsletter includes a visible unsubscribe route in both alternatives', () => {
  const newsletter = buildWeeklyToolsNewsletter()
  assert.match(newsletter.html, /href="https:\/\/www.aibeat.dev\/unsubscribe"[^>]*>Unsubscribe from AIBeat Weekly/)
  assert.match(newsletter.plainText, /Unsubscribe from AIBeat Weekly: https:\/\/www.aibeat.dev\/unsubscribe/)
  assert.doesNotMatch(newsletter.subject, /Gift|^Fwd:|^Re:/)
})

test('MIME preserves Unicode bodies, folds encoded headers, and uses bounded lines and boundaries', () => {
  const body = 'Useful tools — 世界 🎵\n'.repeat(200)
  const raw = buildGenericMimeMessage({ to: 'review@example.com', subject: '世界 🎵 '.repeat(40), plainText: body, html: `<p>${body}</p>`, key: 'k'.repeat(180) }, { fromName: 'AIBeat, Weekly', fromEmail: 'hello@aibeat.dev' })
  assert.match(raw, /Date: .+ GMT\r\n/)
  assert.match(raw, /Message-ID: <[^>]+@aibeat.dev>/)
  assert.ok(raw.split('\r\n').every((line) => line.length <= 998))
  const boundary = raw.match(/boundary="([^"]+)"/)![1]
  assert.ok(boundary.length <= 70)
  const textPart = raw.split(`--${boundary}`)[1].split('\r\n\r\n')[1].trim()
  assert.ok(textPart.split('\r\n').every((line) => line.length <= 76))
  assert.equal(Buffer.from(textPart, 'base64').toString('utf8'), body)
  assert.doesNotMatch(raw, /List-Unsubscribe-Post:/)
})

test('weekly draft recipient must be one reviewer, with no header injection or lists', () => {
  validateWeeklyReviewRecipient('editor@example.com')
  for (const address of ['a@example.com,b@example.com', 'a@example.com\r\nBcc: b@example.com', 'Editor <a@example.com>', 'a@example.com.']) {
    assert.throws(() => validateWeeklyReviewRecipient(address), /one bare review email/)
  }
})

test('outreach draft uses approved spreadsheet facts, qualified metrics, and no guarantees', () => {
  const imported = parseDailyManualLeads('website,email,source,tool_name,category,personalized_opening\nexample.ai,hello@example.ai,Product Hunt,Example AI,Productivity,Saw your workflow launch on Product Hunt.', new Date('2026-09-07T16:00:00Z'))
  const draft = buildOutreachDraft(imported.leads[0], new Date('2026-09-07T16:00:00Z'))
  assert.equal(draft.to, 'hello@example.ai')
  assert.match(draft.plainText, /around 100,000–150,000 impressions/)
  assert.match(draft.plainText, /around 1,000 email subscribers/)
  assert.match(draft.plainText, /around 10–15 tools each week/)
  assert.match(draft.plainText, /14 days/)
  assert.match(draft.plainText, /not guaranteed/)
  assert.match(draft.key, /^aibeat-outreach-spotlight-v1-/)
  assert.doesNotMatch(buildGenericMimeMessage(draft, { fromName: 'AIBeat', fromEmail: 'hello@aibeat.dev' }), /drafts\/send/)
})

test('suppressed contacts cannot produce outreach drafts', () => {
  const imported = parseDailyManualLeads('website,email,source,tool_name\nexample.ai,privacy@example.ai,Manual,Example AI')
  assert.throws(() => buildOutreachDraft(imported.leads[0]), /not approved/)
})

test('spreadsheet import rejects malformed addresses before any Gmail draft can be built', () => {
  const imported = parseDailyManualLeads('website,email,source,tool_name\nexample.ai,hello@example.ai.,Manual,Example AI\nexample.ai,�admin@example.ai,Manual,Example AI')
  assert.equal(imported.leads.length, 0)
  assert.deepEqual(imported.errors.map((item) => item.row), [2, 3])
})

test('daily Gmail outreach has no fixed draft cap and Monday schedule is retired', () => {
  const script = readFileSync('scripts/create-gmail-outreach-drafts.ts', 'utf8')
  const daily = readFileSync('.github/workflows/daily-lead-discovery.yml', 'utf8')
  const monday = readFileSync('.github/workflows/monday-gmail-outreach-drafts.yml', 'utf8')
  assert.match(script, /Number.POSITIVE_INFINITY/)
  assert.match(daily, /npm run outreach:gmail-drafts/)
  assert.doesNotMatch(monday, /schedule:|outreach:gmail-drafts/)
})

test('weekly selection includes newly prepended featured tools and excludes nonfeatured entries', () => {
  const tools = [tool(99), { ...tool(98), featured: false }, ...Array.from({ length: 9 }, (_, i) => tool(i + 1))]
  assert.deepEqual(selectWeeklyTools({ tools }).map((t) => t.slug), ['tool-99', 'tool-1', 'tool-2', 'tool-3', 'tool-4', 'tool-5', 'tool-6', 'tool-7'])
  assert.throws(() => selectWeeklyTools({ tools, slugs: Array(8).fill('tool-1') }), /duplicate/)
})

test('weekly tool images use absolute URLs and copy does not invent launch dates', () => {
  const tools = Array.from({ length: 8 }, (_, i) => ({ ...tool(i + 1), logoUrl: '/tool-logos/example.png' }))
  const newsletter = buildWeeklyToolsNewsletter({ tools })
  assert.match(newsletter.html, /src="https:\/\/www.aibeat.dev\/tool-logos\/example.png"/)
  assert.doesNotMatch(newsletter.html + newsletter.plainText, /last 10 days/)
})


test('rerunning this week updates the existing draft, including a legacy slug-suffixed key', async () => {
  for (const suffix of ['', '-old-tool-selection']) {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const key = 'aibeat-weekly-tools-2026-W37'
    const result = await createGmailDraft({
      message: { key, to: 'hello@aibeat.dev', subject: 'Updated tools', plainText: 'Astrea and Sistava', html: '<p>Astrea and Sistava</p>' },
      config: { clientId: 'client', clientSecret: 'secret', refreshToken: 'refresh', to: 'hello@aibeat.dev', fromEmail: 'hello@aibeat.dev' },
      updateExisting: true,
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init })
        if (String(url).includes('oauth2')) return Response.json({ access_token: 'token' })
        if (String(url).includes('/drafts?')) return String(url).includes('pageToken=next') ? Response.json({ drafts: [{ id: 'existing' }] }) : Response.json({ drafts: [], nextPageToken: 'next' })
        if (init?.method === 'PUT') return Response.json({ id: 'existing' })
        return Response.json({ message: { payload: { headers: [{ name: 'X-AIBeat-Newsletter-Key', value: key + suffix }] } } })
      },
    })
    assert.equal(result.created, false)
    assert.equal(result.duplicate, false)
    assert.equal(calls.at(-1)?.init?.method, 'PUT')
    assert.match(calls.at(-1)!.url, /drafts\/existing$/)
    assert.ok(calls.every(({ url }) => !url.includes('/send')))
    const mime = Buffer.from(JSON.parse(String(calls.at(-1)?.init?.body)).message.raw, 'base64url').toString()
    assert.match(mime, /Subject: =\?UTF-8/)
    assert.ok(mime.includes(Buffer.from('Astrea and Sistava').toString('base64')))
  }
})

test('outreach tailors benefits from reviewed CSV facts and links to submission in both formats', () => {
  const imported = parseDailyManualLeads('website,email,source,tool_name,category,personalized_opening,product_benefit\nexample.ai,hello@example.ai,Manual,Example & AI,Productivity,Your document workflow caught my eye.,Turn meeting notes into action items.')
  const draft = buildOutreachDraft(imported.leads[0])
  assert.match(draft.plainText, /Your document workflow caught my eye/)
  assert.match(draft.plainText, /Turn meeting notes into action items/)
  assert.match(draft.plainText, /readers exploring Productivity tools/)
  assert.match(draft.plainText, /Submit Example & AI here/)
  assert.match(draft.plainText, /https:\/\/www.aibeat.dev\/submit/)
  assert.match(draft.html, /href="https:\/\/www.aibeat.dev\/submit">Submit Example &amp; AI to AIBeat<\/a>/)
  const other = buildOutreachDraft({ ...imported.leads[0], tool_name: 'Dev Tool', category: 'Developer', product_benefit: undefined })
  assert.match(other.plainText, /readers exploring Developer tools/)
  assert.doesNotMatch(other.plainText, /Turn meeting notes into action items/)
  const minimal = buildOutreachDraft(parseDailyManualLeads('website,email,source\nminimal.ai,hello@minimal.ai,Manual').leads[0])
  assert.match(minimal.plainText, /readers looking for useful AI products/)
  assert.doesNotMatch(minimal.plainText, /undefined|null/)
})
