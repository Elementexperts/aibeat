// Exact decimal arithmetic as strings: no floating-point rounding or currency conversion.
type Quantity = { value: string; unit: string; monetary: boolean }
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
  const pattern = /(?:(US\$|USD|EUR|GBP|CAD|AUD|[$€£])\s*)?([+-]?(?:\d(?:[\d,]*\d)?(?:\.\d+)?|\.\d+))(?:\s*(trillion|billion|million|thousand|bn|[kmb])\b)?(?:\s*(U\.S\. dollars|US dollars|Canadian dollars|Australian dollars|dollars?|euros?|pounds?|USD|EUR|GBP|CAD|AUD|percent\b|%))?/gi
  return Array.from(text.matchAll(pattern)).map(m => {
    const prefix = m[1]?.toLowerCase(), suffix = m[4]?.toLowerCase()
    const amount = prefix && text[(m.index || 0) - 1] === '-' && !/^[+-]/.test(m[2]) ? '-' + m[2] : m[2]
    const foreignSymbol = prefix === '$' && /[A-Za-z]/.test(text[(m.index || 0) - 1] || '')
    const first = foreignSymbol ? 'INVALID' : prefix ? currency[prefix] : ''
    const last = suffix ? currency[suffix] || 'percent' : ''
    const monetary = /\b(?:raised|raises|funding of|costs?|priced? at|price of|revenue of|valuation of|paid)\s*$/i.test(text.slice(0, m.index)) && /^(?:\s*$|[.,;]|\s+(?:in|for|from|during)\b)/i.test(text.slice((m.index || 0) + m[0].length))
    const ambiguousScale = /^[kmb]$/i.test(m[3] || '') && !first && !last && !monetary
    const scale = ({ trillion: 12, billion: 9, bn: 9, b: 9, million: 6, m: 6, thousand: 3, k: 3 } as Record<string, number>)[m[3]?.toLowerCase()] || 0
    return { value: ambiguousScale ? 'INVALID' : decimal(amount, scale), monetary, unit: first && last && first !== last ? 'INVALID' : first || last }
  })
}
export function quantitiesSupported(claim: string, evidence: string): boolean {
  const wanted = quantities(claim), supplied = quantities(evidence)
  // Only an explicitly monetary claim may omit a source's currency, never invent it.
  return wanted.every(q => q.value !== 'INVALID' && q.unit !== 'INVALID' && supplied.some(s => {
    if (s.value !== q.value || s.unit === 'INVALID') return false
    if (s.unit === q.unit) return true
    if (q.unit || !s.unit || s.unit === 'percent' || !q.monetary) return false
    const currencies = new Set(supplied.filter(n => n.value === q.value && n.unit && n.unit !== 'percent').map(n => n.unit))
    return currencies.size === 1
  }))
}
