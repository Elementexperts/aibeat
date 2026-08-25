import type { Metadata } from 'next'
import { decideBusinessApprovalAction, inviteBusinessMemberAction, runBusinessWorkflowAction, updateBusinessMemberRoleAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = {
  title: 'Settings | AIBeat Business',
  description: 'AIBeat Business workspace settings for industry profile and core security posture.',
  robots: privateBusinessRobots,
}

export default async function BusinessSettingsPage() {
  const data = await getAuthenticatedBusinessWorkspaceData()
  return <BusinessWorkspace route="settings" initialData={data} onRunWorkflow={runBusinessWorkflowAction} onDecideApproval={decideBusinessApprovalAction} onInviteMember={inviteBusinessMemberAction} onUpdateMemberRole={updateBusinessMemberRoleAction} />
}

