import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Reports | AIBeat Business',
  description: 'AIBeat Business ROI and performance reporting for workflows, approvals, AI spend, and estimated business impact.',
}

export default async function BusinessReportsPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="reports" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} />
}

