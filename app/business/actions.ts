'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedBusinessContext } from '@/lib/business/server-auth'
import { SupabaseBusinessDataStore } from '@/lib/business/supabase-store'
import { createClient } from '@/lib/supabase/server'

const BUSINESS_DOCUMENT_BUCKET = 'business-documents'

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
