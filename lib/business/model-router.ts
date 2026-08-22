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
    return { data: {} as T, usage: usage('mock-structured-extractor', `model-${Date.now()}`) }
  }
}

export const modelRouter = new MockModelRouter()
