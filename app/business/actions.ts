'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedBusinessContext } from '@/lib/business/server-auth'
import { SupabaseBusinessDataStore } from '@/lib/business/supabase-store'
import { createClient } from '@/lib/supabase/server'
import { askAIBeat } from '@/lib/business/assistant/assistant'
import { buildAssistantContext } from '@/lib/business/assistant/context'
import type { AIBeatAssistantMessage } from '@/lib/business/assistant/types'
import { ModelConfigurationError, ModelProviderError, ModelResponseValidationError } from '@/lib/business/model-router'
import { testAIConnection } from '@/lib/business/ai-runtime'

const BUSINESS_DOCUMENT_BUCKET = 'business-documents'

export async function askAIBeatAction(question: string, history: AIBeatAssistantMessage[] = []) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  try {
    const context = await buildAssistantContext(store, { organizationId: auth.organizationId, userId: auth.userId }, question)
    return { ok: true as const, response: await askAIBeat({ question, context, history: history.slice(-10) }) }
  } catch (error) {
    if (error instanceof ModelConfigurationError) return { ok: false as const, code: 'CONFIGURATION' as const, error: 'Live AI configuration is incomplete. Ask an administrator to review AI Stack.' }
    if (error instanceof ModelProviderError) return { ok: false as const, code: error.code as 'TIMEOUT' | 'UNAVAILABLE', error: error.code === 'TIMEOUT' ? 'The configured AI provider timed out. Please try again.' : 'AIBeat could not reach the configured AI provider. Please try again.' }
    if (error instanceof ModelResponseValidationError || (error instanceof Error && /malformed assistant response/i.test(error.message))) return { ok: false as const, code: 'MALFORMED_RESPONSE' as const, error: 'AIBeat received an invalid response from the configured provider. Please try again.' }
    return { ok: false as const, code: 'WORKSPACE' as const, error: error instanceof Error && /characters or fewer|Enter a question/.test(error.message) ? error.message : 'AIBeat could not read the workspace context. Please try again.' }
  }
}

export async function testBusinessAIConnectionAction() {
  const auth = await getAuthenticatedBusinessContext()
  if (auth.role !== 'OWNER' && auth.role !== 'ADMIN') return { ok: false as const, message: 'Only an organization owner or admin can test the AI connection.' }
  const result = await testAIConnection()
  const store = new SupabaseBusinessDataStore(createClient())
  await store.recordRuntimeAuditEvent({ organizationId: auth.organizationId, userId: auth.userId }, 'AI_CONNECTION_TESTED', `AI connection test ${result.ok ? 'succeeded' : 'failed'} for ${result.status.provider}.`).catch(() => undefined)
  return result
}

export async function runBusinessWorkflowAction(workflowId: string, input: Record<string, unknown> = {}) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const result = await store.runWorkflow({ organizationId: auth.organizationId, userId: auth.userId }, workflowId, { input })
  revalidateBusinessPaths()
  return result
}

export async function decideBusinessApprovalAction(approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'EDITED', editedContent?: string) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const approval = await store.decideApproval({ organizationId: auth.organizationId, userId: auth.userId }, approvalId, decision, editedContent)
  revalidateBusinessPaths()
  return approval
}

export async function uploadBusinessDocumentAction(formData: FormData) {
  const auth = await getAuthenticatedBusinessContext()
  const supabase = createClient()
  const store = new SupabaseBusinessDataStore(supabase)
  const file = formData.get('file')
  if (!(file instanceof File)) throw new Error('Choose a document to upload.')

  const title = String(formData.get('title') || file.name || 'Untitled document').trim()
  const source = String(formData.get('source') || 'Upload').trim()
  const sourceUrl = String(formData.get('sourceUrl') || '').trim() || undefined
  const bytes = Buffer.from(await file.arrayBuffer())
  const storagePath = `${auth.organizationId}/${Date.now()}-${sanitizeStorageName(file.name || title)}`

  const { error: uploadError } = await supabase.storage
    .from(BUSINESS_DOCUMENT_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || 'text/plain',
      upsert: true,
    })

  if (uploadError) throw new Error(`Unable to store document: ${uploadError.message}`)

  const result = await store.ingestDocument(
    { organizationId: auth.organizationId, userId: auth.userId },
    {
      title,
      fileName: file.name,
      mimeType: file.type,
      source,
      sourceUrl,
      storageBucket: BUSINESS_DOCUMENT_BUCKET,
      storagePath,
      bytes,
    },
  )
  revalidateBusinessPaths()
  return {
    document: result.document,
    chunks: result.chunks,
    contextItem: result.contextItem,
  }
}

export async function updateBusinessIntegrationAction(integrationId: string, action: 'disconnect' | 'reconnect' | 'mark-expired') {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const actor = { organizationId: auth.organizationId, userId: auth.userId }
  const status = action === 'disconnect' ? 'DISCONNECTED' : action === 'mark-expired' ? 'TOKEN_EXPIRED' : 'RECONNECT_REQUIRED'
  const connection = await store.upsertIntegrationConnection(actor, integrationId, {
    status,
    lastError: action === 'mark-expired' ? 'OAuth access token expired.' : undefined,
    reconnectUrl: `/business/integrations/oauth/start?integration=${encodeURIComponent(integrationId)}`,
    metadata: { action, updatedBy: auth.userId },
  })
  revalidateBusinessPaths()
  return connection
}

export async function inviteBusinessMemberAction(formData: FormData) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const email = String(formData.get('email') || '').trim()
  const role = String(formData.get('role') || 'MEMBER').trim()
  if (!email) throw new Error('Email is required.')
  const member = await store.inviteMember({ organizationId: auth.organizationId, userId: auth.userId }, { email, role })
  revalidateBusinessPaths()
  return member
}

export async function updateBusinessMemberRoleAction(memberId: string, role: string) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const member = await store.updateMemberRole({ organizationId: auth.organizationId, userId: auth.userId }, memberId, role)
  revalidateBusinessPaths()
  return member
}

export async function runAgentEvaluationHarnessAction() {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const evaluations = await store.runAgentEvaluationHarness({ organizationId: auth.organizationId, userId: auth.userId })
  revalidateBusinessPaths()
  return evaluations
}

function revalidateBusinessPaths() {
  for (const path of ['/business/dashboard', '/business/workflows', '/business/approvals', '/business/reports', '/business/audit', '/business/context', '/business/settings', '/business/integrations']) {
    revalidatePath(path)
  }
}

function sanitizeStorageName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'document.txt'
}
