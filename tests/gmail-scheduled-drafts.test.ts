import assert from 'node:assert/strict'
import test from 'node:test'
import { parseDailyManualLeads } from '../lib/daily-manual-outreach-leads'
import { buildGenericMimeMessage } from '../lib/gmail-newsletter-draft'
import { buildOutreachDraft } from '../lib/gmail-outreach-drafts'
import { buildWeeklyToolsNewsletter, PICTORY_PARTNER_HTML, selectWeeklyTools } from '../lib/weekly-tools-newsletter'
import type { Tool } from '../lib/data'

function tool(index: number): Tool {
  return { slug: `tool-${index}`, name: `Tool ${index}`, tagline: `Useful workflow ${index}`, description: '', category: 'AI Tools', logo: '#000', logoInitials: 'T', logoUrl: `https://example.com/${index}.png`, rating: 4, pricing: 'Free', pricingType: 'free', affiliateUrl: `https://tool${index}.example`, websiteUrl: `https://tool${index}.example`, featured: false, pros: [], cons: [], alternatives: [] }
}

test('weekly tools draft contains exactly eight current tools and preserves Pictory promotion verbatim', () => {
  const tools = Array.from({ length: 10 }, (_, index) => tool(index + 1))
  const newsletter = buildWeeklyToolsNewsletter({ tools, now: new Date('2026-09-04T16:00:00Z') })
  assert.deepEqual(newsletter.selectedTools.map((item) => item.slug), ['tool-10', 'tool-9', 'tool-8', 'tool-7', 'tool-6', 'tool-5', 'tool-4', 'tool-3'])
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

test('outreach draft uses approved spreadsheet facts, qualified metrics, and no guarantees', () => {
  const imported = parseDailyManualLeads('website,email,source,tool_name,category,personalized_opening\nexample.ai,hello@example.ai,Product Hunt,Example AI,Productivity,Saw your workflow launch on Product Hunt.', new Date('2026-09-07T16:00:00Z'))
  const draft = buildOutreachDraft(imported.leads[0], new Date('2026-09-07T16:00:00Z'))
  assert.equal(draft.to, 'hello@example.ai')
  assert.match(draft.plainText, /around 100,000–150,000 impressions/)
  assert.match(draft.plainText, /around 1,000 email subscribers/)
  assert.match(draft.plainText, /around 10–15 tools each week/)
  assert.match(draft.plainText, /14 days/)
  assert.match(draft.plainText, /not guaranteed/)
  assert.match(draft.key, /2026-W37/)
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
