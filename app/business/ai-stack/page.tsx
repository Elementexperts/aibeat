import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction, testBusinessAIConnectionAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'AI Stack | AIBeat Business',
  description: 'AIBeat Business AI stack inventory, tool usage, seat utilization, approvals, and spend intelligence.',
  robots: privateBusinessRobots,
}

export default async function BusinessAIStackPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="ai-stack" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} onTestAIConnection={testBusinessAIConnectionAction} />
}

