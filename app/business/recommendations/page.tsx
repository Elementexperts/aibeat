import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Recommendations | AIBeat Business',
  description: 'AIBeat Business spend and workflow recommendations connected to governed AI agents.',
}

export default async function BusinessRecommendationsPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="recommendations" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} />
}

