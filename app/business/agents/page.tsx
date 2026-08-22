import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Agents | AIBeat Business',
  description: 'The five AIBeat Business MVP agents with industry-specific behavior and structured output contracts.',
}

export default function BusinessAgentsPage() {
  return <BusinessWorkspace route="agents" />
}
