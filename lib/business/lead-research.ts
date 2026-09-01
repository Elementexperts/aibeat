export interface LeadResearchOutput {
  leadName: string; company: string; fitScore: number; confidence: number; reasons: string[]; evidence: string[]; likelyNeeds: string[]; risks: string[]; recommendedNextAction: string; suggestedOutreachAngle: string
}
const strings = ['leadName', 'company', 'recommendedNextAction', 'suggestedOutreachAngle'] as const
const arrays = ['reasons', 'evidence', 'likelyNeeds', 'risks'] as const
export function isLeadResearchOutput(value: unknown): value is LeadResearchOutput {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return strings.every((key) => typeof item[key] === 'string' && Boolean((item[key] as string).trim()))
    && arrays.every((key) => Array.isArray(item[key]) && (item[key] as unknown[]).every((entry) => typeof entry === 'string'))
    && typeof item.fitScore === 'number' && Number.isFinite(item.fitScore) && item.fitScore >= 0 && item.fitScore <= 100
    && typeof item.confidence === 'number' && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1
}
export function normalizeLeadUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) throw new Error('Prospect website is required.')
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try { url = new URL(candidate) } catch { throw new Error('Enter a valid prospect website URL.') }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error('Prospect website must use http or https.')
  url.hash = ''
  return url.toString()
}
export function validateWorkflowInput(inputs: Array<{ key: string; required: boolean }>, input: Record<string, unknown> = {}) {
  const normalized = { ...input }
  for (const definition of inputs) if (definition.required && (typeof input[definition.key] !== 'string' || !String(input[definition.key]).trim())) throw new Error(`${definition.key} is required.`)
  if ('leadUrl' in input || inputs.some((item) => item.key === 'leadUrl')) normalized.leadUrl = normalizeLeadUrl(input.leadUrl)
  return normalized
}
