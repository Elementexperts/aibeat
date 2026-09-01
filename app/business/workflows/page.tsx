import type { Metadata } from 'next'
import { decideBusinessApprovalAction, runBusinessWorkflowAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Workflows | AIBeat Business',
  description: 'Structured AIBeat Business workflows with templates, manual runs, run history, approval gates, and timelines.',
  robots: privateBusinessRobots,
}

export default async function BusinessWorkflowsPage({ searchParams }: { searchParams: { workflow?: string; leadUrl?: string } }) {
  const data = await getAuthenticatedBusinessWorkspaceData()
  const initialWorkflowSuggestion = searchParams.workflow === 'tpl-lead-research' && typeof searchParams.leadUrl === 'string' ? { workflowId: 'tpl-lead-research', input: { leadUrl: searchParams.leadUrl.slice(0, 2048) } } : undefined
  return <BusinessWorkspace route="workflows" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} initialWorkflowSuggestion={initialWorkflowSuggestion} />
}

