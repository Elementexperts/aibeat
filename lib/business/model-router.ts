export interface ModelUsage {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  estimatedCostUsd: number
  latencyMs: number
  runId: string
}

export interface ModelRouter {
  classify(input: string): Promise<{ label: string; usage: ModelUsage }>
  generate(input: string): Promise<{ text: string; usage: ModelUsage }>
  reason(input: string): Promise<{ text: string; usage: ModelUsage }>
  summarize(input: string): Promise<{ summary: string; usage: ModelUsage }>
  extractStructured<T>(input: string, schemaName: string): Promise<{ data: T; usage: ModelUsage }>
}

export type BusinessAIMode = 'mock' | 'live'

export class ModelConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModelConfigurationError'
  }
}

function usage(model: string, runId: string): ModelUsage {
  return {
    provider: 'mock',
    model,
    tokensIn: 0,
    tokensOut: 0,
    estimatedCostUsd: 0,
    latencyMs: 12,
    runId,
  }
}

export class MockModelRouter implements ModelRouter {
  async classify(input: string) {
    return { label: input.length > 120 ? 'complex' : 'simple', usage: usage('mock-classifier', `model-${Date.now()}`) }
  }

  async generate(input: string) {
    return { text: `Mock generation based on: ${input.slice(0, 120)}`, usage: usage('mock-generator', `model-${Date.now()}`) }
  }

  async reason(input: string) {
    return { text: `Mock reasoning trace withheld; conclusion based on ${input.length} characters of task context.`, usage: usage('mock-reasoner', `model-${Date.now()}`) }
  }

  async summarize(input: string) {
    return { summary: input.slice(0, 220), usage: usage('mock-summarizer', `model-${Date.now()}`) }
  }

  async extractStructured<T>(_input: string, _schemaName: string) {
    if (_schemaName === 'LEAD_RESEARCH') {
      return {
        data: {
          leadName: 'Example prospect',
          company: 'Example Company',
          fitScore: 82,
          confidence: 0.74,
          reasons: ['Matches the organization ICP', 'Shows a plausible need for governed AI workflows'],
          evidence: ['Deterministic mock evidence for the supplied prospect URL', 'Business Memory context was available to the workflow'],
          likelyNeeds: ['AI workflow governance', 'Lead research automation'],
          risks: ['Mock mode does not fetch or verify the public website'],
          recommendedNextAction: 'Review and approve the simulated CRM note proposal',
          suggestedOutreachAngle: 'Lead with governed automation and shared business context.',
        } as T,
        usage: usage('mock-structured-extractor', `model-${Date.now()}`),
      }
    }
    return { data: {} as T, usage: usage('mock-structured-extractor', `model-${Date.now()}`) }
  }
}

export const modelRouter = new MockModelRouter()

export function getBusinessAIMode(env: Readonly<Record<string, string | undefined>> = process.env): BusinessAIMode {
  return env.AIBEAT_BUSINESS_AI_MODE?.trim().toLowerCase() === 'live' ? 'live' : 'mock'
}

export async function getModelRouter(env: Readonly<Record<string, string | undefined>> = process.env): Promise<ModelRouter> {
  if (getBusinessAIMode(env) === 'mock') return new MockModelRouter()
  const provider = env.AIBEAT_BUSINESS_AI_PROVIDER?.trim().toLowerCase() || 'gemini'
  if (provider !== 'gemini') throw new ModelConfigurationError(`Unsupported live AI provider: ${provider}`)
  if (!env.GEMINI_API_KEY) throw new ModelConfigurationError('Live Gemini mode requires the server-side GEMINI_API_KEY environment variable.')
  const { GeminiModelRouter } = await import('./model-providers/gemini')
  return new GeminiModelRouter({ apiKey: env.GEMINI_API_KEY, model: env.AIBEAT_BUSINESS_MODEL || 'gemini-2.5-flash' })
}
