import { existsSync, readFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'
import { csvRows, splitCsvLine } from './daily-manual-outreach-leads'
import type { OutreachLead } from './outreach-types'

const columns = ['website', 'email', 'source', 'tool_name', 'category', 'personalized_opening', 'product_benefit', 'public_contact_source_url', 'discovered_at', 'contact_verified_at', 'discovery_run_id', 'outreach_drafted_at']
const cell = (value: string) => {
  const text = value.replace(/[\r\n]+/g, ' ').trim()
  return '"' + (/^[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"'
}
export function appendDailyLeadCsv(path: string, leads: OutreachLead[], draftedAt?: string): number {
  const original = existsSync(path) ? readFileSync(path, 'utf8').replace(/^\uFEFF/, '') : ''
  const lines = original.split(/\r?\n/).filter(line => line.trim())
  const existing = lines.length ? splitCsvLine(lines[0]).map(value => value.toLowerCase()) : columns
  if (!['website', 'email', 'source'].every(key => existing.includes(key))) throw new Error('Daily leads CSV is missing required columns')
  const headers = [...existing, ...columns.filter(key => !existing.includes(key))]
  const seen = new Set(csvRows(original).map(row => row.email?.trim().toLowerCase()))
  const additions: string[] = []
  for (const lead of leads) {
    if (seen.has(lead.email.toLowerCase()) || !lead.approved_for_outreach || !lead.website_url) continue
    seen.add(lead.email.toLowerCase())
    const row: Record<string, string | undefined> = { website: lead.website_url, email: lead.email, source: lead.source, tool_name: lead.tool_name, category: lead.category, personalized_opening: lead.personalized_opening, product_benefit: lead.product_benefit, public_contact_source_url: lead.public_contact_source_url, discovered_at: lead.discovered_at, contact_verified_at: lead.contact_verified_at, discovery_run_id: lead.discovery_run_id, outreach_drafted_at: draftedAt }
    additions.push(headers.map(key => cell(row[key] || '')).join(','))
  }
  if (!additions.length) return 0
  const output = [headers.join(','), ...lines.slice(1).map(line => line + ','.repeat(headers.length - existing.length)), ...additions].join('\n') + '\n'
  mkdirSync(dirname(path), { recursive: true })
  const temporary = path + '.tmp'
  writeFileSync(temporary, output)
  renameSync(temporary, path)
  return additions.length
}

export function leadHistoryPath(path: string) { return path.replace(/\.csv$/i, '') + '.history.csv' }
export function readLeadRows(path: string) { return existsSync(path) ? csvRows(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')) : [] }
export function toolIdentity(website: string | undefined): string {
  try { return new URL(website?.includes('://') ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, '') } catch { return '' }
}
// Archive first; a crash before queue replacement is recoverable from history.
// Call only after the entire selected Gmail batch succeeds (or deduplicates).
export function completeLeadBatch(path: string, completed: OutreachLead[], now = new Date()) {
  const historyPath = leadHistoryPath(path)
  appendDailyLeadCsv(historyPath, completed, now.toISOString())
  const archived = new Set(readLeadRows(historyPath).map(row => row.email.toLowerCase()))
  if (!existsSync(path)) return
  const original = readFileSync(path, 'utf8')
  const lines = original.trimEnd().split(/\r?\n/)
  const emailIndex = splitCsvLine(lines[0]).map(key => key.toLowerCase()).indexOf('email')
  if (emailIndex < 0) throw new Error('Queue email column missing')
  const remaining = lines.slice(1).filter(line => !archived.has((splitCsvLine(line)[emailIndex] || '').toLowerCase()))
  if (remaining.length === lines.length - 1) return
  writeFileSync(path + '.tmp', [lines[0], ...remaining].join('\n') + '\n')
  renameSync(path + '.tmp', path)
}
