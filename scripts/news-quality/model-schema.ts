import { HIGH_RISK_RULES } from './config'
import type { Model } from './types'

type Schema = { type: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; enum?: string[] }
const string: Schema = { type: 'string' }
const boolean: Schema = { type: 'boolean' }
const number: Schema = { type: 'number' }
const array = (items: Schema): Schema => ({ type: 'array', items })
const object = (properties: Record<string, Schema>): Schema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const strings = array(string)
const risk = { riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }, riskAssessments: array(object({ factId: string, category: { type: 'string', enum: HIGH_RISK_RULES.map(rule => rule.category) } })) }
// Transport structure only. Existing local validators retain length, evidence,
// confidence and publication constraints. Empty facts remain possible abstention.
export const MODEL_SCHEMAS = {
  facts: object({ story: string, event: object({ entities: strings, action: string, product: string, eventDate: string }), eventSourceId: string, eventDatePassageId: string,
    confirmedFacts: array(object({ id: string, claim: string, core: boolean, confidence: number, supportedBy: array(object({ sourceId: string, passageId: string })) })), uncertainClaims: strings, conflictingClaims: strings, ...risk, confidence: number }),
  draft: object({ title: string, deck: string, sections: array(object({ heading: string, kind: { type: 'string', enum: ['facts', 'analysis'] }, paragraphs: array(object({ text: string, factIds: strings })) })) }),
  review: object({ supportedFactIds: strings, unsupportedClaims: strings, conflictingClaims: strings, unverifiedEntities: strings, derivativeGroups: array(strings), authoritativePrimaryIds: strings, trustedEditorialSourceIds: strings, eventDateVerified: boolean, independentReporting: boolean, analysisGrounded: boolean, originalValue: boolean, clearWriting: boolean, ...risk }),
}
export function responseFormat(model: string, stage: Parameters<Model>[0]) {
  // Verified Groq strict-mode models. Preserve compatibility for configured overrides.
  return ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'].includes(model)
    ? { type: 'json_schema', json_schema: { name: `aibeat_${stage}`, strict: true, schema: MODEL_SCHEMAS[stage] } }
    : { type: 'json_object' }
}
