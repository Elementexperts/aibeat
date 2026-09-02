import { isValidEmail, normalizeEmail } from './outreach-validation'
import type { OutreachContactType, OutreachLead, OutreachPriority } from './outreach-types'

const LAWFUL_BASIS = 'Manually reviewed public business contact from the daily lead input file for relevant B2B founder outreach. Draft creation only; sending remains disabled.'
export const DAILY_MANUAL_SOURCE = 'Daily Manual Lead'
export const DAILY_MANUAL_CAMPAIGN_SUBJECT = 'Congrats on {{tool_name}} - possible AIBeat feature'
export const DAILY_MANUAL_CAMPAIGN_PREVIEW = 'A possible AIBeat feature for {{tool_name}}'
export const DAILY_MANUAL_CAMPAIGN_BODY = `Hi {{first_name}},

Congratulations on the recent visibility for {{tool_name}}.

{{personalized_opening}}

I am Nomoz, founder of AIBeat. We help people discover useful AI tools, emerging startups, and practical AI workflows through our directory, newsletter, and editorial coverage.

For {{tool_name}}, I think AIBeat could help with visibility in a few focused ways:

- a searchable AIBeat tool listing by category and use case
- a short newsletter mention for readers looking for new AI products
- an editorial article, founder story, or Spotlight feature if you want a deeper launch push
- a direct submission path here: https://www.aibeat.dev/submit

No pressure at all. If you are interested, I would be happy to share the feature options and suggest the best fit for {{tool_name}}.

Best regards,

Nomoz Fayzullaev
Founder, AIBeat
https://www.aibeat.dev
hello@aibeat.dev`

export const DAILY_MANUAL_FOLLOW_UP_1_SUBJECT = 'Following up on {{tool_name}} and AIBeat'
export const DAILY_MANUAL_FOLLOW_UP_1_BODY = `Hi {{first_name}},

Just following up on my note about {{tool_name}}.

Early product visibility often fades quickly after a launch or listing. AIBeat can help keep the product discoverable through a tool listing, newsletter mention, article, or Spotlight-style feature.

Would it be useful if I sent the available AIBeat feature options?

Best regards,

Nomoz
AIBeat
https://www.aibeat.dev`

export const DAILY_MANUAL_FOLLOW_UP_2_SUBJECT = 'One last note about featuring {{tool_name}}'
export const DAILY_MANUAL_FOLLOW_UP_2_BODY = `Hi {{first_name}},

One last quick note from me about {{tool_name}}.

If extra visibility would be useful, AIBeat may be able to help through directory discovery, newsletter exposure, or an editorial feature. If now is not the right time, no action is needed and I will not keep following up.

Wishing you continued momentum with the product.

Best regards,

Nomoz
AIBeat`

type ManualLeadRow = {
  website: string
  email: string
  source: string
  tool_name?: string
  category?: string
  personalized_opening?: string
}

export type DailyManualLeadImport = {
  rowsProcessed: number
  leads: OutreachLead[]
  errors: Array<{ row: number; errors: string[] }>
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

function csvRows(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim())
  const header = splitCsvLine(lines[0] || '').map((item) => item.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return Object.fromEntries(header.map((key, index) => [key, values[index] || '']))
  })
}

function idForEmail(email: string) {
  return `lead_${Buffer.from(email.toLowerCase()).toString('base64url').slice(0, 16)}`
}

