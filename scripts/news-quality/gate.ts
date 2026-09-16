import { HIGH_RISK_RULES, QUALITY, TRUSTED_EDITORIAL_SOURCE_POINTS } from './config'
import { Rejection, type FactSheet, type Source, type Draft, type Review, type HistoricalStory, type NewsEvent, type Candidate } from './types'

import { trustedEditorial } from './trust'
import { centralRisk, claimRisk } from './risk'

export const normalize = (text: string) => text.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const list = (value: unknown): value is string[] => Array.isArray(value) && value.every(text)
const score = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
export function requireValid(condition: unknown): asserts condition { if (!condition) throw new Rejection('MALFORMED_MODEL_OUTPUT') }
export function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return NaN
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed) || new Date(value.slice(0, 10)).toISOString().slice(0, 10) !== value.slice(0, 10)) return NaN
  return parsed
}
export function checkFresh(value: string, now: Date, context = 'DATE') {
  const parsed = date(value)
  if (!Number.isFinite(parsed)) throw new Rejection('INVALID_DATE', `${context}_UNPARSABLE`)
  if (parsed > now.getTime()) throw new Rejection('INVALID_DATE', `${context}_IN_FUTURE`)
  if (now.getTime() - parsed > QUALITY.freshnessHours * 3600000) throw new Rejection('STALE_STORY', `${context}_OUTSIDE_48H`)
}
export function parseFacts(input: unknown): FactSheet {
  const v = input as FactSheet
  requireValid(v && text(v.story) && v.event && list(v.event.entities) && v.event.entities.length > 0 && text(v.event.action) && typeof v.event.product === 'string' && text(v.event.eventDate))
  requireValid(text(v.eventSourceId) && text(v.eventDateEvidence) && ['low', 'medium', 'high'].includes(v.riskLevel) && score(v.confidence))
  requireValid(list(v.uncertainClaims) && list(v.conflictingClaims) && Array.isArray(v.confirmedFacts) && v.confirmedFacts.length > 0 && v.confirmedFacts.length <= QUALITY.maxFacts)
  for (const f of v.confirmedFacts) requireValid(f && text(f.id) && text(f.claim) && typeof f.core === 'boolean' && score(f.confidence) && Array.isArray(f.supportedBy) && f.supportedBy.length > 0 && f.supportedBy.every(s => text(s.sourceId) && text(s.excerpt) && s.excerpt.length >= 20))
  requireValid(new Set(v.confirmedFacts.map(f => f.id)).size === v.confirmedFacts.length && v.confirmedFacts.some(f => f.core))
  validateRisk(v, v.confirmedFacts)
  return v
}
export function parseDraft(input: unknown): Draft {
  const v = input as Draft
  requireValid(v && text(v.title) && v.title.length <= 120 && text(v.deck) && v.deck.length <= 600 && Array.isArray(v.sections) && v.sections.length > 0 && v.sections.length <= 6)
  for (const section of v.sections) {
    requireValid(text(section.heading) && ['facts', 'analysis'].includes(section.kind) && Array.isArray(section.paragraphs) && section.paragraphs.length > 0 && section.paragraphs.length <= 6)
    for (const p of section.paragraphs) requireValid(text(p.text) && p.text.length <= 1500 && list(p.factIds) && p.factIds.length > 0)
  }
  requireValid(v.sections.some(s => s.kind === 'facts'))
  return v
}
export function parseReview(input: unknown): Review {
  const v = input as Review
  requireValid(v && list(v.supportedFactIds) && list(v.unsupportedClaims) && list(v.conflictingClaims) && list(v.unverifiedEntities) && list(v.authoritativePrimaryIds) && list(v.trustedEditorialSourceIds) && Array.isArray(v.derivativeGroups) && v.derivativeGroups.every(list))
  requireValid(['eventDateVerified', 'independentReporting', 'analysisGrounded', 'originalValue', 'clearWriting'].every(k => typeof v[k as keyof Review] === 'boolean') && ['low', 'medium', 'high'].includes(v.riskLevel))
  validateRisk(v)
  return v
}
function validateRisk(v: FactSheet | Review, facts?: FactSheet['confirmedFacts']) {
  requireValid(Array.isArray(v.riskAssessments) && v.riskAssessments.every(r => r && text(r.factId) && HIGH_RISK_RULES.some(rule => rule.category === r.category)))
  if (v.riskLevel === 'high') requireValid(v.riskAssessments.length > 0)
  if (facts) {
    requireValid(v.riskAssessments.every(r => facts.some(f => f.id === r.factId)))
    if (v.riskLevel === 'high') requireValid(v.riskAssessments.some(r => facts.some(f => f.id === r.factId && f.core)))
  }
}
export function numbers(value: string) {
  return (value.match(/(?:[$€£]\s*)?\b\d+(?:[.,]\d+)*(?:\s*(?:million|billion|trillion|percent|%|thousand))?/gi) || []).map(n => normalize(n).replace(/,/g, '').replace(/\s+/g, ''))
}
export function numbersSupported(value: string, evidence: string) {
  const supported = new Set(numbers(evidence))
  return numbers(value).every(n => supported.has(n))
}
export function checkQuotes(value: string) {
  // v1 deliberately publishes paraphrases only: no reconstructed or model-authored direct quotes.
  if (/["“”«»]|‘[^’]+’|(?:^|\s)'[^']{4,}'/.test(value)) throw new Rejection('UNVERIFIED_QUOTE')
}
export function highRisk(candidate: Candidate, facts: FactSheet) {
  return !!centralRisk(candidate, facts)
}
export function sourcePolicy(sources: Source[], high: boolean, trustedId?: string) {
  const primary = sources.filter(s => s.tier === 1)
  const reputable = sources.filter(s => s.tier === 2)
  if (high && !primary.length) throw new Rejection('NO_PRIMARY_SOURCE')
  if (high && !primary.some(p => reputable.some(r => r.group !== p.group))) throw new Rejection('UNVERIFIED_HIGH_RISK_CLAIM')
  if (!high && !sources.some(s => s.id === trustedId && trustedEditorial(s)) && !primary.length && new Set(reputable.map(s => s.group)).size < 2) throw new Rejection('INSUFFICIENT_EVIDENCE')
}
export function checkFacts(candidate: Candidate, facts: FactSheet, sources: Source[], now: Date, trustedId?: string, forceHighRisk = false) {
  checkFresh(candidate.publishedAt, now, 'RSS_PUBLICATION_DATE')
  checkFresh(facts.event.eventDate, now, 'EVENT_DATE')
  if (facts.conflictingClaims.length) throw new Rejection('CONFLICTING_SOURCES')
  if (facts.confidence < QUALITY.minStoryConfidence) throw new Rejection('INSUFFICIENT_EVIDENCE')
  const eventSource = sources.find(s => s.id === facts.eventSourceId)
  if (!eventSource || !normalize(eventSource.text + ' ' + eventSource.publishedAt).includes(normalize(facts.eventDateEvidence))) throw new Rejection('INVALID_DATE', 'EVENT_DATE_EVIDENCE_NOT_FOUND')
  const high = forceHighRisk || highRisk(candidate, facts)
  for (const fact of facts.confirmedFacts) {
    if (fact.confidence < QUALITY.minFactConfidence) throw new Rejection('INSUFFICIENT_EVIDENCE')
    const support = fact.supportedBy.map(citation => {
      const source = sources.find(s => s.id === citation.sourceId)
      if (!source || !normalize(source.text).includes(normalize(citation.excerpt))) throw new Rejection('UNSUPPORTED_CLAIM')
      if (!numbersSupported(fact.claim, citation.excerpt)) throw new Rejection('UNSUPPORTED_CLAIM')
      return source
    })
    // Every fact, not just the headline, needs qualifying support.
    try { sourcePolicy(support, high || !!claimRisk(fact, facts), trustedId) } catch (error) {
      if (!high && claimRisk(fact, facts) && error instanceof Rejection) error.detail = `CLAIM_ONLY:${claimRisk(fact, facts)}`
      throw error
    }
    for (const source of support) if (!Number.isFinite(date(source.publishedAt)) || date(source.publishedAt) > now.getTime()) throw new Rejection('INVALID_DATE', `SOURCE_PUBLICATION_DATE_INVALID:${source.id}`)
    if (fact.core && !support.some(source => now.getTime() - date(source.publishedAt) <= QUALITY.freshnessHours * 3600000)) throw new Rejection('STALE_STORY')
  }
  const evidence = normalize(facts.confirmedFacts.flatMap(f => f.supportedBy.map(s => s.excerpt)).join(' '))
  if (!facts.event.entities.every(entity => evidence.includes(normalize(entity))) || (facts.event.product && !evidence.includes(normalize(facts.event.product)))) throw new Rejection('UNVERIFIED_ENTITY')
}
export function cleanDraft(draft: Draft, facts: FactSheet) {
  const allClaims = facts.confirmedFacts.map(f => f.claim).join(' ')
  checkQuotes(draft.title + ' ' + draft.deck)
  if (!numbersSupported(draft.title + ' ' + draft.deck, allClaims)) throw new Rejection('UNSUPPORTED_CLAIM')
  if (/shocks? the industry|changes? AI forever|destroys? competitors|revolutionary breakthrough/i.test(draft.title)) throw new Rejection('LOW_INFORMATION_VALUE')
  let removedParagraphs = 0
  const sections = draft.sections.map(section => {
    checkQuotes(section.heading)
    if (!numbersSupported(section.heading, allClaims)) throw new Rejection('UNSUPPORTED_CLAIM')
    return { ...section, paragraphs: section.paragraphs.filter(p => {
      checkQuotes(p.text)
      const referenced = facts.confirmedFacts.filter(f => p.factIds.includes(f.id))
      if (referenced.length !== new Set(p.factIds).size) throw new Rejection('UNSUPPORTED_CLAIM')
      if (!numbersSupported(p.text, referenced.map(f => f.claim).join(' '))) { removedParagraphs++; return false }
      return true
    }) }
  }).filter(s => s.paragraphs.length)
  const covered = new Set(sections.filter(s => s.kind === 'facts').flatMap(s => s.paragraphs.flatMap(p => p.factIds)))
  if (!sections.length || facts.confirmedFacts.some(f => f.core && !covered.has(f.id))) throw new Rejection('LOW_INFORMATION_VALUE')
  return { draft: { ...draft, sections }, removedParagraphs }
}
export function publicationScore(facts: FactSheet, sources: Source[], review: Review, candidate: Candidate, trustedId?: string, forceHighRisk = false) {
  validateRisk(review, facts.confirmedFacts)
  if (review.conflictingClaims.length) throw new Rejection('CONFLICTING_SOURCES')
  if (review.unverifiedEntities.length) throw new Rejection('UNVERIFIED_ENTITY')
  if (!review.eventDateVerified) throw new Rejection('INVALID_DATE', 'REVIEW_EVENT_DATE_NOT_VERIFIED')
  if (review.unsupportedClaims.length || facts.confirmedFacts.some(f => !review.supportedFactIds.includes(f.id))) throw new Rejection('UNSUPPORTED_CLAIM')
  if (!review.analysisGrounded || !review.originalValue || !review.clearWriting) throw new Rejection('LOW_INFORMATION_VALUE')
  const adjusted = sources.map(s => ({ ...s }))
  // A reviewer may collapse independence or reject authority, never create it.
  for (const group of review.derivativeGroups) {
    const existing = new Set(adjusted.filter(s => group.includes(s.id)).map(s => s.group))
    const merged = Array.from(existing).sort().join('|')
    for (const source of adjusted) if (existing.has(source.group)) source.group = merged
  }
  for (const source of adjusted) if (source.tier === 1 && !review.authoritativePrimaryIds.includes(source.id)) source.tier = 3
  const high = forceHighRisk || !!centralRisk(candidate, facts, review)
  const single = !high && review.trustedEditorialSourceIds.includes(trustedId || '') && !review.derivativeGroups.some(g => g.includes(trustedId || '')) && adjusted.some(s => s.id === trustedId && trustedEditorial(s))
  for (const fact of facts.confirmedFacts) {
    const consequential = high || !!claimRisk(fact, facts, review)
    try {
      sourcePolicy(adjusted.filter(s => fact.supportedBy.some(c => c.sourceId === s.id)), consequential, single ? trustedId : undefined)
      if (consequential && !review.independentReporting) throw new Rejection('UNVERIFIED_HIGH_RISK_CLAIM')
    } catch (error) {
      if (!high && error instanceof Rejection) error.detail = `CLAIM_ONLY:${claimRisk(fact, facts, review)}`
      throw error
    }
  }
  const primary = adjusted.some(s => s.tier === 1)
  if (!primary && !single && !review.independentReporting) throw new Rejection('INSUFFICIENT_EVIDENCE')
  if (high && !review.independentReporting) throw new Rejection('UNVERIFIED_HIGH_RISK_CLAIM')
  const score = (primary ? 25 : single ? TRUSTED_EDITORIAL_SOURCE_POINTS : 20) + 25 + (review.independentReporting ? 15 : 5) + 15 + 10 + 10
  if (score < QUALITY.publishThreshold) throw new Rejection('LOW_INFORMATION_VALUE')
  return score
}
const stopwords = new Set('the a an its new for to of and in with on at is has their ai model company'.split(' '))
export function eventTokens(value: string) {
  return new Set(normalize(value).replace(/\b(unveils?|launch(?:es|ed)?|releases?|introduc(?:es|ed)|announc(?:es|ed))\b/g, ' launch ').replace(/[^a-z0-9.-]+/g, ' ').split(' ').filter(w => w && !stopwords.has(w)))
}
function overlap(a: Set<string>, b: Set<string>) { return Array.from(a).filter(w => b.has(w)).length / Math.max(1, Math.min(a.size, b.size)) }
export function duplicateEvent(event: NewsEvent, title: string, history: HistoricalStory[]) {
  return history.find(old => {
    const oldDate = date(old.newsEvent?.eventDate || old.publishedAt)
    if (!Number.isFinite(oldDate) || Math.abs(date(event.eventDate) - oldDate) > QUALITY.duplicateDays * 86400000) return false
    if (old.newsEvent) {
      const sameEntity = event.entities.some(e => old.newsEvent!.entities.some(o => normalize(e) === normalize(o)))
      return sameEntity && normalize(event.product) === normalize(old.newsEvent.product) && overlap(eventTokens(event.action), eventTokens(old.newsEvent.action)) === 1
    }
    const a = eventTokens(title), b = eventTokens(old.title)
    const sameEntity = event.entities.some(e => normalize(old.title + ' ' + (old.deck || '')).includes(normalize(e)))
    const sameProduct = !event.product || normalize(old.title + ' ' + (old.deck || '')).includes(normalize(event.product))
    return sameEntity && sameProduct && a.size >= 2 && b.size >= 2 && overlap(a, b) >= 0.65
  })
}
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/{/g, '&#123;').replace(/}/g, '&#125;')
export function renderDraft(draft: Draft) {
  return draft.sections.map(s => `<h2>${escape(s.kind === 'analysis' ? 'AIBeat analysis' : s.heading)}</h2>\n${s.paragraphs.map(p => `<p>${escape(p.text)}</p>`).join('\n')}`).join('\n\n')
}
export function renderApproved(approved: import('./types').Approved) {
  const source = approved.sources[0]
  const attribution = approved.evidenceMode === 'TRUSTED_SINGLE_SOURCE' && source
    ? `<p>Based on reporting by <a href="${escape(source.url)}">${escape(source.name)}</a>.</p>\n\n` : ''
  return attribution + renderDraft(approved.draft)
}
