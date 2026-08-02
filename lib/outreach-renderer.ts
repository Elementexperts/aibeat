import type { OutreachLead } from './outreach-types'

const ALLOWED_FIELDS = [
  'first_name',
  'founder_name',
  'company_name',
  'tool_name',
  'website_url',
  'product_hunt_url',
  'launch_date',
  'category',
  'personalized_opening',
] as const

type MergeField = typeof ALLOWED_FIELDS[number]

const FALLBACK_OPENING = 'Congratulations on launching {{tool_name}} on Product Hunt. I came across the launch and thought it could be relevant to AIBeat\'s audience.'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function textValue(lead: OutreachLead, field: MergeField): string {
  if (field === 'personalized_opening') {
    return lead.personalized_opening || renderTextTemplate(FALLBACK_OPENING, lead).text
  }
  return String(lead[field] || '')
}

function variables(template: string): string[] {
  return Array.from(template.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)).map((match) => match[1])
}

export function renderTextTemplate(template: string, lead: OutreachLead): { text: string; missing: string[]; unknown: string[] } {
  const missing = new Set<string>()
  const unknown = new Set<string>()
  let text = template

  for (const key of variables(template)) {
    if (!(ALLOWED_FIELDS as readonly string[]).includes(key)) {
      unknown.add(key)
      continue
    }
    const value = textValue(lead, key as MergeField)
    if (!value && key !== 'first_name') missing.add(key)
    text = text.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
  }

  text = text.replace(/^Hi\s*,/m, `Hi ${lead.tool_name} team,`)
  return { text, missing: Array.from(missing), unknown: Array.from(unknown) }
}

export function renderHtmlTemplate(template: string, lead: OutreachLead): { html: string; text: string; missing: string[]; unknown: string[] } {
  const rendered = renderTextTemplate(template, lead)
  const html = rendered.text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
  return { html, text: rendered.text, missing: rendered.missing, unknown: rendered.unknown }
}
