import { HIGH_RISK_RULES } from './config'
import type { Candidate, Fact, FactSheet, Review, Source } from './types'

export type HighRiskCategory = typeof HIGH_RISK_RULES[number]['category']
export type ClaimRisk = { factId: string; category: HighRiskCategory }
// Business-event reporting from a trusted staff article may publish with attribution.
// Legal, safety and enforcement claims still need a primary source plus independent reporting.
export const TRUSTED_ELIGIBLE_HIGH_RISK = new Set<HighRiskCategory>(['FUNDING', 'ACQUISITION', 'EMPLOYMENT_REDUCTION'])
export const SENSITIVE_HIGH_RISK = new Set<HighRiskCategory>(HIGH_RISK_RULES.map(rule => rule.category).filter(category => !TRUSTED_ELIGIBLE_HIGH_RISK.has(category)))
export function trustedEditorialHighRisk(trigger?: string) {
  return !!trigger && TRUSTED_ELIGIBLE_HIGH_RISK.has(trigger as HighRiskCategory)
}
export function sensitiveHighRisk(trigger?: string) {
  return !!trigger && SENSITIVE_HIGH_RISK.has(trigger as HighRiskCategory)
}
export const routineTechnology = /\b(launch\w*|releas\w*|updat\w*|announc\w*|introduc\w*|unveil\w*|feature\w*|available|availability|rollout|rolls? out|software|hardware|developer|api|model|editor|device|camera|stylus|redesign|smart glasses|product|surface|windows)\b/i
const medium = /\b(benchmark\w*|competitive|strateg\w*|partnership\w*|controvers\w*)\b/i

// Input is a headline or a specific factual claim, never a whole scraped page.
export function classifyRisk(claim: string) {
  const rule = HIGH_RISK_RULES.find(rule => rule.pattern.test(claim))
  if (rule) return { level: 'high' as const, trigger: rule.category }
  if (medium.test(claim)) return { level: 'medium' as const, trigger: 'BUSINESS_CLAIM_SCRUTINY' }
  if (routineTechnology.test(claim)) return { level: 'low' as const, trigger: 'ROUTINE_PRODUCT_ANNOUNCEMENT' }
  return { level: 'medium' as const, trigger: 'UNCERTAIN_CLASSIFICATION' }
}
export function storyRisk(candidate: Candidate, source?: Source) {
  const headline = classifyRisk(candidate.title)
  const original = source?.title ? classifyRisk(source.title) : undefined
  if (headline.level === 'high') return headline
  if (original?.level === 'high') return original
  if (headline.trigger === 'BUSINESS_CLAIM_SCRUTINY') return headline
  if (original?.trigger === 'BUSINESS_CLAIM_SCRUTINY') return original
  return headline.level === 'medium' && original?.level === 'low' ? original : headline
}
export function claimRisk(fact: Fact, facts: FactSheet, review?: Review) {
  const deterministic = classifyRisk(fact.claim)
  if (deterministic.level === 'high') return deterministic.trigger
  return facts.riskAssessments.find(r => r.factId === fact.id)?.category || review?.riskAssessments.find(r => r.factId === fact.id)?.category
}
export function centralRisk(candidate: Candidate, facts: FactSheet, review?: Review) {
  const headline = classifyRisk(candidate.title)
  if (headline.level === 'high') return headline.trigger
  return facts.confirmedFacts.filter(f => f.core).map(f => claimRisk(f, facts, review)).find(Boolean)
}
