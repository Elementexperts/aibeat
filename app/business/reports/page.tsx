import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Reports | AIBeat Business',
  description: 'AIBeat Business ROI and performance reporting for workflows, approvals, AI spend, and estimated business impact.',
}

export default function BusinessReportsPage() {
  return <BusinessWorkspace route="reports" />
}
