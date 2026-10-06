import { createHash } from 'node:crypto'
import type { OutreachLead } from './outreach-types'

export type OutreachDraft = { to: string; subject: string; plainText: string; html: string; key: string }

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function buildOutreachDraft(lead: OutreachLead, now = new Date()): OutreachDraft {
  if (!lead.approved_for_outreach || lead.status === 'suppressed') throw new Error(`Lead ${lead.email} is not approved for outreach.`)
  const name = lead.first_name?.trim() || lead.founder_name?.trim()?.split(/\s+/)[0] || 'there'
  const toolName = lead.tool_name.trim()
  const opening = lead.personalized_opening?.trim() || `I found ${toolName} through ${lead.source} and thought its ${lead.category || 'AI product'} positioning could be relevant to AIBeat readers.`
  const category = lead.category?.trim()
  const audience = category && !['ai startup', 'ai product', 'ai tools'].includes(category.toLowerCase())
    ? `readers exploring ${category} tools`
    : 'readers looking for useful AI products'
  const productBenefit = lead.product_benefit?.trim()
  const benefitIntro = productBenefit
    ? `For ${toolName}, we could build the feature around this benefit: ${productBenefit}`
    : `For ${toolName}, we could build a feature that explains its core benefit and shows a practical use case to ${audience}.`
  const submitUrl = 'https://www.aibeat.dev/submit'
  const subject = `${toolName}: possible AIBeat Spotlight feature`
  const plainText = `Hi ${name},

${opening}

I’m Nomoz, founder of AIBeat. Across a typical month, our newsletter and tool-feature content receives around 100,000–150,000 impressions, and around 1,000 email subscribers receive our news and featured-tool updates. We also list around 10–15 tools each week.

${benefitIntro}

Here is how an AIBeat feature could help ${toolName}:
- Discovery: a searchable directory listing helps ${audience} find ${toolName} by category and use case.
- Product understanding: Spotlight Pro pairs an enhanced product summary with a workflow or use-case section and up to three screenshots or one demo video, helping readers understand ${toolName} before visiting your site.
- A clear next step: a product CTA gives interested readers a direct path to explore ${toolName} on your website.
- Visibility: featured category placement can put ${toolName} in front of relevant readers. Spotlight Pro includes priority publication workflow and 14 days of homepage or relevant-category Spotlight placement. Newsletter and editorial inclusion may also be considered, but are not guaranteed.

These are exposure opportunities rather than guaranteed traffic, clicks, sales, rankings, or newsletter coverage. Promotional placements are clearly labeled.

Submit ${toolName} here and share its main benefit, intended users, and a practical use case so we can suggest the right listing or feature option:
${submitUrl}

Best regards,

Nomoz Fayzullaev
Founder, AIBeat
https://www.aibeat.dev
hello@aibeat.dev`
  const paragraphs = plainText.split('\n\n').map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(paragraph).replace(submitUrl, `<a href="${submitUrl}">Submit ${escapeHtml(toolName)} to AIBeat</a>`).replace(/\n/g, '<br>')}</p>`).join('')
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:640px">${paragraphs}</div>`
  const emailKey = createHash('sha256').update(lead.email.trim().toLowerCase()).digest('hex')
  return { to: lead.email, subject, plainText, html, key: `aibeat-outreach-spotlight-v1-${emailKey}` }
}

// New discoveries are reviewed first; unfinished queue entries remain eligible.
// Undated manual rows preserve their existing relative order.
export function selectOutreachLeads(leads: OutreachLead[], limit: number): OutreachLead[] {
  const timestamp = (lead: OutreachLead) => lead.discovered_at && Number.isFinite(Date.parse(lead.discovered_at)) ? Date.parse(lead.discovered_at) : 0
  return leads.filter(lead => lead.approved_for_outreach && lead.status !== 'suppressed')
    .sort((a, b) => timestamp(b) - timestamp(a)).slice(0, limit)
}
