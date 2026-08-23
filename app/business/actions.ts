'use server'

import { revalidatePath } from 'next/cache'
import { getAuthenticatedBusinessContext } from '@/lib/business/server-auth'
import { SupabaseBusinessDataStore } from '@/lib/business/supabase-store'
import { createClient } from '@/lib/supabase/server'

export async function runBusinessWorkflowAction(workflowId: string) {
  const auth = await getAuthenticatedBusinessContext()
  const store = new SupabaseBusinessDataStore(createClient())
  const result = await store.runWorkflow({ organizationId: auth.organizationId, userId: auth.userId }, workflowId)
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

function revalidateBusinessPaths() {
  for (const path of ['/business/dashboard', '/business/workflows', '/business/approvals', '/business/reports', '/business/audit', '/business/context']) {
    revalidatePath(path)
  }
}
