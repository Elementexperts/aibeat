import { consequential, originalEditorial, ordinaryTrustedCandidate } from './trust'
import { failureDetail, safeLabel } from './diagnostics'
import { checkFresh, checkFacts, cleanDraft, duplicateEvent, highRisk, parseFacts, parseDraft, parseReview, publicationScore, sourcePolicy } from './gate'
import { Rejection, type Approved, type Candidate, type HistoricalStory, type Model, type Source } from './types'

export async function evaluateCandidate(candidate: Candidate, sources: Source[], history: HistoricalStory[], model: Model, now = new Date(), forceHighRisk = false): Promise<Approved> {
  checkFresh(candidate.publishedAt, now)
  const original = originalEditorial(candidate, sources)
  const retrievedOriginal = sources.find(s => s.url === candidate.url || s.requestedUrl === candidate.url)
  const initialHigh = forceHighRisk || consequential([candidate.title, retrievedOriginal?.title, retrievedOriginal?.text].join(' '))
  const trustedId = !initialHigh && original && ordinaryTrustedCandidate(candidate, original) ? original.id : undefined
  if (trustedId) checkFresh(original!.publishedAt, now, 'ORIGINAL_PUBLICATION_DATE')
  sourcePolicy(sources, initialHigh, trustedId)
  const evidenceMode = trustedId ? 'TRUSTED_SINGLE_SOURCE' : 'ENHANCED_VERIFICATION'
  const evidence = sources.map(({ links, imageUrl, ...source }) => source)
  const facts = parseFacts(await model('facts', { candidate, evidenceMode, trustedEditorialSourceId: trustedId, sources: evidence, now: now.toISOString() }))
  if (initialHigh) facts.riskLevel = 'high'
  checkFacts(candidate, facts, sources, now, trustedId, initialHigh)
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
  const qualityScore = publicationScore(facts, sources, review, candidate, trustedId, initialHigh)
  if (highRisk(candidate, facts) || review.riskLevel === 'high') facts.riskLevel = 'high'
  const used = new Set(facts.confirmedFacts.flatMap(f => f.supportedBy.map(s => s.sourceId)))
  return { ...cleaned, facts, sources: sources.filter(s => used.has(s.id)), qualityScore, evidenceMode: facts.riskLevel === 'high' ? 'ENHANCED_VERIFICATION' : evidenceMode }
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
    dependencies.log(`[AIBeat Quality Gate] Publisher: ${safeLabel(original?.name || 'Unknown')} | Publisher trust: ${original?.editorial?.publisherTrust || 'NOT_TRUSTED'} | Content type: ${original?.editorial?.contentType || 'AMBIGUOUS'} | Risk: ${consequential(candidate.title + ' ' + (original?.text || '')) ? 'HIGH' : 'LOW/MEDIUM_PENDING_REVIEW'} | Evidence mode: ${single ? 'TRUSTED_SINGLE_SOURCE' : 'ENHANCED_VERIFICATION'}`)
    let approved: Approved
    try {
      approved = await evaluateCandidate(candidate, sources, dependencies.history, trackedModel, dependencies.now)
    } catch (error) {
      if (!single || !dependencies.collectEnhanced || !(error instanceof Rejection) || !['NO_PRIMARY_SOURCE', 'UNVERIFIED_HIGH_RISK_CLAIM'].includes(error.reason)) throw error
      dependencies.log('[AIBeat Quality Gate] Risk: HIGH | Evidence mode: ENHANCED_VERIFICATION | Model escalated risk; retrieving corroboration within existing budgets.')
      stage = 'source_discovery'
      sources = await dependencies.collectEnhanced()
      approved = await evaluateCandidate(candidate, sources, dependencies.history, trackedModel, dependencies.now, true)
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
