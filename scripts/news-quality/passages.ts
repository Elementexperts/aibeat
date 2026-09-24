import { Rejection } from './types'

export type Passage = { id: string; text: string }
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export class PassageReferenceError extends Rejection {
  constructor(public field: string, public problem: string) { super('MALFORMED_MODEL_OUTPUT', 'INVALID_PASSAGE_REFERENCE') }
}

// Exact contiguous slices, bounded near 600 characters, without duplicating the
// source text in the request. Prefer sentence boundaries; never synthesize prose.
export function sourcePassages(sourceId: string, text: string): Passage[] {
  const passages: Passage[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + 600, text.length)
    if (end < text.length) {
      const window = text.slice(start, end)
      const sentence = Array.from(window.matchAll(/[.!?]\s+/g)).at(-1)
      const boundary = sentence && sentence.index! >= 200 ? sentence.index! + sentence[0].length : window.lastIndexOf(' ')
      if (boundary > 0) end = start + boundary
      if (text.length - end < 20) end = text.length
    }
    passages.push({ id: `${sourceId}:p${passages.length + 1}`, text: text.slice(start, end) })
    start = end
  }
  return passages
}
export function passageSources<T extends { id: string; text: string; publishedAt: string }>(sources: T[]) {
  return sources.map(({ text, ...source }) => ({ ...source, passages: sourcePassages(source.id, text) }))
}

// Convert provider references into the existing internal fact schema BEFORE its
// validation. Unrecognized IDs fail; model-supplied excerpt text is never used.
export function resolveFactPassages(value: unknown, input: unknown): unknown {
  if (!object(input) || !Array.isArray(input.sources) || !input.sources.some(s => object(s) && 'passages' in s)) return value
  if (!object(value)) return value
  const fail = (field: string, problem: string): never => { throw new PassageReferenceError(field, problem) }
  const source = (id: unknown, field: string) => {
    const matches = input.sources as unknown[]
    const found = matches.filter(s => object(s) && s.id === id)
    if (typeof id !== 'string' || found.length !== 1 || !object(found[0])) return fail(field, 'unknown_source_id')
    return found[0]
  }
  const passage = (s: Record<string, unknown>, id: unknown, field: string) => {
    if (typeof id !== 'string' || !Array.isArray(s.passages)) return fail(field, 'missing_passage_id')
    const found = s.passages.filter(p => object(p) && p.id === id)
    if (found.length !== 1 || !object(found[0]) || typeof found[0].text !== 'string') return fail(field, 'unknown_passage_id')
    return found[0].text
  }
  // Preserve the ordinary schema diagnostics for incomplete top-level objects.
  if (!Array.isArray(value.confirmedFacts) || !('eventSourceId' in value)) return value
  const eventSource = source(value.eventSourceId, 'eventSourceId')
  const eventDateEvidence = value.eventDatePassageId === 'publication_timestamp'
    ? eventSource.publishedAt
    : passage(eventSource, value.eventDatePassageId, 'eventDatePassageId')
  const confirmedFacts = value.confirmedFacts.map(fact => {
    if (!object(fact) || !Array.isArray(fact.supportedBy)) return fact
    return { ...fact, supportedBy: fact.supportedBy.map(citation => {
      if (!object(citation)) return fail('confirmedFacts.item.supportedBy.item', 'expected_object')
      const s = source(citation.sourceId, 'confirmedFacts.item.supportedBy.item.sourceId')
      return { sourceId: citation.sourceId, excerpt: passage(s, citation.passageId, 'confirmedFacts.item.supportedBy.item.passageId') }
    }) }
  })
  return { ...value, eventDateEvidence, confirmedFacts }
}
