import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Workflows | AIBeat Business',
  description: 'Structured AIBeat Business workflows with templates, manual runs, run history, approval gates, and timelines.',
}

export default function BusinessWorkflowsPage() {
  return <BusinessWorkspace route="workflows" />
}
