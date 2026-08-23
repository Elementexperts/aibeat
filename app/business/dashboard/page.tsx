import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Business Dashboard | AIBeat Business',
  description: 'AIBeat Business dashboard for active workflows, approvals, agent findings, AI spend, potential savings, and ROI.',
}

export default async function BusinessDashboardPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="dashboard" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} />
}

