import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'AIBeat Business Workspace',
  description: 'AIBeat Business operating console for AI stack intelligence, governed workflows, shared business memory, approvals, and ROI.',
  alternates: { canonical: '/business' },
}

export default function BusinessPage() {
  return <BusinessWorkspace route="dashboard" />
}
