import { explainQuantities } from './quantities'

// Untrusted content must not inject log records or echo common credential forms.
function redact(value: string) {
  return value.replace(/\b(?:gsk_|sk-|ghp_|github_pat_|sk_live_|sk_test_)[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b[\w-]*(?:key|token|password|secret|authorization)[\w-]*\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[REDACTED]')
    .replace(/https?:\/\/[^\s<>"']+/gi, value => { try { const url = new URL(value); return url.origin + url.pathname } catch { return '[REDACTED_URL]' } })
    .replace(/[\r\n\x00-\x1f\x7f]/g, ' ')
}
function clip(value: string, chars: number, words = 25) {
  return value.split(/\s+/).slice(0, words).join(' ').slice(0, chars)
}
export function numericDiagnostic(input: { factIndex: number; core: boolean; claim: string; sourceId: string; excerpt: string; excerpts?: string[]; citationIndices?: number[] }) {
  const passages = input.excerpts || [input.excerpt]
  const claim = redact(input.claim), excerpt = redact(input.excerpt), sourceId = redact(input.sourceId)
  const base = { evidenceScope: 'SAME_SOURCE_SAME_FACT', citationCount: passages.length, citationIndices: input.citationIndices?.slice(0, 8), factIndex: input.factIndex, core: input.core, claim: clip(claim, 200), citationSourceId: clip(sourceId, 40), citationExcerpt: clip(excerpt, 240), textClipped: clip(claim, 200) !== claim || clip(excerpt, 240) !== excerpt }
  // Avoid leaking credential digits through numeric token extraction as well.
  if (claim !== input.claim || excerpt !== input.excerpt || sourceId !== input.sourceId || passages.some(passage => redact(passage) !== passage)) return { ...base, numericDetails: 'SUPPRESSED_REDACTED_INPUT' }
  const details = explainQuantities(input.claim, passages)
  const token = (q: typeof details.claimTokens[number], index: number) => ({ index: index + 1, raw: clip(q.raw, 48), normalizedValue: clip(q.value, 48), unit: q.unit || 'unitless', currency: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(q.unit) ? q.unit : 'none', magnitude: q.magnitude, scale: q.scale, percentage: q.unit === 'percent', monetaryContext: q.monetary, invalidReason: q.invalidReason || 'none' })
  const first = details.failures[0]
  return { ...base, claimTokenCount: details.claimTokens.length, excerptTokenCount: details.excerptTokens.length,
    claimTokens: details.claimTokens.slice(0, 8).map(token), excerptTokens: details.excerptTokens.slice(0, 8).map(token),
    failedClaimToken: first ? token(first.token, first.index) : null,
    comparisons: first?.comparisons.slice(0, 8).map(c => ({ excerptTokenIndex: c.index + 1, reason: c.reason })) || [],
    failureReason: !details.excerptTokens.length ? 'NO_EXCERPT_NUMERIC_TOKENS' : first?.token.invalidReason || 'NO_EQUIVALENT_EXCERPT_TOKEN',
    diagnosticsClipped: details.claimTokens.length > 8 || details.excerptTokens.length > 8 || details.failures.length > 1,
    failedClaimTokenCount: details.failures.length }
}
