import type { BusinessDocumentChunk } from './types'

export const BUSINESS_MEMORY_VECTOR_DIMENSIONS = 384

export interface RetrievalResult extends BusinessDocumentChunk {
  similarity: number
  lexicalScore: number
}

export function embedBusinessText(text: string, dimensions = BUSINESS_MEMORY_VECTOR_DIMENSIONS): number[] {
  const vector = Array.from({ length: dimensions }, () => 0)
  const tokens = tokenize(text)

  for (const token of tokens) {
    const hash = hashToken(token)
    const index = Math.abs(hash) % dimensions
    vector[index] += hash < 0 ? -1 : 1
  }

  return normalize(vector)
}

export function rankBusinessMemoryChunks(params: {
  query: string
  chunks: BusinessDocumentChunk[]
  limit?: number
  minScore?: number
}): RetrievalResult[] {
  const queryVector = embedBusinessText(params.query)
  const queryTokens = new Set(tokenize(params.query))
  const minScore = params.minScore ?? 0.05

  return params.chunks
    .filter((chunk) => chunk.status === 'ACTIVE')
    .map((chunk) => {
      const similarity = cosineSimilarity(queryVector, chunk.embedding)
      const lexicalScore = overlapScore(queryTokens, chunk.content)
      return {
        ...chunk,
        similarity,
        lexicalScore,
      }
    })
    .filter((chunk) => chunk.similarity + chunk.lexicalScore >= minScore)
    .sort((a, b) => (b.similarity + b.lexicalScore) - (a.similarity + a.lexicalScore))
    .slice(0, params.limit ?? 8)
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length)
  let dot = 0
  let magA = 0
  let magB = 0

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index]
    magA += a[index] * a[index]
    magB += b[index] * b[index]
  }

  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (!magnitude) return vector
  return vector.map((value) => Number((value / magnitude).toFixed(6)))
}

function overlapScore(queryTokens: Set<string>, text: string): number {
  if (!queryTokens.size) return 0
  const chunkTokens = new Set(tokenize(text))
  let matches = 0
  queryTokens.forEach((token) => {
    if (chunkTokens.has(token)) matches += 1
  })
  return matches / queryTokens.size
}

function hashToken(token: string): number {
  let hash = 2166136261
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash | 0
}