function normalizeWebsite(value: string): string | undefined {
  const raw = value.trim()
  if (!raw) return undefined
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function domainFromWebsite(websiteUrl: string): string {
  return new URL(websiteUrl).hostname.replace(/^www\./, '')
}

function titleFromDomain(domain: string): string {
  const label = domain.split('.')[0] || domain
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

function inferContactType(email: string): OutreachContactType {
  const local = normalizeEmail(email).split('@')[0]
  if (['privacy', 'legal', 'security', 'abuse', 'dpo'].includes(local)) return local as OutreachContactType
  if (['no-reply', 'noreply'].includes(local)) return local as OutreachContactType
  if (['press', 'media', 'pr'].includes(local)) return 'press'
  if (['sales', 'demo'].includes(local)) return 'sales'
  if (['partners', 'partnerships', 'partner'].includes(local)) return 'partnerships'
  if (['support', 'help'].includes(local)) return 'support'
  return 'general_business'
}

function priorityForContact(contactType: OutreachContactType): OutreachPriority {
  if (contactType === 'press' || contactType === 'partnerships' || contactType === 'sales') return 'high'
  if (contactType === 'support') return 'medium'
  return 'medium'
}

function sourceUrl(rowSource: string, websiteUrl: string): string {
  const lower = rowSource.toLowerCase()
  if (lower.includes('beta')) return 'https://betalist.com'
  if (lower.includes('product hunt') || lower.includes('producthunt')) return 'https://www.producthunt.com'
  return websiteUrl
}

function openingFor(row: ManualLeadRow, toolName: string, rowSource: string) {
  if (row.personalized_opening?.trim()) return row.personalized_opening.trim()
  const sourceLabel = rowSource || DAILY_MANUAL_SOURCE
  return `I saw ${toolName} in the ${sourceLabel} lead list and wanted to congratulate you on the visibility there. AIBeat could help turn that launch attention into a more durable discovery path through a searchable listing, newsletter mention, article, or Spotlight feature.`
}

export function parseDailyManualLeads(csv: string, now = new Date()): DailyManualLeadImport {
  const rows = csvRows(csv)
  const leads: OutreachLead[] = []
  const errors: DailyManualLeadImport['errors'] = []
  const seen = new Set<string>()
  const timestamp = now.toISOString()

  rows.forEach((raw, index) => {
    const row = raw as ManualLeadRow
    const rowErrors: string[] = []
    const email = normalizeEmail(row.email || '')
    const websiteUrl = normalizeWebsite(row.website || '')

    if (!websiteUrl) rowErrors.push('website is required and must be a valid URL or domain.')
    if (!isValidEmail(email)) rowErrors.push('email is required and must be valid.')
    if (seen.has(email)) rowErrors.push('duplicate email in daily manual file.')

    if (rowErrors.length > 0 || !websiteUrl) {
      errors.push({ row: index + 2, errors: rowErrors })
      return
    }

    seen.add(email)
    const contactType = inferContactType(email)
    const blocked = ['privacy', 'legal', 'security', 'abuse', 'dpo', 'no-reply', 'noreply'].includes(contactType)
    const domain = domainFromWebsite(websiteUrl)
    const toolName = row.tool_name?.trim() || titleFromDomain(domain)
    const source = row.source?.trim() || DAILY_MANUAL_SOURCE

    leads.push({
      id: idForEmail(email),
      email,
      company_name: toolName,
      tool_name: toolName,
      website_url: websiteUrl,
      category: row.category?.trim() || 'AI startup',
      contact_type: contactType,
      source,
      public_contact_source_url: sourceUrl(source, websiteUrl),
      personalized_opening: openingFor(row, toolName, source),
      status: blocked ? 'suppressed' : 'approved',
      priority: priorityForContact(contactType),
      qualification_score: blocked ? 0 : 78,
      qualification_reasons: [
        'Manually supplied daily lead',
        `Website domain: ${domain}`,
        `Source: ${source}`,
      ],
      consent_status: blocked ? 'rejected' : 'legitimate_business_interest_reviewed',
      lawful_basis: LAWFUL_BASIS,
      approved_for_outreach: !blocked,
      approved_at: blocked ? undefined : timestamp,
      approved_by: blocked ? undefined : 'daily_manual_review',
      discovered_at: timestamp,
      contact_verified_at: timestamp,
      contact_validation_notes: blocked ? 'Blocked contact type; no draft will be created.' : 'Manual daily lead file contact.',
      suppressed_at: blocked ? timestamp : undefined,
      suppression_reason: blocked ? 'Blocked contact type is not appropriate for promotional outreach.' : undefined,
      notes: `Imported from ${source} via daily manual lead file.`,
      created_at: timestamp,
      updated_at: timestamp,
    })
  })

  return { rowsProcessed: rows.length, leads, errors }
}
