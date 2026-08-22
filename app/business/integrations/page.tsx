import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Integrations | AIBeat Business',
  description: 'AIBeat Business connector architecture for CRM, analytics, documents, web research, email, and collaboration systems.',
}

export default function BusinessIntegrationsPage() {
  return <BusinessWorkspace route="integrations" />
}
