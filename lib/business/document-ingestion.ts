import { createHash, randomUUID } from 'node:crypto'
import { embedBusinessText } from './vector-retrieval'
import type {
  BusinessContextItem,
  BusinessDocument,
  BusinessDocumentChunk,
  BusinessDocumentIngestionResult,
} from './types'

const CHUNK_TARGET_CHARS = 1600
const CHUNK_OVERLAP_CHARS = 220

export interface DocumentIngestionInput {
  organizationId: string
  userId: string
  title: string
  fileName?: string
  mimeType?: string
  source?: string
  sourceUrl?: string
  storageBucket?: string
  storagePath?: string
  bytes: Buffer
  metadata?: Record<string, unknown>
  now?: string
}

export function ingestBusinessDocument(input: DocumentIngestionInput): BusinessDocumentIngestionResult {
  const now = input.now ?? new Date().toISOString()
  const extractedText = extractTextFromDocument(input)
  const checksum = createHash('sha256').update(input.bytes).digest('hex')
  const documentId = randomUUID()
  const document: BusinessDocument = {
    id: documentId,
    organizationId: input.organizationId,
    title: input.title,
    documentType: normalizeDocumentType(input.mimeType, input.fileName),
    source: input.source ?? 'Upload',
    sourceUrl: input.sourceUrl,
    storageBucket: input.storageBucket,
    storagePath: input.storagePath,
    byteSize: input.bytes.byteLength,
    checksum,
    extractionStatus: 'INDEXED',
    extractedText,
    metadata: {
      fileName: input.fileName,
      mimeType: input.mimeType,
      ...input.metadata,
    },
    createdBy: input.userId,
    createdAt: now,
    updatedAt: now,
  }

  const chunks = chunkDocumentText(extractedText).map((content, index): BusinessDocumentChunk => ({
    id: `chunk-${checksum.slice(0, 12)}-${index + 1}`,
    organizationId: input.organizationId,
    documentId,
    chunkIndex: index,
    title: `${input.title} chunk ${index + 1}`,
    content,
    tokenEstimate: estimateTokens(content),
    embedding: embedBusinessText(`${input.title}\n${content}`),
    metadata: {
      source: document.source,
      sourceUrl: document.sourceUrl,
      documentType: document.documentType,
      documentTitle: document.title,
      chunkIndex: index,
      checksum,
      storagePath: input.storagePath,
      fileName: input.fileName,
    },
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }))

  const contextItem: BusinessContextItem = {
    id: `ctx-${documentId}`,
    organizationId: input.organizationId,
    domain: 'COMPANY_KNOWLEDGE',
    category: 'DOCUMENT',
    title: input.title,
    content: summarizeDocumentForContext(input.title, extractedText, chunks.length),
    structuredData: {
      documentId,
      chunkCount: chunks.length,
      checksum,
      storagePath: input.storagePath,
      documentType: document.documentType,
    },
    source: document.source,
    sourceType: document.documentType,
    sourceUrl: document.sourceUrl,
    confidence: 0.88,
    createdAt: now,
    updatedAt: now,
    humanVerified: false,
    provenance: `Uploaded document ${documentId}; extracted and chunked with source metadata.`,
    status: 'ACTIVE',
    createdBy: input.userId,
  }

  return { document, chunks, contextItem }
}

export function extractTextFromDocument(input: Pick<DocumentIngestionInput, 'bytes' | 'mimeType' | 'fileName'>): string {
  const type = normalizeDocumentType(input.mimeType, input.fileName)
  const raw = input.bytes.toString('utf8')

  if (type === 'HTML') {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (type === 'JSON') {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return normalizeWhitespace(raw)
    }
  }

  if (type === 'PDF') {
    throw new Error('PDF upload storage is supported, but text extraction requires a PDF parser integration.')
  }

  return normalizeWhitespace(raw)
}

export function chunkDocumentText(text: string, targetChars = CHUNK_TARGET_CHARS, overlapChars = CHUNK_OVERLAP_CHARS): string[] {
  const normalized = normalizeWhitespace(text)
  if (!normalized) throw new Error('Document did not contain extractable text')

  const chunks: string[] = []
  let cursor = 0
  while (cursor < normalized.length) {
    const hardEnd = Math.min(cursor + targetChars, normalized.length)
    const sentenceEnd = normalized.lastIndexOf('. ', hardEnd)
    const end = sentenceEnd > cursor + Math.floor(targetChars * 0.55) ? sentenceEnd + 1 : hardEnd
    chunks.push(normalized.slice(cursor, end).trim())
    if (end >= normalized.length) break
    cursor = Math.max(0, end - overlapChars)
  }

  return chunks
}

function summarizeDocumentForContext(title: string, text: string, chunkCount: number): string {
  const preview = normalizeWhitespace(text).slice(0, 700)
  return `${title} was ingested into Business Memory as ${chunkCount} searchable chunks. Preview: ${preview}${text.length > 700 ? '...' : ''}`
}

function normalizeDocumentType(mimeType?: string, fileName?: string): string {
  const lowerMime = mimeType?.toLowerCase() ?? ''
  const lowerName = fileName?.toLowerCase() ?? ''
  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'PDF'
  if (lowerMime.includes('html') || lowerName.endsWith('.html') || lowerName.endsWith('.htm')) return 'HTML'
  if (lowerMime.includes('json') || lowerName.endsWith('.json')) return 'JSON'
  if (lowerMime.includes('csv') || lowerName.endsWith('.csv')) return 'CSV'
  if (lowerMime.includes('markdown') || lowerName.endsWith('.md') || lowerName.endsWith('.mdx')) return 'MARKDOWN'
  return 'TEXT'
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\u0000/g, '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}
