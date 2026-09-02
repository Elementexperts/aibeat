import type { OutreachLead } from './outreach-types'

export type OutreachDraft = { to: string; subject: string; plainText: string; html: string; key: string }

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function isoWeek(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function buildOutreachDraft(lead: OutreachLead, now = new Date()): OutreachDraft {
  if (!lead.approved_for_outreach || lead.status === 'suppressed') throw new Error(`Lead ${lead.email} is not approved for outreach.`)
  const name = lead.first_name?.trim() || lead.founder_name?.trim()?.split(/\s+/)[0] || 'there'
  const toolName = lead.tool_name.trim()
  const opening = lead.personalized_opening?.trim() || `I found ${toolName} through ${lead.source} and thought its ${lead.category || 'AI product'} positioning could be relevant to AIBeat readers.`
  const subject = `${toolName}: possible AIBeat Spotlight feature`
  const plainText = `Hi ${name},

${opening}

I’m Nomoz, founder of AIBeat. Across a typical month, our newsletter and tool-feature content receives around 100,000–150,000 impressions, and around 1,000 email subscribers receive our news and featured-tool updates. We also list around 10–15 tools each week.

For ${toolName}, the available visibility paths include a searchable directory listing, a featured category placement, or a deeper Spotlight Pro presentation. Spotlight Pro includes an enhanced product summary and CTA, a workflow or use-case section, up to three screenshots or one demo video, priority publication workflow, and 14 days of homepage or relevant-category Spotlight placement. Newsletter and editorial inclusion may also be considered, but are not guaranteed.

These are exposure opportunities rather than guaranteed traffic, clicks, sales, rankings, or newsletter coverage. Promotional placements are clearly labeled.

If this is relevant, I’d be happy to share the feature options and suggest the best fit for ${toolName}:
https://www.aibeat.dev/submit

Best regards,

Nomoz Fayzullaev
Founder, AIBeat
https://www.aibeat.dev
hello@aibeat.dev`
  const paragraphs = plainText.split('\n\n').map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:640px">${paragraphs}</div>`
  const emailKey = Buffer.from(lead.email.toLowerCase()).toString('base64url').slice(0, 32)
  return { to: lead.email, subject, plainText, html, key: `aibeat-gmail-outreach-${isoWeek(now)}-${emailKey}` }
}
