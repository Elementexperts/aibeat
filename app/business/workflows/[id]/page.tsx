import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Workflow Detail | AIBeat Business',
  description: 'AIBeat Business workflow detail with step definitions, approval policy, and run timeline.',
  robots: privateBusinessRobots,
}

export default async function BusinessWorkflowDetailPage({ params }: { params: { id: string } }) {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="workflow-detail" workflowId={params.id} initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} />
}
