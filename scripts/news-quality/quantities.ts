// Exact decimal arithmetic as strings: no floating-point rounding or currency conversion.
type Quantity = { value: string; unit: string; monetary: boolean; raw: string; magnitude: string; scale: number; invalidReason: string }
const currency: Record<string, string> = {
  '$': 'USD', 'us$': 'USD', usd: 'USD', dollar: 'USD', dollars: 'USD', 'us dollars': 'USD', 'u.s. dollars': 'USD',
  '€': 'EUR', eur: 'EUR', euro: 'EUR', euros: 'EUR', '£': 'GBP', gbp: 'GBP', pound: 'GBP', pounds: 'GBP',
  'canadian dollars': 'CAD', cad: 'CAD', 'australian dollars': 'AUD', aud: 'AUD',
}
function decimal(value: string, scale: number): string {
  const negative = value.startsWith('-'); value = value.replace(/^[+-]/, '').replace(/^\./, '0.')
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value)) return 'INVALID'
  const [whole, fraction = ''] = value.replace(/,/g, '').split('.')
  const digits = whole + fraction + '0'.repeat(Math.max(0, scale - fraction.length))
  const point = whole.length + scale
  const integer = digits.slice(0, point).replace(/^0+(?=\d)/, '') || '0'
  const tail = digits.slice(point).replace(/0+$/, '')
  return (negative && (integer !== '0' || tail) ? '-' : '') + integer + (tail ? '.' + tail : '')
}
function quantities(text: string): Quantity[] {
  text = text.normalize('NFKC').replace(/−/g, '-')
  // A hyphen in an explicit calendar range separates positive day numbers.
  // Do not rewrite minus signs in prices, measurements or standalone numbers.
  text = text.replace(/\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)(\d{1,2})\s*[-‐‑‒–]\s*(\d{1,2})(?!\d)/gi,
    (range, month: string, first: string, last: string) => Number(first) >= 1 && Number(first) <= Number(last) && Number(last) <= 31 ? `${month}${first} to ${last}` : range)
  const pattern = /(?:(US\$|USD|EUR|GBP|CAD|AUD|[$€£])\s*)?([+-]?(?:\d(?:[\d,]*\d)?(?:\.\d+)?|\.\d+))(?:\s*(trillion|billion|million|thousand|bn|[kmb])\b)?(?:\s*(U\.S\. dollars|US dollars|Canadian dollars|Australian dollars|dollars?|euros?|pounds?|USD|EUR|GBP|CAD|AUD|percent\b|%))?/gi
  return Array.from(text.matchAll(pattern)).map(m => {
    const prefix = m[1]?.toLowerCase(), suffix = m[4]?.toLowerCase()
    const amount = prefix && text[(m.index || 0) - 1] === '-' && !/^[+-]/.test(m[2]) ? '-' + m[2] : m[2]
    const foreignSymbol = prefix === '$' && /[A-Za-z]/.test(text[(m.index || 0) - 1] || '')
    const first = foreignSymbol ? 'INVALID' : prefix ? currency[prefix] : ''
    const last = suffix ? currency[suffix] || 'percent' : ''
    const monetary = /\b(?:raised|raises|funding of|costs?|priced? at|price of|revenue of|valuation of|paid)\s*$/i.test(text.slice(0, m.index)) && /^(?:\s*$|[.,;]|\s+(?:in|for|from|during)\b)/i.test(text.slice((m.index || 0) + m[0].length))
    // Product/display resolution is not a financial magnitude. Require nearby
    // hardware wording and the same explicit resolution unit in the evidence.
    const resolution = !first && !last && !monetary && /^(?:2|4|8|16)$/.test(amount)
      && m[3]?.toLowerCase() === 'k' && /^\d+k$/i.test(m[0])
      && (/(?:tv|television|display|monitor|screen|video|resolution)\s*$/i.test(text.slice(0, m.index))
        || /^\s*(?:tv|television|display|monitor|screen|video|resolution)\b/i.test(text.slice((m.index || 0) + m[0].length)))
    const ambiguousScale = /^[kmb]$/i.test(m[3] || '') && !first && !last && !monetary && !resolution
    const scale = resolution ? 0 : ({ trillion: 12, billion: 9, bn: 9, b: 9, million: 6, m: 6, thousand: 3, k: 3 } as Record<string, number>)[m[3]?.toLowerCase()] || 0
    return { raw: m[0], magnitude: resolution ? 'resolution' : m[3]?.toLowerCase() || 'none', scale, invalidReason: ambiguousScale ? 'AMBIGUOUS_MAGNITUDE' : decimal(amount, scale) === 'INVALID' ? 'INVALID_DECIMAL' : '', value: ambiguousScale ? 'INVALID' : decimal(amount, scale), monetary, unit: resolution ? 'resolution_k' : first && last && first !== last ? 'INVALID' : first || last }
  })
}
// Parse passages separately: excerpt boundaries must never synthesize a unit or magnitude.
function evidenceQuantities(evidence: string | readonly string[]) {
  return typeof evidence === 'string' ? quantities(evidence) : evidence.flatMap(quantities)
}
export function quantitiesSupported(claim: string, evidence: string | readonly string[]): boolean {
  const wanted = quantities(claim), supplied = evidenceQuantities(evidence)
  // Only an explicitly monetary claim may omit a source's currency, never invent it.
  return wanted.every(q => q.value !== 'INVALID' && q.unit !== 'INVALID' && supplied.some(s => {
    if (s.value !== q.value || s.unit === 'INVALID') return false
    if (s.unit === q.unit) return true
    if (q.unit || !s.unit || s.unit === 'percent' || !q.monetary) return false
    const currencies = new Set(supplied.filter(n => n.value === q.value && n.unit && n.unit !== 'percent').map(n => n.unit))
    return currencies.size === 1
  }))
}

// Observer only. quantitiesSupported above remains the acceptance decision.
export function explainQuantities(claim: string, evidence: string | readonly string[]) {
  const claimTokens = quantities(claim), excerptTokens = evidenceQuantities(evidence)
  const reason = (q: Quantity, s: Quantity) => {
    if (q.value === 'INVALID') return q.invalidReason || 'CLAIM_VALUE_INVALID'
    if (q.unit === 'INVALID') return 'CLAIM_UNIT_INVALID'
    if (s.value !== q.value) return s.value === 'INVALID' ? s.invalidReason || 'EXCERPT_VALUE_INVALID' : 'VALUE_MISMATCH'
    if (s.unit === 'INVALID') return 'EXCERPT_UNIT_INVALID'
    if (s.unit === q.unit) return 'EQUIVALENT'
    if (q.unit) return 'UNIT_OR_CURRENCY_MISMATCH'
    if (!s.unit) return 'EXCERPT_UNIT_MISSING'
    if (s.unit === 'percent') return 'PERCENTAGE_CONTEXT_MISMATCH'
    if (!q.monetary) return 'MONETARY_CONTEXT_NOT_ESTABLISHED'
    const currencies = new Set(excerptTokens.filter(n => n.value === q.value && n.unit && n.unit !== 'percent').map(n => n.unit))
    return currencies.size === 1 ? 'EQUIVALENT_SOURCE_CURRENCY' : 'AMBIGUOUS_SOURCE_CURRENCY'
  }
  const failures = claimTokens.map((q, index) => ({ index, token: q }))
    .filter(f => !excerptTokens.some(s => reason(f.token, s).startsWith('EQUIVALENT')))
    .map(f => ({ ...f, comparisons: excerptTokens.slice(0, 8).map((s, index) => ({ index, reason: reason(f.token, s) })) }))
  return { claimTokens, excerptTokens, failures }
}
