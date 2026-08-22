import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Approvals | AIBeat Business',
  description: 'AIBeat Business approval center for approve, edit, reject, and workflow continuation decisions.',
}

export default function BusinessApprovalsPage() {
  return <BusinessWorkspace route="approvals" />
}
