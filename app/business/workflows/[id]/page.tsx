import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Workflow Detail | AIBeat Business',
  description: 'AIBeat Business workflow detail with step definitions, approval policy, and run timeline.',
}

export default function BusinessWorkflowDetailPage({ params }: { params: { id: string } }) {
  return <BusinessWorkspace route="workflow-detail" workflowId={params.id} />
}
