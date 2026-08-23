import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Approvals | AIBeat Business',
  description: 'AIBeat Business approval center for approve, edit, reject, and workflow continuation decisions.',
}

export default async function BusinessApprovalsPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="approvals" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} />
}

