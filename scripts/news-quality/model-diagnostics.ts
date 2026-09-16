import { Rejection, type Model } from './types'

export type ModelFailureCategory = 'MODEL_HTTP_ERROR' | 'MODEL_RATE_LIMITED' | 'MODEL_SERVER_ERROR' | 'MODEL_TRUNCATED' | 'MODEL_EMPTY_CONTENT' | 'MODEL_INVALID_JSON' | 'MODEL_SCHEMA_INVALID' | 'MODEL_INVALID_FINISH_REASON' | 'MODEL_TIMEOUT' | 'MODEL_UNEXPECTED_ERROR'
export class ModelFailure extends Rejection {
  constructor(public category: ModelFailureCategory) { super('MALFORMED_MODEL_OUTPUT', category) }
}
type Stage = Parameters<Model>[0]
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

// Diagnostic observer only: called after the existing parser rejects. Never
// changes validity, coerces a value, or reports untrusted keys/values. One issue
// maximum avoids response dumps and unbounded validation logs.
export function schemaIssue(stage: Stage, value: unknown): { field: string; problem: string } {
  const issue = (field: string, problem: string) => ({ field, problem })
  if (!object(value)) return issue(stage, 'expected_object')
  const required = stage === 'facts'
    ? ['story', 'event', 'eventSourceId', 'eventDateEvidence', 'confirmedFacts', 'uncertainClaims', 'conflictingClaims', 'riskLevel', 'riskAssessments', 'confidence']
    : stage === 'draft' ? ['title', 'deck', 'sections']
      : ['supportedFactIds', 'unsupportedClaims', 'conflictingClaims', 'unverifiedEntities', 'derivativeGroups', 'authoritativePrimaryIds', 'trustedEditorialSourceIds', 'eventDateVerified', 'independentReporting', 'analysisGrounded', 'originalValue', 'clearWriting', 'riskLevel', 'riskAssessments']
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(value, key)) return issue(key, 'missing_required_field')
  if (stage !== 'draft' && !['low', 'medium', 'high'].includes(value.riskLevel as string)) return issue('riskLevel', 'invalid_enum')
  const arrays = stage === 'facts' ? ['confirmedFacts', 'uncertainClaims', 'conflictingClaims', 'riskAssessments'] : stage === 'draft' ? ['sections'] : ['supportedFactIds', 'unsupportedClaims', 'conflictingClaims', 'unverifiedEntities', 'derivativeGroups', 'authoritativePrimaryIds', 'trustedEditorialSourceIds', 'riskAssessments']
  for (const key of arrays) if (!Array.isArray(value[key])) return issue(key, 'expected_array')
  if (stage === 'facts') {
    if (typeof value.confidence !== 'number') return issue('confidence', 'expected_number')
    if (!object(value.event)) return issue('event', 'expected_object')
    for (const key of ['entities', 'action', 'product', 'eventDate']) if (!Object.prototype.hasOwnProperty.call(value.event, key)) return issue(`event.${key}`, 'missing_required_field')
    for (const fact of value.confirmedFacts as unknown[]) {
      if (!object(fact)) return issue('confirmedFacts.item', 'expected_object')
      for (const key of ['id', 'claim', 'core', 'confidence', 'supportedBy']) if (!Object.prototype.hasOwnProperty.call(fact, key)) return issue(`confirmedFacts.item.${key}`, 'missing_required_field')
      if (!Array.isArray(fact.supportedBy)) return issue('confirmedFacts.item.supportedBy', 'expected_array')
      for (const citation of fact.supportedBy) {
        if (!object(citation)) return issue('confirmedFacts.item.supportedBy.item', 'expected_object')
        for (const key of ['sourceId', 'excerpt']) if (!Object.prototype.hasOwnProperty.call(citation, key)) return issue(`confirmedFacts.item.supportedBy.item.${key}`, 'missing_required_field')
      }
    }
  }
  return issue(stage, 'validation_constraint_failed')
}

export function safeModelName(model: string, key: string) {
  // Model IDs are configuration, but never echo a value containing the credential.
  return model && model !== key && !(key && model.includes(key)) && /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,119}$/.test(model) ? model : 'REDACTED_INVALID_MODEL_ID'
}
