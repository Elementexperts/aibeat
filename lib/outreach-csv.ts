import { makeLead, normalizeEmail } from './outreach-validation'
import type { OutreachLead } from './outreach-types'

export type CsvImportPreview = {
  rowsProcessed: number
  valid: number
  invalid: number
  duplicates: number
  blockedContactTypes: number
  leads: OutreachLead[]
  errors: Array<{ row: number; errors: string[] }>
  duplicateEmails: string[]
}

const HEADERS = ['first_name', 'founder_name', 'company_name', 'tool_name', 'email', 'website_url', 'product_hunt_url', 'launch_date', 'category', 'contact_type', 'public_contact_source_url', 'personalized_opening', 'priority', 'lawful_basis']

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

export function previewCsvImport(csv: string, existingEmails: string[] = []): CsvImportPreview {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim())
  const header = splitCsvLine(lines[0] || '').map((item) => item.trim())
  const missingHeaders = HEADERS.filter((item) => !header.includes(item))
  const seen = new Set(existingEmails.map(normalizeEmail))
  const leads: OutreachLead[] = []
  const errors: CsvImportPreview['errors'] = []
  const duplicateEmails: string[] = []
  let blockedContactTypes = 0

  if (missingHeaders.length > 0) {
    return { rowsProcessed: Math.max(0, lines.length - 1), valid: 0, invalid: Math.max(0, lines.length - 1), duplicates: 0, blockedContactTypes: 0, leads: [], errors: [{ row: 1, errors: [`Missing headers: ${missingHeaders.join(', ')}`] }], duplicateEmails: [] }
  }

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index])
    const row = Object.fromEntries(header.map((key, i) => [key, values[i] || '']))
    const email = normalizeEmail(String(row.email || ''))
    if (seen.has(email)) {
      duplicateEmails.push(email)
      continue
    }
    const result = makeLead({ ...row, source: 'Product Hunt', consent_status: 'unknown' })
    if (result.lead) {
      leads.push(result.lead)
      seen.add(email)
    } else {
      if (result.errors.some((error) => /Blocked/.test(error))) blockedContactTypes += 1
      errors.push({ row: index + 1, errors: result.errors })
    }
  }

  return { rowsProcessed: Math.max(0, lines.length - 1), valid: leads.length, invalid: errors.length, duplicates: duplicateEmails.length, blockedContactTypes, leads, errors, duplicateEmails }
}
