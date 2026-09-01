import { GoogleGenAI } from '@google/genai'
import type { ModelRouter, ModelUsage } from '../model-router'

export const LEAD_RESEARCH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    leadName: { type: 'string' }, company: { type: 'string' }, fitScore: { type: 'number' }, confidence: { type: 'number' },
    reasons: { type: 'array', items: { type: 'string' } }, evidence: { type: 'array', items: { type: 'string' } },
    likelyNeeds: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } },
    recommendedNextAction: { type: 'string' }, suggestedOutreachAngle: { type: 'string' },
  },
  required: ['leadName', 'company', 'fitScore', 'confidence', 'reasons', 'evidence', 'likelyNeeds', 'risks', 'recommendedNextAction', 'suggestedOutreachAngle'],
  additionalProperties: false,
} as const

type GeminiUsage = { promptTokenCount?: number; responseTokenCount?: number }
export function mapGeminiUsage(metadata: GeminiUsage | undefined, model: string, latencyMs: number, runId: string): ModelUsage {
  return { provider: 'gemini', model, tokensIn: metadata?.promptTokenCount ?? 0, tokensOut: metadata?.responseTokenCount ?? 0, estimatedCostUsd: 0, latencyMs, runId }
}

export class GeminiModelRouter implements ModelRouter {
  private readonly client: GoogleGenAI
  private readonly model: string
  constructor(config: { apiKey: string; model: string }) { this.client = new GoogleGenAI({ apiKey: config.apiKey }); this.model = config.model }

  private async request(input: string, config?: Record<string, unknown>) {
    const started = Date.now(); const runId = crypto.randomUUID()
    try {
      const response = await this.client.models.generateContent({ model: this.model, contents: input, config: { ...config, abortSignal: AbortSignal.timeout(45_000) } })
      return { text: response.text ?? '', usage: mapGeminiUsage(response.usageMetadata, this.model, Date.now() - started, runId) }
    } catch {
      throw new Error('Gemini request failed. Check the configured model, API access, and try again.')
    }
  }
  async classify(input: string) { const result = await this.request(`Classify this input with one concise label.\n${input}`); return { label: result.text.trim(), usage: result.usage } }
  async generate(input: string) { return this.request(input) }
  async reason(input: string) { return this.request(input) }
  async summarize(input: string) { const result = await this.request(`Summarize concisely.\n${input}`); return { summary: result.text, usage: result.usage } }
  async extractStructured<T>(input: string, schemaName: string) {
    const schema = schemaName === 'LEAD_RESEARCH' ? LEAD_RESEARCH_RESPONSE_SCHEMA : undefined
    if (!schema) throw new Error(`Unsupported structured output schema: ${schemaName}`)
    const result = await this.request(input, { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.2 })
    try { return { data: JSON.parse(result.text) as T, usage: result.usage } } catch { throw new Error('Gemini returned invalid structured output.') }
  }
}
