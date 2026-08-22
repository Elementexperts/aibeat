import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'AI Stack | AIBeat Business',
  description: 'AIBeat Business AI stack inventory, tool usage, seat utilization, approvals, and spend intelligence.',
}

export default function BusinessAIStackPage() {
  return <BusinessWorkspace route="ai-stack" />
}
