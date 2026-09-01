import 'server-only'

import { getBusinessAIMode, getModelRouter, ModelConfigurationError, ModelProviderError } from './model-router'

export interface AIRuntimeStatus {
  mode: 'mock' | 'live'
  provider: 'mock' | 'gemini'
  model: string
  configured: boolean
}

export function getAIRuntimeStatus(env: Readonly<Record<string, string | undefined>> = process.env): AIRuntimeStatus {
  const mode = getBusinessAIMode(env)
  if (mode === 'mock') return { mode, provider: 'mock', model: 'deterministic', configured: true }
  const provider = env.AIBEAT_BUSINESS_AI_PROVIDER?.trim().toLowerCase()
  return { mode, provider: 'gemini', model: env.AIBEAT_BUSINESS_MODEL?.trim() || 'gemini-2.5-flash', configured: provider === 'gemini' && Boolean(env.GEMINI_API_KEY) }
}

export async function testAIConnection(): Promise<{ ok: boolean; message: string; status: AIRuntimeStatus; latencyMs?: number }> {
  const status = getAIRuntimeStatus()
  if (status.mode === 'mock') return { ok: true, message: 'Mock AI is ready. External AI calls are disabled.', status, latencyMs: 0 }
  if (!status.configured) return { ok: false, message: 'Live AI configuration is incomplete.', status }
  try {
    const result = await (await getModelRouter()).generate('Reply with only: ready')
    return { ok: true, message: 'AI provider connection succeeded.', status, latencyMs: result.usage.latencyMs }
  } catch (error) {
    const message = error instanceof ModelConfigurationError ? 'Live AI configuration is incomplete.' : error instanceof ModelProviderError && error.code === 'TIMEOUT' ? 'The configured AI provider timed out.' : 'AIBeat could not reach the configured AI provider. Please try again.'
    return { ok: false, message, status }
  }
}
