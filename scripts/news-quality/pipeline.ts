import { originalEditorial, ordinaryTrustedCandidate } from './trust'
import { storyRisk, centralRisk, claimRisk } from './risk'
import { failureDetail, safeLabel } from './diagnostics'
import { checkFresh, checkFacts, cleanDraft, duplicateEvent, highRisk, parseFacts, parseDraft, parseReview, publicationScore, sourcePolicy } from './gate'
import { Rejection, type Approved, type Candidate, type HistoricalStory, type Model, type Source } from './types'

export async function evaluateCandidate(candidate: Candidate, sources: Source[], history: HistoricalStory[], model: Model, now = new Date(), forceHighRisk = false, log: (message: string) => void = () => {}): Promise<Approved> {
  checkFresh(candidate.publishedAt, now)
  const original = originalEditorial(candidate, sources)
  const retrievedOriginal = sources.find(s => s.url === candidate.url || s.requestedUrl === candidate.url)
  const initialRisk = storyRisk(candidate, retrievedOriginal)
  const initialHigh = forceHighRisk || initialRisk.level === 'high'
  const trustedId = !initialHigh && original && ordinaryTrustedCandidate(candidate, original) ? original.id : undefined
  if (trustedId) checkFresh(original!.publishedAt, now, 'ORIGINAL_PUBLICATION_DATE')
  sourcePolicy(sources, initialHigh, trustedId)
  const evidenceMode = trustedId ? 'TRUSTED_SINGLE_SOURCE' : 'ENHANCED_VERIFICATION'
  const evidence = sources.map(({ links, imageUrl, ...source }) => source)
  let facts = parseFacts(await model('facts', { candidate, evidenceMode, trustedEditorialSourceId: trustedId, sources: evidence, now: now.toISOString() }))
  const factTrigger = centralRisk(candidate, facts)
  log(`[AIBeat Quality Gate] Risk: ${initialHigh || factTrigger ? 'HIGH' : facts.riskLevel.toUpperCase()} | Risk trigger: ${factTrigger || (forceHighRisk ? 'PRIOR_HIGH_RISK_ASSESSMENT' : initialRisk.trigger)} | Stage: facts`)
  if (factTrigger && facts.riskLevel !== 'high') log(`[AIBeat Quality Gate] Risk escalated: ${facts.riskLevel.toUpperCase()} → HIGH | Trigger: ${factTrigger}`)
  for (const fact of facts.confirmedFacts.filter(f => !f.core)) {
    const trigger = claimRisk(fact, facts)
    if (trigger) log(`[AIBeat Quality Gate] Claim risk: HIGH | Trigger: ${trigger} | Scope: NON_CORE_CLAIM`)
  }
  facts = checkFacts(candidate, facts, sources, now, trustedId, initialHigh, log)
  if (duplicateEvent(facts.event, candidate.title, history)) throw new Rejection('DUPLICATE_STORY')
  const cleaned = cleanDraft(parseDraft(await model('draft', { confirmedFacts: facts.confirmedFacts, event: facts.event })), facts)
  const words = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  const sourceText = sources.map(s => ' ' + words(s.text).join(' ') + ' ')
  for (const paragraph of cleaned.draft.sections.flatMap(s => s.paragraphs)) {
    const tokens = words(paragraph.text)
    for (let i = 0; i <= tokens.length - 14; i++) if (sourceText.some(s => s.includes(' ' + tokens.slice(i, i + 14).join(' ') + ' '))) throw new Rejection('LOW_INFORMATION_VALUE')
  }
  if (duplicateEvent(facts.event, cleaned.draft.title, history)) throw new Rejection('DUPLICATE_STORY')
  const review = parseReview(await model('review', { candidate, evidenceMode, trustedEditorialSourceId: trustedId, facts, draft: cleaned.draft, sources: evidence, now: now.toISOString() }))
  const reviewTrigger = centralRisk(candidate, facts, review)
  log(`[AIBeat Quality Gate] Risk: ${initialHigh || reviewTrigger ? 'HIGH' : review.riskLevel.toUpperCase()} | Risk trigger: ${reviewTrigger || (forceHighRisk ? 'PRIOR_HIGH_RISK_ASSESSMENT' : initialRisk.trigger)} | Stage: review`)
  if (reviewTrigger && review.riskLevel !== 'high') log(`[AIBeat Quality Gate] Risk escalated: ${review.riskLevel.toUpperCase()} → HIGH | Trigger: ${reviewTrigger}`)
  const qualityScore = publicationScore(facts, sources, review, candidate, trustedId, initialHigh)
  if (initialHigh || highRisk(candidate, facts) || reviewTrigger) facts.riskLevel = 'high'
  else if (review.riskLevel === 'medium') facts.riskLevel = 'medium'
  const used = new Set(facts.confirmedFacts.flatMap(f => f.supportedBy.map(s => s.sourceId)))
  const hasConsequentialClaim = facts.confirmedFacts.some(f => claimRisk(f, facts, review))
  return { ...cleaned, facts, sources: sources.filter(s => used.has(s.id)), qualityScore, evidenceMode: facts.riskLevel === 'high' || hasConsequentialClaim ? 'ENHANCED_VERIFICATION' : evidenceMode }
}

