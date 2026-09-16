import { HIGH_RISK } from './config'
import { failureDetail, safeLabel } from './diagnostics'
import { checkFresh, checkFacts, cleanDraft, duplicateEvent, highRisk, parseFacts, parseDraft, parseReview, publicationScore, sourcePolicy } from './gate'
import { Rejection, type Approved, type Candidate, type HistoricalStory, type Model, type Source } from './types'

export async function evaluateCandidate(candidate: Candidate, sources: Source[], history: HistoricalStory[], model: Model, now = new Date()): Promise<Approved> {
  checkFresh(candidate.publishedAt, now)
  sourcePolicy(sources, HIGH_RISK.test(candidate.title))
  const evidence = sources.map(({ links, imageUrl, ...source }) => source)
  const facts = parseFacts(await model('facts', { candidate, sources: evidence, now: now.toISOString() }))
  checkFacts(candidate, facts, sources, now)
  if (duplicateEvent(facts.event, candidate.title, history)) throw new Rejection('DUPLICATE_STORY')
  const cleaned = cleanDraft(parseDraft(await model('draft', { confirmedFacts: facts.confirmedFacts, event: facts.event })), facts)
  const words = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  const sourceText = sources.map(s => ' ' + words(s.text).join(' ') + ' ')
  for (const paragraph of cleaned.draft.sections.flatMap(s => s.paragraphs)) {
    const tokens = words(paragraph.text)
    for (let i = 0; i <= tokens.length - 14; i++) if (sourceText.some(s => s.includes(' ' + tokens.slice(i, i + 14).join(' ') + ' '))) throw new Rejection('LOW_INFORMATION_VALUE')
  }
  if (duplicateEvent(facts.event, cleaned.draft.title, history)) throw new Rejection('DUPLICATE_STORY')
  const review = parseReview(await model('review', { candidate, facts, draft: cleaned.draft, sources: evidence, now: now.toISOString() }))
  const qualityScore = publicationScore(facts, sources, review, candidate)
  if (highRisk(candidate, facts) || review.riskLevel === 'high') facts.riskLevel = 'high'
  const used = new Set(facts.confirmedFacts.flatMap(f => f.supportedBy.map(s => s.sourceId)))
  return { ...cleaned, facts, sources: sources.filter(s => used.has(s.id)), qualityScore }
}

// The only side-effect boundary. Rejections cannot reach final image/MDX creation.
export async function processCandidate(candidate: Candidate, dependencies: {
  collect: () => Promise<Source[]>; model: Model; history: HistoricalStory[];
  publish: (approved: Approved) => Promise<void>; log: (message: string) => void; now?: Date;
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
    const approved = await evaluateCandidate(candidate, sources, dependencies.history, trackedModel, dependencies.now)
    stage = 'source_availability'
    await dependencies.verifyAvailable?.(approved.sources)
    stage = 'publication'
    await dependencies.publish(approved)
    dependencies.log(`[AIBeat Quality Gate] PUBLISH | Sources: ${approved.sources.length} | Primary: ${approved.sources.filter(s => s.tier === 1).length} | Risk: ${approved.facts.riskLevel} | Facts: ${approved.facts.confirmedFacts.length} | Uncertain claims omitted: ${approved.facts.uncertainClaims.length} | Paragraphs removed: ${approved.removedParagraphs} | Score: ${approved.qualityScore}`)
    return true
  } catch (error) {
    const reason = error instanceof Rejection ? failureDetail(error) : stage === 'source_discovery' || stage === 'source_availability' ? failureDetail(error) : 'MALFORMED_MODEL_OUTPUT'
    dependencies.log(`[AIBeat Quality Gate] SKIPPED: ${safeLabel(candidate.title)} | Stage: ${stage} | Reason: ${reason} | Sources checked: ${sources.length} | Primary: ${sources.filter(s => s.tier === 1).length}`)
    return false
  }
}
