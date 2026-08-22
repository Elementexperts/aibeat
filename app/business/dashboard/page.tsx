import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Business Dashboard | AIBeat Business',
  description: 'AIBeat Business dashboard for active workflows, approvals, agent findings, AI spend, potential savings, and ROI.',
}

export default function BusinessDashboardPage() {
  return <BusinessWorkspace route="dashboard" />
}