// The only side-effect boundary. Rejections cannot reach final image/MDX creation.
export async function processCandidate(candidate: Candidate, dependencies: {
  collect: () => Promise<Source[]>; model: Model; history: HistoricalStory[];
  publish: (approved: Approved) => Promise<void>; log: (message: string) => void; now?: Date;
  collectEnhanced?: () => Promise<Source[]>;
  verifyAvailable?: (sources: Source[]) => Promise<void>;
}) {
  let sources: Source[] = []
  let stage = 'candidate_date'
  try {
    dependencies.log(`[AIBeat Quality Gate] Candidate: ${safeLabel(candidate.title)}`)
    checkFresh(candidate.publishedAt, dependencies.now || new Date())
    stage = 'source_discovery'
    sources = await dependencies.collect()
    const trackedModel: Model = async (modelStage, input) => {
      stage = modelStage
      const output = await dependencies.model(modelStage, input)
      stage = `${modelStage}_validation`
      return output
    }
    stage = 'minimum_evidence'
    const original = sources.find(s => s.url === candidate.url || s.requestedUrl === candidate.url)
    const single = original && ordinaryTrustedCandidate(candidate, original)
    dependencies.log(`[AIBeat Quality Gate] Publisher: ${safeLabel(original?.name || 'Unknown')} | Publisher trust: ${original?.editorial?.publisherTrust || 'NOT_TRUSTED'} | Content type: ${original?.editorial?.contentType || 'AMBIGUOUS'} | Risk: ${storyRisk(candidate, original).level.toUpperCase()} | Risk trigger: ${storyRisk(candidate, original).trigger} | Evidence mode: ${single ? 'TRUSTED_SINGLE_SOURCE' : 'ENHANCED_VERIFICATION'}`)
    let approved: Approved
    try {
      approved = await evaluateCandidate(candidate, sources, dependencies.history, trackedModel, dependencies.now, false, dependencies.log)
    } catch (error) {
      if ((error instanceof Rejection && error.detail?.startsWith('CLAIM_ONLY:')) || !single || !dependencies.collectEnhanced || !(error instanceof Rejection) || !['NO_PRIMARY_SOURCE', 'UNVERIFIED_HIGH_RISK_CLAIM'].includes(error.reason)) throw error
      dependencies.log('[AIBeat Quality Gate] Risk: HIGH | Evidence mode: ENHANCED_VERIFICATION | Model escalated risk; retrieving corroboration within existing budgets.')
      stage = 'source_discovery'
      sources = await dependencies.collectEnhanced()
      approved = await evaluateCandidate(candidate, sources, dependencies.history, trackedModel, dependencies.now, true, dependencies.log)
    }
    stage = 'source_availability'
    await dependencies.verifyAvailable?.(approved.sources)
    stage = 'publication'
    await dependencies.publish(approved)
    dependencies.log(`[AIBeat Quality Gate] PUBLISH | Evidence mode: ${approved.evidenceMode} | Sources: ${approved.sources.length} | Primary: ${approved.sources.filter(s => s.tier === 1).length} | Risk: ${approved.facts.riskLevel} | Facts: ${approved.facts.confirmedFacts.length} | Uncertain claims omitted: ${approved.facts.uncertainClaims.length} | Paragraphs removed: ${approved.removedParagraphs} | Score: ${approved.qualityScore}`)
    return true
  } catch (error) {
    const reason = error instanceof Rejection ? failureDetail(error) : stage === 'source_discovery' || stage === 'source_availability' ? failureDetail(error) : 'MALFORMED_MODEL_OUTPUT'
    dependencies.log(`[AIBeat Quality Gate] SKIPPED: ${safeLabel(candidate.title)} | Stage: ${stage} | Reason: ${reason} | Sources checked: ${sources.length} | Primary: ${sources.filter(s => s.tier === 1).length}`)
    return false
  }
}
