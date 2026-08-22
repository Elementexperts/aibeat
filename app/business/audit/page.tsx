import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Audit Log | AIBeat Business',
  description: 'AIBeat Business audit log for workflows, agents, tools, approvals, and action results.',
}

export default function BusinessAuditPage() {
  return <BusinessWorkspace route="audit" />
}
